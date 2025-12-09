/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import { IonIcon, IonItem, IonList, IonSpinner, IonText } from '@ionic/react';
import { send as sendIcon } from 'ionicons/icons';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
  type TouchEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { SongPickerModal } from '../SongPickerModal';
import AvatarImageMobile from '../ui/AvatarImageMobile';
import {
  ComposerInput,
  SongTagData,
  hasContent,
  serializeMessage,
} from './Chat/ComposerInput';
import { MessageActionSheet } from './Chat/MessageActionSheet';
import { MessageBodyWithLinks } from './Chat/MessageBodyWithLinks';
import { ReactionBarMobile } from './Chat/ReactionBar/ReactionBarMobile';

type ProfileLite = {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  updated_at?: string | null;
};

type ChatMsg = {
  id: string;
  event_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: ProfileLite;
  status?: 'sending' | 'sent' | 'failed';
};

type ReactionRow = {
  message_id: number;
  user_id: string;
  emoji: string;
};

type LinkPreview = {
  title?: string;
  description?: string;
  image?: string;
  url: string;
};

// iOS keyboard animation curve
const IOS_KEYBOARD_TRANSITION =
  'padding-bottom 280ms cubic-bezier(0.17, 0.59, 0.4, 0.77)';

export default function ChatTabMobile({
  eventId,
  bandId,
  isAdmin,
}: {
  eventId: string;
  bandId?: string;
  isAdmin: boolean;
}) {
  const navigate = useNavigate();

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);

  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [sheetMessageId, setSheetMessageId] = useState<string | null>(null);

  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [reactions, setReactions] = useState<
    Record<string, Record<string, number>>
  >({});
  const [myReactions, setMyReactions] = useState<
    Record<string, Record<string, true>>
  >({});
  const [linkPreviews, setLinkPreviews] = useState<Record<string, LinkPreview>>(
    {}
  );

  // Song picker state
  const [songPickerOpen, setSongPickerOpen] = useState(false);

  // Tag songs in chat state
  const [inputText, setInputText] = useState('');
  const [songTags, setSongTags] = useState<SongTagData[]>([]);

  // Keyboard state
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const didInitialScrollRef = useRef(false);
  const userRef = useRef<any | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const profilesById = useRef<Map<string, ProfileLite>>(new Map());
  const longPressTimeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const fetchedPreviewsRef = useRef<Set<string>>(new Set());

  const INITIAL_LOAD_COUNT = 50;
  const MESSAGES_PER_PAGE = 50;
  const MOVE_THRESHOLD_PX = 12;

  const isNative = Capacitor.isNativePlatform();
  const platform = isNative ? Capacitor.getPlatform() : 'web';
  const isIOS = platform === 'ios';
  const isAndroid = platform === 'android';

  // Base offset when keyboard is closed
  const BASE_NAV_OFFSET = isAndroid ? 50 : 8;

  // Mirror latest messages into ref
  const messagesRef = useRef<ChatMsg[]>([]);
  messagesRef.current = messages;

  // Keyboard listeners
  useEffect(() => {
    if (!isNative || isIOS) return; // Skip on iOS - it handles keyboard natively

    let willShowSub: any;
    let willHideSub: any;
    let didShowSub: any;

    (async () => {
      try {
        willShowSub = await Keyboard.addListener('keyboardWillShow', (info) => {
          setKeyboardHeight(info.keyboardHeight);
        });

        willHideSub = await Keyboard.addListener('keyboardWillHide', () => {
          setKeyboardHeight(0);
        });

        // Fallback: Android sometimes doesn't fire willShow reliably
        didShowSub = await Keyboard.addListener('keyboardDidShow', (info) => {
          setKeyboardHeight((prev) => prev || info.keyboardHeight);
        });
      } catch (e) {
        console.warn('[keyboard listeners error]', e);
      }
    })();

    return () => {
      willShowSub?.remove?.();
      willHideSub?.remove?.();
      didShowSub?.remove?.();
    };
  }, [isNative, isIOS]);

  const composerPaddingBottom = useMemo(() => {
    // Android: manually offset by keyboard height when open
    if (isAndroid && keyboardHeight > 0) {
      return keyboardHeight + 8;
    }

    // iOS (native handling) + keyboard closed state
    return `calc(env(safe-area-inset-bottom, 0px) + ${BASE_NAV_OFFSET}px)`;
  }, [isAndroid, keyboardHeight, BASE_NAV_OFFSET]);

  const extractLinks = useCallback((text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  }, []);

  useEffect(() => {
    console.log('[keyboard debug]', { keyboardHeight });
  }, [keyboardHeight]);

  const fetchLinkPreview = useCallback(
    async (url: string): Promise<LinkPreview | null> => {
      try {
        const response = await fetch(url);
        const html = await response.text();

        const titleMatch = html.match(
          /<meta property="og:title" content="([^"]+)"/
        );
        const descMatch = html.match(
          /<meta property="og:description" content="([^"]+)"/
        );
        const imageMatch = html.match(
          /<meta property="og:image" content="([^"]+)"/
        );

        return {
          title: titleMatch?.[1] || new URL(url).hostname,
          description: descMatch?.[1],
          image: imageMatch?.[1],
          url,
        };
      } catch (e) {
        console.warn('[link preview error]', e);
        return {
          title: new URL(url).hostname,
          url,
        };
      }
    },
    []
  );

  const fetchPreviewForMessage = useCallback(
    async (message: ChatMsg) => {
      if (fetchedPreviewsRef.current.has(message.id)) return;

      const links = extractLinks(message.body);
      if (links.length === 0) return;

      fetchedPreviewsRef.current.add(message.id);

      try {
        const preview = await fetchLinkPreview(links[0]);
        if (preview) {
          setLinkPreviews((prev) => ({ ...prev, [message.id]: preview }));
        }
      } catch (error) {
        console.error('[link preview fetch error]', error);
      }
    },
    [extractLinks, fetchLinkPreview]
  );

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.warn('[haptics error]', e);
    }
  }, []);

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  const smartScrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const container = scrollContainerRef.current;
      if (!container) return;
      if (!isNearBottom()) return;

      if (isAndroid) {
        container.scrollTop = container.scrollHeight;
      } else {
        bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
      }
    },
    [isNearBottom, isAndroid]
  );

  // Scroll to bottom when keyboard opens
  useEffect(() => {
    if (keyboardHeight > 0) {
      setTimeout(() => smartScrollToBottom('smooth'), 50);
    }
  }, [keyboardHeight, smartScrollToBottom]);

  const handlePressStart = useCallback(
    (
      id: string,
      e: TouchEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>
    ) => {
      if (longPressTimeoutRef.current != null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }

      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && 'changedTouches' in e) {
        const touchEvent = e as TouchEvent<HTMLDivElement>;
        if (touchEvent.touches.length > 0) {
          clientX = touchEvent.touches[0].clientX;
          clientY = touchEvent.touches[0].clientY;
        }
      } else if ('clientX' in e) {
        clientX = (e as MouseEvent<HTMLDivElement>).clientX;
        clientY = (e as MouseEvent<HTMLDivElement>).clientY;
      }

      pressStartRef.current = { x: clientX, y: clientY };

      longPressTimeoutRef.current = window.setTimeout(() => {
        setActiveMessageId(id);
        setSheetMessageId(id);
        void triggerHaptic();
      }, 500);
    },
    [triggerHaptic]
  );

  const handlePressMove = useCallback((e: TouchEvent<HTMLDivElement>) => {
    if (!pressStartRef.current || longPressTimeoutRef.current == null) return;
    if (e.touches.length !== 1) return;

    const { x, y } = pressStartRef.current;
    const t = e.touches[0];
    const dx = t.clientX - x;
    const dy = t.clientY - y;

    if (Math.abs(dx) > MOVE_THRESHOLD_PX || Math.abs(dy) > MOVE_THRESHOLD_PX) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  const handlePressEnd = useCallback(() => {
    if (longPressTimeoutRef.current != null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    pressStartRef.current = null;
  }, []);

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Chicago',
        hour12: true,
      }),
    []
  );

  const hasInput = hasContent(inputText, songTags);

  const handleSongTrigger = useCallback(() => {
    setSongPickerOpen(true);
  }, []);

  const handleSongSelect = useCallback(
    (song: { id: string; title: string }) => {
      setSongTags((prev) => [...prev, { id: song.id, title: song.title }]);
      setSongPickerOpen(false);
    },
    []
  );

  const handleSongPickerClose = useCallback(() => {
    setSongPickerOpen(false);
  }, []);

  const handleSongNavigate = useCallback(
    (songId: string) => {
      navigate(`/bands/${bandId}/songs/${songId}`);
    },
    [bandId, navigate]
  );

  // Fetch current user
  useEffect(() => {
    let alive = true;
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive) return;
      setMyUserId(user?.id ?? null);
      userRef.current = user ?? null;
    })();
    return () => {
      alive = false;
    };
  }, []);

  const loadReactionsFor = useCallback(async (messageIds: string[]) => {
    const numericIds = messageIds.map(Number).filter(Number.isFinite);
    if (numericIds.length === 0) return;

    const { data, error } = await supabase
      .from('event_message_reactions')
      .select('message_id, emoji, user_id')
      .in('message_id', numericIds);

    if (error) {
      console.error('[reactions load error]', error);
      return;
    }

    const rows = (data ?? []) as ReactionRow[];

    const byMsg: Record<string, Record<string, number>> = {};
    const mine: Record<string, Record<string, true>> = {};

    const me = userRef.current?.id as string | undefined;

    for (const row of rows) {
      const mid = String(row.message_id);
      const emoji = row.emoji;

      byMsg[mid] ||= {};
      byMsg[mid][emoji] = (byMsg[mid][emoji] || 0) + 1;

      if (me && row.user_id === me) {
        mine[mid] ||= {};
        mine[mid][emoji] = true as const;
      }
    }

    setReactions((prev) => ({ ...prev, ...byMsg }));
    setMyReactions((prev) => ({ ...prev, ...mine }));
  }, []);

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMoreMessages || messagesRef.current.length === 0) {
      return;
    }

    setLoadingMore(true);

    const oldestMessage = messagesRef.current[0];
    const oldestTimestamp = oldestMessage.created_at;

    const { data, error } = await supabase
      .from('event_messages')
      .select(
        `
      id, event_id, user_id, body, created_at,
      profiles:profiles!event_messages_user_id_fkey (
        id, display_name, avatar_url, updated_at
      )
    `
      )
      .eq('event_id', eventId)
      .lt('created_at', oldestTimestamp)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_PER_PAGE);

    if (error) {
      console.error('[load more error]', error);
      setLoadingMore(false);
      return;
    }

    if (!data || data.length === 0) {
      setHasMoreMessages(false);
      setLoadingMore(false);
      return;
    }

    (data ?? []).forEach((m: any) => {
      if (m.profiles?.id) profilesById.current.set(m.profiles.id, m.profiles);
    });

    const normalized = (data as any[]).map((m) => ({
      ...m,
      id: String(m.id),
      status: 'sent' as const,
    })) as ChatMsg[];

    const reversed = normalized.reverse();

    setMessages((prev) => [...reversed, ...prev]);
    setHasMoreMessages(data.length === MESSAGES_PER_PAGE);

    const ids = reversed.map((m) => m.id);
    if (ids.length) {
      void loadReactionsFor(ids);
      reversed.forEach((msg) => {
        void fetchPreviewForMessage(msg);
      });
    }

    setLoadingMore(false);
  }, [
    eventId,
    loadingMore,
    hasMoreMessages,
    loadReactionsFor,
    fetchPreviewForMessage,
  ]);

  const handleScrollRef = useRef<(() => void) | null>(null);

  handleScrollRef.current = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (el.scrollTop < 200) {
      void loadMoreMessages();
    }
  }, [loadMoreMessages]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollHandler = () => handleScrollRef.current?.();
    el.addEventListener('scroll', scrollHandler);
    return () => {
      el.removeEventListener('scroll', scrollHandler);
    };
  }, []);

  // Initial messages load
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_messages')
        .select(
          `
        id, event_id, user_id, body, created_at,
        profiles:profiles!event_messages_user_id_fkey (
          id, display_name, avatar_url, updated_at
        )
      `
        )
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(INITIAL_LOAD_COUNT);

      if (!alive) return;

      if (error) {
        console.error('[chat load error]', error);
        setLoading(false);
        return;
      }

      (data ?? []).forEach((m: any) => {
        if (m.profiles?.id) profilesById.current.set(m.profiles.id, m.profiles);
      });

      const normalized = ((data as any[]) ?? []).map((m) => ({
        ...m,
        id: String(m.id),
        status: 'sent' as const,
      })) as ChatMsg[];

      const reversed = normalized.reverse();

      setMessages(reversed);
      setHasMoreMessages((data ?? []).length === INITIAL_LOAD_COUNT);

      didInitialScrollRef.current = false;

      setLoading(false);

      const ids = reversed.map((m) => m.id);
      if (ids.length) {
        void loadReactionsFor(ids);
        reversed.forEach((msg) => {
          void fetchPreviewForMessage(msg);
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [eventId, loadReactionsFor, fetchPreviewForMessage]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!loading && !didInitialScrollRef.current && messages.length > 0) {
      didInitialScrollRef.current = true;

      setTimeout(() => {
        bottomRef.current?.scrollIntoView({
          behavior: 'auto',
          block: 'end',
        });
      }, 30);
    }
  }, [loading, messages.length]);

  // Realtime inserts
  useEffect(() => {
    const ch = supabase
      .channel(`event:${eventId}:insert`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const row = payload.new as ChatMsg;

          let prof = profilesById.current.get(row.user_id);
          if (!prof) {
            const { data } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, updated_at')
              .eq('id', row.user_id)
              .single();
            if (data) {
              prof = data as ProfileLite;
              profilesById.current.set(row.user_id, prof);
            }
          }

          const enriched: ChatMsg = {
            ...row,
            id: String(row.id),
            profiles: prof,
            status: 'sent',
          };

          setMessages((prev) => {
            const idx = prev.findIndex(
              (m) =>
                String(m.id).startsWith('optimistic-') &&
                m.user_id === row.user_id &&
                m.body === row.body &&
                Math.abs(
                  new Date(m.created_at).getTime() -
                    new Date(row.created_at).getTime()
                ) < 10_000
            );
            if (idx !== -1) {
              const next = prev.slice();
              next[idx] = enriched;
              return next;
            }
            return [...prev, enriched];
          });

          void fetchPreviewForMessage(enriched);

          smartScrollToBottom('smooth');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId, smartScrollToBottom, fetchPreviewForMessage]);

  // Realtime reactions
  useEffect(() => {
    const channel = supabase
      .channel(`event:${eventId}:reactions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_message_reactions',
        },
        (payload) => {
          const base = (payload.new ??
            payload.old) as Partial<ReactionRow> | null;
          if (!base || typeof base.message_id !== 'number') return;

          const mid = String(base.message_id);

          const hasMessage = messagesRef.current.some((m) => m.id === mid);
          if (!hasMessage) return;

          const me = userRef.current?.id as string | undefined;

          if (me && base.user_id === me) {
            return;
          }

          if (payload.eventType === 'INSERT') {
            const row = payload.new as ReactionRow;
            const emoji = row.emoji;

            setReactions((prev) => {
              const curr = { ...(prev[mid] || {}) };
              curr[emoji] = (curr[emoji] || 0) + 1;
              return { ...prev, [mid]: curr };
            });
          }

          if (payload.eventType === 'DELETE') {
            const row = payload.old as ReactionRow;
            const emoji = row.emoji;

            setReactions((prev) => {
              const curr = { ...(prev[mid] || {}) };
              const nextCount = Math.max(0, (curr[emoji] || 1) - 1);
              if (nextCount <= 0) delete curr[emoji];
              else curr[emoji] = nextCount;
              return { ...prev, [mid]: curr };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const numericId = Number(messageId);
      if (!Number.isFinite(numericId)) return;

      const userId = userRef.current?.id as string | undefined;
      if (!userId) return;

      await triggerHaptic();

      const iHadItBefore = !!myReactions[messageId]?.[emoji];

      setReactions((prev) => {
        const curr = { ...(prev[messageId] || {}) };
        const next = (curr[emoji] || 0) + (iHadItBefore ? -1 : 1);
        if (next <= 0) delete curr[emoji];
        else curr[emoji] = next;
        return { ...prev, [messageId]: curr };
      });

      setMyReactions((prev) => {
        const mine = { ...(prev[messageId] || {}) };
        if (iHadItBefore) delete mine[emoji];
        else mine[emoji] = true as const;
        return { ...prev, [messageId]: mine };
      });

      if (iHadItBefore) {
        const { error } = await supabase
          .from('event_message_reactions')
          .delete()
          .match({ message_id: numericId, user_id: userId, emoji });

        if (error) {
          console.error('[reaction delete error]', error);
          setReactions((prev) => {
            const curr = { ...(prev[messageId] || {}) };
            curr[emoji] = (curr[emoji] || 0) + 1;
            return { ...prev, [messageId]: curr };
          });
          setMyReactions((prev) => {
            const mine = { ...(prev[messageId] || {}) };
            mine[emoji] = true as const;
            return { ...prev, [messageId]: mine };
          });
        }
      } else {
        const { error } = await supabase
          .from('event_message_reactions')
          .upsert(
            { message_id: numericId, user_id: userId, emoji },
            { onConflict: 'message_id,user_id,emoji' }
          );

        if (error) {
          console.error('[reaction upsert error]', error);
          setReactions((prev) => {
            const curr = { ...(prev[messageId] || {}) };
            const next = Math.max(0, (curr[emoji] || 1) - 1);
            if (next <= 0) delete curr[emoji];
            else curr[emoji] = next;
            return { ...prev, [messageId]: curr };
          });
          setMyReactions((prev) => {
            const mine = { ...(prev[messageId] || {}) };
            delete mine[emoji];
            return { ...prev, [messageId]: mine };
          });
        }
      }
    },
    [myReactions, triggerHaptic]
  );

  const send = useCallback(async () => {
    if (!hasContent(inputText, songTags)) return;

    const user = userRef.current;
    if (!user) return;

    const body = serializeMessage(inputText, songTags);

    const previousText = inputText;
    const previousTags = songTags;

    setInputText('');
    setSongTags([]);

    const userId = user.id as string;

    let me = profilesById.current.get(userId);
    if (!me) {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, updated_at')
        .eq('id', userId)
        .single();
      if (data) {
        me = data as ProfileLite;
        profilesById.current.set(userId, me);
      } else {
        me = { id: userId };
      }
    }

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: ChatMsg = {
      id: optimisticId,
      event_id: eventId,
      user_id: userId,
      body,
      created_at: new Date().toISOString(),
      profiles: me,
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    smartScrollToBottom('smooth');

    const { error } = await supabase
      .from('event_messages')
      .insert({ event_id: eventId, user_id: userId, body });

    if (error) {
      console.error('[chat send error]', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId ? { ...m, status: 'failed' as const } : m
        )
      );
      setInputText(previousText);
      setSongTags(previousTags);
    } else {
      // 🔔 New message might now be the last-message preview for this event
      window.dispatchEvent(
        new CustomEvent('amplee:event-message-updated', {
          detail: { eventId },
        })
      );
    }
  }, [inputText, songTags, eventId, smartScrollToBottom]);

  const isEmpty = !loading && messages.length === 0;

  const sheetMsg =
    sheetMessageId != null
      ? messages.find((m) => m.id === sheetMessageId) || null
      : null;

  const canEdit =
    !!sheetMsg && myUserId != null && sheetMsg.user_id === myUserId;

  const canDelete =
    !!sheetMsg &&
    (isAdmin || (myUserId != null && sheetMsg.user_id === myUserId));

  const activeMessage = activeMessageId
    ? messages.find((m) => m.id === activeMessageId) ?? null
    : null;

  const handleMessageActionClose = useCallback(() => {
    setActiveMessageId(null);
  }, []);

  const handleMessageDelete = useCallback(async () => {
    if (!activeMessageId || !canDelete) return;
    const id = activeMessageId;

    // Optimistically remove from local chat
    setMessages((prev) => prev.filter((m) => m.id !== id));

    const { error } = await supabase
      .from('event_messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[chat delete error]', error);
    } else {
      // 🔔 Tell all inboxes that this event's messages changed
      window.dispatchEvent(
        new CustomEvent('amplee:event-message-updated', {
          detail: { eventId },
        })
      );
    }

    setActiveMessageId(null);
  }, [activeMessageId, canDelete, eventId, supabase]);

  const handleMessageReact = useCallback(
    (emoji: string) => {
      if (!activeMessageId) return;
      void toggleReaction(activeMessageId, emoji);
    },
    [activeMessageId, toggleReaction]
  );

  const handleMessageEdit = useCallback(
    (messageId: string, newBody: string) => {
      const id = messageId;

      // Optimistically update message in this chat
      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, body: newBody } : m))
      );

      void (async () => {
        const { error } = await supabase
          .from('event_messages')
          .update({ body: newBody })
          .eq('id', id);

        if (error) {
          console.error('[chat edit error]', error);
        } else {
          // 🔔 Notify inboxes that the latest message for this event may have changed
          window.dispatchEvent(
            new CustomEvent('amplee:event-message-updated', {
              detail: { eventId },
            })
          );
        }
      })();
    },
    [eventId, supabase]
  );

  return (
    <div
      style={{
        position: 'relative',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#050509',
      }}
    >
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 0 12px',
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: 8,
            }}
          >
            <IonSpinner name="dots" />
            <IonText color="medium">Loading…</IonText>
          </div>
        ) : isEmpty ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-start',
              height: '100%',
              padding: '32px 24px 40px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                position: 'relative',
                marginBottom: 24,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: -20,
                  background:
                    'radial-gradient(circle, rgba(52, 211, 153, 0.15) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                  animation: 'pulse 3s ease-in-out infinite',
                }}
              />
              <svg
                width="80"
                height="80"
                viewBox="0 0 24 24"
                fill="none"
                style={{
                  position: 'relative',
                  filter: 'drop-shadow(0 0 12px rgba(52, 211, 153, 0.3))',
                }}
              >
                <path
                  d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 13.8214 2.48697 15.5291 3.33782 17L2.5 21.5L7 20.6622C8.47087 21.513 10.1786 22 12 22Z"
                  stroke="url(#chat-gradient)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M8 12H8.01M12 12H12.01M16 12H16.01"
                  stroke="url(#chat-gradient)"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <defs>
                  <linearGradient
                    id="chat-gradient"
                    x1="2"
                    y1="2"
                    x2="22"
                    y2="22"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#34D399" />
                    <stop offset="1" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>
            </div>

            <h2
              style={{
                fontSize: 24,
                fontWeight: 800,
                background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                marginBottom: 12,
                letterSpacing: -0.5,
              }}
            >
              Welcome to the Green Room
            </h2>

            <p
              style={{
                fontSize: 16,
                color: 'rgba(229, 231, 235, 0.85)',
                marginBottom: 8,
                lineHeight: 1.5,
              }}
            >
              Your band's private hub for this event
            </p>

            <p
              style={{
                fontSize: 15,
                color: 'rgba(156, 163, 175, 0.9)',
                fontWeight: 500,
              }}
            >
              Message the band to get started
            </p>

            <div
              style={{
                marginTop: 32,
                display: 'flex',
                gap: 12,
                opacity: 0.4,
              }}
            >
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#34D399',
                  animation: 'fadeInOut 2s ease-in-out infinite',
                }}
              />
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#34D399',
                  animation: 'fadeInOut 2s ease-in-out infinite 0.4s',
                }}
              />
              <div
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: '#34D399',
                  animation: 'fadeInOut 2s ease-in-out infinite 0.8s',
                }}
              />
            </div>

            <style>
              {`
                @keyframes pulse {
                  0%, 100% {
                    opacity: 1;
                  }
                  50% {
                    opacity: 0.6;
                  }
                }
                
                @keyframes fadeInOut {
                  0%, 100% {
                    opacity: 0.2;
                  }
                  50% {
                    opacity: 1;
                  }
                }
              `}
            </style>
          </div>
        ) : (
          <IonList
            lines="none"
            style={{
              background: 'transparent',
              paddingLeft: 0,
              paddingRight: 0,
            }}
          >
            {loadingMore && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  padding: '12px 0',
                }}
              >
                <IonSpinner name="dots" />
              </div>
            )}

            {(() => {
              let lastDateKey: string | null = null;

              return messages.map((m) => {
                const msgDate = new Date(m.created_at);

                const day = String(msgDate.getDate()).padStart(2, '0');
                const month = String(msgDate.getMonth() + 1).padStart(2, '0');
                const year = String(msgDate.getFullYear()).slice(-2);
                const dateLabel = `${month}/${day}/${year}`;

                const dateKey = msgDate.toISOString().slice(0, 10);
                const showDateDivider = dateKey !== lastDateKey;
                lastDateKey = dateKey;
                const dateDividerLabel = msgDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                const name = m.profiles?.display_name || 'Member';
                const isActive = activeMessageId === m.id;

                return (
                  <div key={m.id}>
                    {showDateDivider && (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          margin: '6px 0 4px',
                          opacity: 0.9,
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            height: 1,
                            background: 'rgba(255,255,255,0.08)',
                          }}
                        />
                        <span
                          style={{
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 0.12,
                            color: 'rgba(255,255,255,0.8)',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {dateDividerLabel}
                        </span>
                        <div
                          style={{
                            flex: 1,
                            height: 1,
                            background: 'rgba(255,255,255,0.08)',
                          }}
                        />
                      </div>
                    )}

                    <IonItem
                      lines="none"
                      style={{
                        '--background': 'transparent',
                        '--padding-start': '0px',
                        '--inner-padding-end': '0px',
                        paddingInline: 0,
                        paddingBlock: 4,
                      }}
                    >
                      <div
                        onTouchStart={(e) => handlePressStart(m.id, e)}
                        onTouchMove={handlePressMove}
                        onTouchEnd={handlePressEnd}
                        onTouchCancel={handlePressEnd}
                        onMouseDown={(e) => handlePressStart(m.id, e)}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                          borderRadius: 14,
                          marginInline: 0,
                          padding: isActive ? '8px 12px' : '6px 8px',
                          background: isActive
                            ? 'rgba(24,24,38,0.97)'
                            : 'transparent',
                          boxShadow: isActive
                            ? '0 0 0 1px rgba(139,92,246,0.5)'
                            : 'none',
                          cursor: 'pointer',
                        }}
                      >
                        <div
                          style={{
                            flexShrink: 0,
                            marginTop: 2,
                            marginLeft: -5,
                          }}
                        >
                          <AvatarImageMobile
                            name={name}
                            bucket="profile-avatars"
                            avatarPath={m.profiles?.avatar_url ?? undefined}
                            updatedAt={m.profiles?.updated_at ?? undefined}
                            size={36}
                            style={{ borderWidth: 1 }}
                          />
                        </div>

                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'baseline',
                              gap: 6,
                              marginBottom: 2,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: 13,
                                letterSpacing: 0.2,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                maxWidth: '60%',
                              }}
                            >
                              {name}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                opacity: 0.65,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              {dateLabel} · {timeFmt.format(msgDate)}
                            </span>

                            {m.status === 'sending' && (
                              <IonSpinner
                                name="dots"
                                style={{
                                  width: 14,
                                  height: 14,
                                  opacity: 0.6,
                                }}
                              />
                            )}
                            {m.status === 'failed' && (
                              <span
                                style={{
                                  fontSize: 11,
                                  color: '#EF4444',
                                  fontWeight: 600,
                                }}
                              >
                                Failed
                              </span>
                            )}
                          </div>

                          <MessageBodyWithLinks
                            body={m.body}
                            preview={linkPreviews[m.id]}
                            status={m.status}
                            onSongNavigate={handleSongNavigate}
                          />

                          <ReactionBarMobile
                            reactions={reactions[m.id] || {}}
                            myReactions={myReactions[m.id] || {}}
                            onToggle={(emoji) => toggleReaction(m.id, emoji)}
                            showAddButton={false}
                          />
                        </div>
                      </div>
                    </IonItem>
                  </div>
                );
              });
            })()}
            <div ref={bottomRef} />
          </IonList>
        )}
      </div>

      {sheetMsg && (
        <MessageActionSheet
          open={!!activeMessageId}
          message={activeMessage}
          canEdit={canEdit}
          canDelete={canDelete}
          onClose={handleMessageActionClose}
          onDelete={handleMessageDelete}
          onReact={handleMessageReact}
          onEdit={handleMessageEdit}
        />
      )}

      <SongPickerModal
        isOpen={songPickerOpen}
        bandId={bandId}
        onClose={handleSongPickerClose}
        onSelect={handleSongSelect}
      />

      {/* Composer + send button */}
      <div
        style={{
          borderTop: '1px solid rgba(60, 61, 68, 0.25)',
          paddingBottom: composerPaddingBottom,
          width: '100%',
          marginInline: 0,
          backdropFilter: 'blur(10px)',
          transition: isAndroid
            ? 'padding-bottom 280ms cubic-bezier(0.17, 0.59, 0.4, 0.77)'
            : 'none',
        }}
      >
        <div
          style={{
            paddingTop: 10,
            paddingInline: 10,
            paddingBottom: 4,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 8,
          }}
        >
          <ComposerInput
            value={inputText}
            songTags={songTags}
            placeholder="Message the band..."
            onValueChange={setInputText}
            onSongTagsChange={setSongTags}
            onSongTrigger={handleSongTrigger}
            onFocus={() => setTimeout(() => smartScrollToBottom('smooth'), 120)}
            onSubmit={send}
          />

          <button
            type="button"
            onClick={send}
            aria-label="Send message"
            disabled={!hasInput}
            style={{
              width: 44,
              height: 47,
              borderRadius: 12,
              border: hasInput
                ? '1px solid rgba(52, 211, 153, 0.5)'
                : '1px solid rgba(148, 163, 184, 0.3)',
              background: hasInput
                ? 'rgba(52, 211, 153, 0.95)'
                : 'rgba(15, 23, 42, 0.8)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              boxShadow: hasInput
                ? '0 4px 16px rgba(52, 211, 153, 0.4)'
                : 'none',
              color: hasInput ? '#000000' : '#9ca3af',
              cursor: 'pointer',
              transform: hasInput ? 'scale(1)' : 'scale(0.95)',
              opacity: hasInput ? 1 : 0.6,
              transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <IonIcon icon={sendIcon} style={{ fontSize: 20 }} />
          </button>
        </div>
      </div>
    </div>
  );
}
