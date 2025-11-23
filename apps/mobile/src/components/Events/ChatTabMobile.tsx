/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Keyboard } from '@capacitor/keyboard';
import {
  IonIcon,
  IonItem,
  IonList,
  IonSpinner,
  IonText,
  IonTextarea,
} from '@ionic/react';
import { send as sendIcon } from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { MessageActionSheet } from '../Chat/MessageActionSheet';
import { MessageBodyWithLinks } from '../Chat/MessageBodyWithLinks';
import { ReactionBarMobile } from '../Chat/ReactionBar/ReactionBarMobile';

import AvatarImageMobile from '../ui/AvatarImageMobile';

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

export default function ChatTabMobile({
  eventId,
  isAdmin,
}: {
  eventId: string;
  isAdmin: boolean;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [sheetMessageId, setSheetMessageId] = useState<string | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
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
  const MAX_KEYBOARD_SHIFT = 65;
  const MOVE_THRESHOLD_PX = 12;

  // Mirror the latest messages into a ref so non-React code (infinite scroll,
  // realtime subscriptions) can always read current messages without causing re-renders.
  const messagesRef = useRef<ChatMsg[]>([]);
  messagesRef.current = messages;

  // Extract all HTTP/HTTPS URLs from a message body so we can decide
  // whether to generate link previews for that message.
  const extractLinks = useCallback((text: string): string[] => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.match(urlRegex) || [];
  }, []);

  // Fetch basic Open Graph metadata for a single URL (title, description, image)
  // so we can render a lightweight preview card under chat messages.
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

  // Given a single message, decide if it needs a link preview and fetch it once.
  // This is called at the "edges" (initial load, pagination, realtime inserts)
  // instead of in a useEffect over all messages to avoid extra re-renders.
  const fetchPreviewForMessage = useCallback(
    async (message: ChatMsg) => {
      // Guard: only fetch once per message id
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

  // Fire a small haptic combo on native to reinforce important interactions.
  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.warn('[haptics error]', e);
    }
  }, []);

  // Check if the user is already near the bottom so we don’t auto-scroll while they’re reading history.
  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  // Only scroll to the latest message when appropriate (e.g. sending/receiving), not on every render.
  const smartScrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      if (isNearBottom()) {
        bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
      }
    },
    [isNearBottom]
  );

  // Start tracking a press for long-press detection and remember where it began.
  const handlePressStart = useCallback(
    (
      id: string,
      e:
        | React.TouchEvent<HTMLDivElement>
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      if (longPressTimeoutRef.current != null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }

      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
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

  // Cancel the long-press if the user moves their finger too far (treat as a scroll, not a hold).
  const handlePressMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
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

  // Clear any pending long-press timeout once the finger/mouse is lifted.
  const handlePressEnd = useCallback(() => {
    if (longPressTimeoutRef.current != null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    pressStartRef.current = null;
  }, []);

  // Format message timestamps in a consistent, local “hh:mm am/pm” style.
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

  // Convenience flag for “is there anything non-whitespace in the composer?”
  const hasInput = input.trim().length > 0;

  // Fetching external data on mount
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

  //  Subscribing to external system (realtime updates/deletes)
  useEffect(() => {
    const ch = supabase
      .channel(`event:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            return;
          }

          if (payload.eventType === 'UPDATE') {
            const row = payload.new as any;
            const updatedId = String(row.id);
            const newBody = row.body as string;

            setMessages((prev) =>
              prev.map((m) =>
                m.id === updatedId ? { ...m, body: newBody } : m
              )
            );
          }

          if (payload.eventType === 'DELETE') {
            const oldRow = payload.old as any;
            if (!oldRow) return;

            const deletedId = String(oldRow.id);

            setMessages((prev) => prev.filter((m) => m.id !== deletedId));

            setReactions((prev) => {
              if (!prev[deletedId]) return prev;
              const next = { ...prev };
              delete next[deletedId];
              return next;
            });

            setMyReactions((prev) => {
              if (!prev[deletedId]) return prev;
              const next = { ...prev };
              delete next[deletedId];
              return next;
            });

            setLinkPreviews((prev) => {
              if (!prev[deletedId]) return prev;
              const next = { ...prev };
              delete next[deletedId];
              return next;
            });

            fetchedPreviewsRef.current.delete(deletedId);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId]);

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

  // Now stable because messagesRef updates during render
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
      // fetch link previews for older messages too
      reversed.forEach((msg) => {
        void fetchPreviewForMessage(msg);
      });
    }

    setLoadingMore(false);
  }, [eventId, loadingMore, hasMoreMessages, loadReactionsFor]);

  // ✅ OPTIMIZE: Use ref for callback to prevent listener recreation
  const handleScrollRef = useRef<(() => void) | null>(null);

  handleScrollRef.current = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    if (el.scrollTop < 200) {
      void loadMoreMessages();
    }
  }, [loadMoreMessages]);

  // Now only runs once, uses ref for callback
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollHandler = () => handleScrollRef.current?.();
    el.addEventListener('scroll', scrollHandler);
    return () => {
      el.removeEventListener('scroll', scrollHandler);
    };
  }, []);

  // Fetching external data on mount
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
        //  Fetch previews for initial messages
        reversed.forEach((msg) => {
          void fetchPreviewForMessage(msg);
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [eventId, loadReactionsFor, fetchPreviewForMessage]);

  // DOM manipulation after render
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

  //  Subscribing to external system (realtime inserts)
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

          // ✅ REFACTOR: Fetch preview for new message here
          void fetchPreviewForMessage(enriched);

          smartScrollToBottom('smooth');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId, smartScrollToBottom, fetchPreviewForMessage]);

  // Subscribing to external system (realtime reactions)
  useEffect(() => {
    const ch = supabase
      .channel(`event:${eventId}:reactions`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_message_reactions' },
        (payload) => {
          const base = (payload.new ??
            payload.old) as Partial<ReactionRow> | null;
          if (!base || typeof base.message_id !== 'number') return;

          const mid = String(base.message_id);

          const hasMessage = messagesRef.current.some((m) => m.id === mid);
          if (!hasMessage) return;

          if (payload.eventType === 'INSERT') {
            const row = payload.new as ReactionRow;
            const emoji = row.emoji;

            setReactions((prev) => {
              const curr = { ...(prev[mid] || {}) };
              curr[emoji] = (curr[emoji] || 0) + 1;
              return { ...prev, [mid]: curr };
            });

            const me = userRef.current?.id as string | undefined;
            if (me && row.user_id === me) {
              setMyReactions((prev) => ({
                ...prev,
                [mid]: { ...(prev[mid] || {}), [emoji]: true as const },
              }));
            }
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

            const me = userRef.current?.id as string | undefined;
            if (me && row.user_id === me) {
              setMyReactions((prev) => {
                const mine = { ...(prev[mid] || {}) };
                delete mine[emoji];
                return { ...prev, [mid]: mine };
              });
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId]);

  // Platform-specific event subscription
  useEffect(() => {
    if (Capacitor.getPlatform() === 'web') return;

    let showSub: PluginListenerHandle | null = null;
    let hideSub: PluginListenerHandle | null = null;

    const setup = async () => {
      showSub = await Keyboard.addListener('keyboardWillShow', (info) => {
        const height = info.keyboardHeight ?? 0;
        setKeyboardOffset(height);

        setTimeout(() => smartScrollToBottom('smooth'), 80);
      });

      hideSub = await Keyboard.addListener('keyboardWillHide', () => {
        setKeyboardOffset(0);
      });
    };

    void setup();

    return () => {
      showSub?.remove();
      hideSub?.remove();
    };
  }, [smartScrollToBottom]);

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
    const body = input.trim();
    if (!body) return;

    const user = userRef.current;
    if (!user) return;

    setInput('');

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
      setInput(body);
    }
  }, [input, eventId, smartScrollToBottom]);

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

  // handlers for Message Action Sheet modal
  const handleMessageActionClose = useCallback(() => {
    setActiveMessageId(null);
  }, []);

  const handleMessageDelete = useCallback(async () => {
    if (!activeMessageId || !canDelete) return;
    const id = activeMessageId;
    setMessages((prev) => prev.filter((m) => m.id !== id));
    const { error } = await supabase
      .from('event_messages')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('[chat delete error]', error);
    }
    setActiveMessageId(null);
  }, [activeMessageId, canDelete]);

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
        }
      })();
    },
    []
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

        transform:
          keyboardOffset > 0
            ? `translateY(-${Math.min(
                Math.max(keyboardOffset - 20, 0),
                MAX_KEYBOARD_SHIFT
              )}px)`
            : 'none',
        transition: 'transform 160ms ease-out',
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
              Message the band to get started 💬
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
      <div
        style={{
          borderTop: '1px solid rgba(60, 61, 68, 0.25)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
          width: '100%',
          marginInline: 0,
          backdropFilter: 'blur(10px)',
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
          <div
            style={{
              flex: 1,
              minHeight: 44,
              borderRadius: 12,
              background: 'rgba(52, 211, 153, 0.04))',
              border: '1px solid rgba(60, 61, 68, 0.89)',
              paddingInline: 14,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
            }}
          >
            <IonTextarea
              value={input}
              placeholder="Message the band…"
              autoGrow={false}
              rows={1}
              onIonInput={(e) => setInput(e.detail.value ?? '')}
              onFocus={() => {
                setTimeout(() => smartScrollToBottom('smooth'), 120);
              }}
              style={{
                '--color': '#e5e7eb',
                '--placeholder-color': '#9ca3af',
                fontSize: '16px',
              }}
            />
          </div>

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
