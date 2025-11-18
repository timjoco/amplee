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
import {
  addOutline,
  copyOutline,
  send as sendIcon,
  trashOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
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
};

type ReactionRow = {
  message_id: number;
  user_id: string;
  emoji: string;
};

export default function ChatTabMobile({
  eventId,
  isAdmin,
}: {
  eventId: string;
  isAdmin: boolean;
}) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const messagesRef = useRef<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const userRef = useRef<any | null>(null); // cache supabase user object

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const profilesById = useRef<Map<string, ProfileLite>>(new Map());

  const [reactions, setReactions] = useState<
    Record<string, Record<string, number>>
  >({});
  const [myReactions, setMyReactions] = useState<
    Record<string, Record<string, true>>
  >({});

  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);

  const longPressTimeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);

  const [sheetMessageId, setSheetMessageId] = useState<string | null>(null);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // keep messagesRef in sync with state, so we can use it in subscriptions
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.warn('[haptics error]', e);
    }
  }, []);

  const MOVE_THRESHOLD_PX = 12;

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
      }, 350);
    },
    [triggerHaptic]
  );

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

  const hasInput = input.trim().length > 0;

  // load current user once
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

  // realtime update for deleting and updating messages (not inserts)
  useEffect(() => {
    const ch = supabase
      .channel(`event:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT + UPDATE + DELETE
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // handled in separate INSERT-only effect
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

  // initial load
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
        .order('created_at', { ascending: true })
        .limit(500);

      if (!alive) return;
      if (error) {
        console.error('[chat load error]', error);
      }

      (data ?? []).forEach((m: any) => {
        if (m.profiles?.id) profilesById.current.set(m.profiles.id, m.profiles);
      });

      const normalized = ((data as any[]) ?? []).map((m) => ({
        ...m,
        id: String(m.id),
      })) as ChatMsg[];

      setMessages(normalized);
      setLoading(false);

      const ids = normalized.map((m) => m.id);
      if (ids.length) void loadReactionsFor(ids);

      setTimeout(
        () => bottomRef.current?.scrollIntoView({ behavior: 'auto' }),
        0
      );
    })();

    return () => {
      alive = false;
    };
  }, [eventId, loadReactionsFor]);

  // realtime inserts
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

          bottomRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId]);

  // realtime reactions (no more auth.getUser, no resubscribe on every message)
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

          // ignore reactions for messages we don't have
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

  // keyboard listeners → shift chat up
  useEffect(() => {
    if (Capacitor.getPlatform() === 'web') return;

    let showSub: PluginListenerHandle | null = null;
    let hideSub: PluginListenerHandle | null = null;

    const setup = async () => {
      showSub = await Keyboard.addListener('keyboardWillShow', (info) => {
        const height = info.keyboardHeight ?? 0;
        setKeyboardOffset(height);

        setTimeout(
          () =>
            bottomRef.current?.scrollIntoView({
              behavior: 'smooth',
              block: 'end',
            }),
          80
        );
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
  }, []);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const numericId = Number(messageId);
      if (!Number.isFinite(numericId)) return;

      const userId = userRef.current?.id as string | undefined;
      if (!userId) return;

      const iHadItBefore = !!myReactions[messageId]?.[emoji];

      // optimistic update
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
          // rollback
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
          // rollback
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
    [myReactions]
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
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });

    const { error } = await supabase
      .from('event_messages')
      .insert({ event_id: eventId, user_id: userId, body });

    if (error) {
      console.error('[chat send error]', error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInput(body);
    }
  }, [input, eventId]);

  const sendQuickStatus = useCallback(
    async (body: string) => {
      const text = body.trim();
      if (!text) return;

      const user = userRef.current;
      if (!user) return;

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

      const optimisticId = `status-${Date.now()}`;
      const optimisticMsg: ChatMsg = {
        id: optimisticId,
        event_id: eventId,
        user_id: userId,
        body: text,
        created_at: new Date().toISOString(),
        profiles: me,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });

      const { error } = await supabase
        .from('event_messages')
        .insert({ event_id: eventId, user_id: userId, body: text });

      if (error) {
        console.error('[quick status send error]', error);
        setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      }
    },
    [eventId]
  );

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
                260
              )}px)`
            : 'none',
        transition: 'transform 160ms ease-out',
      }}
    >
      {/* STATUS PICKER OVERLAY */}
      {showStatusPicker && (
        <StatusPickerPopover
          onClose={() => setShowStatusPicker(false)}
          onPick={(body) => {
            void sendQuickStatus(body);
            setShowStatusPicker(false);
          }}
        />
      )}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 0 4px',
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
          <div style={{ padding: 16, opacity: 0.8 }}>
            <strong>Welcome to the Green Room.</strong>
            <br />
            This is your band’s hub for this event. Tap the box below to say
            hello.
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
                        {/* Avatar */}
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
                            updatedAt={m.profiles?.updated_at ?? undefined} // 👈 NEW
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
                          {/* Name + date/time */}
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
                          </div>

                          {/* Body */}
                          <div
                            style={{
                              fontSize: 16,
                              whiteSpace: 'pre-wrap',
                              wordBreak: 'break-word',
                              color: 'rgba(237,235,255,0.92)',
                            }}
                          >
                            {m.body}
                          </div>

                          {/* Reactions */}
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
          open={
            !!activeMessageId &&
            !!messages.find((m) => m.id === activeMessageId)
          }
          message={messages.find((m) => m.id === activeMessageId) ?? null}
          canEdit={canEdit}
          canDelete={canDelete}
          onClose={() => setActiveMessageId(null)}
          onDelete={async () => {
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
          }}
          onReact={(emoji) => {
            if (!activeMessageId) return;
            void toggleReaction(activeMessageId, emoji);
          }}
          onEdit={(messageId, newBody) => {
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
          }}
        />
      )}
      {/* COMPOSER */}
      <div
        style={{
          background: '#050509',
          borderTop: '0.5px solid rgba(88,28,135,0.7)',
          paddingBottom: 'env(safe-area-inset-bottom)',
          width: '100%',
          marginInline: 0,
        }}
      >
        <div
          style={{
            paddingTop: 4,
            paddingInline: 10,
            paddingBottom: 4,
            display: 'flex',
            alignItems: 'flex-end',
            gap: 6,
          }}
        >
          {/* + STATUS BUTTON (left bubble) */}
          <button
            type="button"
            onClick={() => {
              setShowStatusPicker((v) => !v);
              void triggerHaptic();
            }}
            aria-label="Set status"
            style={{
              width: 40,
              height: 40,
              borderRadius: 999,
              border: 'none',
              background: '#111118',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              color: '#EDE9FE',
              boxShadow: '0 4px 14px rgba(0,0,0,0.6)',
              cursor: 'pointer',
            }}
          >
            <IonIcon icon={addOutline} style={{ fontSize: 22 }} />
          </button>

          <div
            style={{
              flex: 1,
              height: 40,
              borderRadius: 999,
              background: '#111118',
              paddingInline: 14,
              display: 'flex',
              alignItems: 'center',
              boxShadow: '0 4px 18px rgba(0,0,0,0.7)',
            }}
          >
            <IonTextarea
              value={input}
              placeholder="Message the band…"
              autoGrow={false}
              rows={1}
              onIonInput={(e) => setInput(e.detail.value ?? '')}
              onFocus={() => {
                setTimeout(
                  () =>
                    bottomRef.current?.scrollIntoView({
                      behavior: 'smooth',
                      block: 'end',
                    }),
                  120
                );
              }}
            />
          </div>

          {/* SEND BUTTON (right bubble) */}
          {hasInput && (
            <button
              type="button"
              onClick={send}
              aria-label="Send message"
              style={{
                width: 40,
                height: 40,
                borderRadius: 999,
                border: 'none',
                background:
                  'radial-gradient(circle at top left, rgba(168,85,247,0.85), rgba(88,28,135,1))',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
                boxShadow: '0 4px 16px rgba(0,0,0,0.85)',
                color: '#F9FAFB',
                cursor: 'pointer',
              }}
            >
              <IonIcon icon={sendIcon} style={{ fontSize: 20 }} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ReactionBarMobile({
  reactions,
  myReactions,
  onToggle,
  showAddButton = true,
}: {
  reactions: Record<string, number>;
  myReactions: Record<string, true>;
  onToggle: (emoji: string) => void;
  showAddButton?: boolean;
}) {
  const [open, setOpen] = useState(false);

  const entries = Object.entries(reactions).sort((a, b) => b[1] - a[1]);
  const hasReactions = entries.length > 0;

  const purpleBorder = 'rgba(150,120,255,0.9)';
  const purpleGlow = 'rgba(150,120,255,0.35)';

  return (
    <div
      style={{
        marginTop: hasReactions ? 6 : 0,
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 6,
          alignItems: 'center',
        }}
      >
        {hasReactions &&
          entries.map(([emoji, count]) => {
            const mine = !!myReactions[emoji];
            return (
              <button
                key={emoji}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggle(emoji);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 9px',
                  borderRadius: 999,
                  fontSize: 12,
                  border: mine
                    ? `1px solid ${purpleBorder}`
                    : '1px solid rgba(255,255,255,0.25)',
                  background: mine
                    ? 'radial-gradient(circle at top left, rgba(180,160,255,0.36), rgba(12,10,24,0.95))'
                    : 'rgba(20,18,32,0.9)',
                  boxShadow: mine
                    ? `0 0 0 1px ${purpleGlow}, 0 0 12px rgba(0,0,0,0.65)`
                    : '0 0 0 1px rgba(0,0,0,0.4)',
                  color: '#fff',
                  cursor: 'pointer',
                  minHeight: 24,
                }}
              >
                <span aria-hidden style={{ fontSize: 13 }}>
                  {emoji}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    opacity: 0.9,
                  }}
                >
                  {count}
                </span>
              </button>
            );
          })}

        {showAddButton && (
          <button
            type="button"
            aria-label="Add reaction"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              border: '1px dashed rgba(255,255,255,0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(8,8,12,0.96)',
              color: '#ffffff',
              padding: 0,
              fontSize: 18,
              lineHeight: 1,
            }}
          >
            +
          </button>
        )}
      </div>

      {showAddButton && open && (
        <EmojiGridMobile
          emojis={[
            '👍',
            '❤️',
            '😂',
            '👀',
            '🔥',
            '🎉',
            '🙏',
            '👏',
            '😮',
            '😢',
            '😡',
            '💯',
            '🤘',
            '🎶',
            '⭐️',
          ]}
          onPick={(emoji) => {
            onToggle(emoji);
            setOpen(false);
          }}
        />
      )}
    </div>
  );
}

function EmojiGridMobile({
  emojis,
  onPick,
}: {
  emojis: string[];
  onPick: (emoji: string) => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1.75rem)',
        gap: 4,
        padding: 6,
        borderRadius: 10,
        background: 'rgba(8,8,12,0.98)',
        border: '1px solid rgba(255,255,255,0.12)',
        maxWidth: 280,
      }}
    >
      {emojis.map((e) => (
        <button
          key={e}
          type="button"
          aria-label={`React with ${e}`}
          onClick={() => onPick(e)}
          style={{
            fontSize: 18,
            lineHeight: 1,
            textAlign: 'center',
            padding: 2,
            borderRadius: 4,
            border: 'none',
            background: 'transparent',
            color: '#fff',
            cursor: 'pointer',
          }}
        >
          {e}
        </button>
      ))}
    </div>
  );
}

function StatusPickerPopover({
  onClose,
  onPick,
}: {
  onClose: () => void;
  onPick: (body: string) => void;
}) {
  const handlePick = (body: string) => {
    if (Capacitor.getPlatform() !== 'web') {
      Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
    }
    onPick(body);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'transparent',
        zIndex: 50,
        display: 'flex',
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          marginLeft: 12,
          marginBottom: 70,
          background: 'rgba(9,9,13,0.98)',
          borderRadius: 20,
          padding: '12px 14px 14px',
          minWidth: 260,
          border: '1px solid rgba(148,163,184,0.45)',
          boxShadow: '0 20px 45px rgba(0,0,0,0.95)',
        }}
      >
        {/* Arrival */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#F9FAFB',
            marginBottom: 8,
          }}
        >
          Gigs
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
            marginBottom: 10,
          }}
        >
          <StatusChip
            emoji="🚙"
            label="On the way"
            onClick={() => {
              handlePick('🚙 On the way');
              onClose();
            }}
          />
          <StatusChip
            emoji="✅"
            label="Arrived"
            onClick={() => {
              handlePick('✅ Arrived');
              onClose();
            }}
          />
          <StatusChip
            emoji="🕒"
            label="Running late"
            onClick={() => {
              handlePick('🕒 Running late');
              onClose();
            }}
          />
          <StatusChip
            emoji="🎵"
            label="At soundcheck"
            onClick={() => {
              handlePick('🎵 At soundcheck');
              onClose();
            }}
          />
        </div>

        {/* General */}
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#F9FAFB',
            marginBottom: 8,
          }}
        >
          General
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 8,
          }}
        >
          <StatusChip
            emoji="💬"
            label="Need info"
            onClick={() => {
              handlePick('💬 Need info');
              onClose();
            }}
          />
          <StatusChip
            emoji="🥤"
            label="Break"
            onClick={() => {
              handlePick('🥤 Break');
              onClose();
            }}
          />
          <StatusChip
            emoji="🔄"
            label="Swapping gear"
            onClick={() => {
              handlePick('🔄 Swapping gear');
              onClose();
            }}
          />
          <StatusChip
            emoji="🎙"
            label="Ready"
            onClick={() => {
              handlePick('🎙 Ready');
              onClose();
            }}
          />
        </div>
      </div>
    </div>
  );
}

function StatusChip({
  emoji,
  label,
  onClick,
}: {
  emoji: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        borderRadius: 999,
        border: '1px solid rgba(55,65,81,0.9)',
        background:
          'radial-gradient(circle at top left, rgba(255,255,255,0.05), rgba(15,23,42,0.98))',
        color: '#E5E7EB',
        fontSize: 14,
        textAlign: 'left',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 18 }}>{emoji}</span>
      <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{label}</span>
    </button>
  );
}

function MessageActionSheet({
  open,
  message,
  canEdit,
  canDelete,
  onClose,
  onDelete,
  onReact,
  onEdit,
}: {
  open: boolean;
  message: ChatMsg | null;
  canEdit: boolean;
  canDelete: boolean;
  onClose: () => void;
  onDelete: () => void;
  onReact: (emoji: string) => void;
  onEdit: (messageId: string, newBody: string) => void;
}) {
  const [dragStartY, setDragStartY] = useState<number | null>(null);
  const [offset, setOffset] = useState(0);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');

  const neon = 'rgba(168,85,247,0.9)';
  const darkCard = 'rgba(10,10,20,0.96)';

  useEffect(() => {
    if (!message) return;
    setDraft(message.body ?? '');
    setIsEditing(false);
    setConfirmingDelete(false);
    setOffset(0);
  }, [message]);

  if (!open || !message) return null;

  const { id, profiles, body } = message;
  const displayName = profiles?.display_name || 'Member';

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    setDragStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (dragStartY == null || e.touches.length !== 1) return;
    const y = e.touches[0].clientY;
    const delta = y - dragStartY;
    if (delta > 0) setOffset(Math.min(delta, 160));
  };

  const handleTouchEnd = () => {
    if (offset > 60) {
      handleClose();
    }
    setDragStartY(null);
    setOffset(0);
  };

  const handleClose = () => {
    setConfirmingDelete(false);
    setIsEditing(false);
    onClose();
  };

  const triggerLightHaptic = () => {
    if (Capacitor.getPlatform() === 'web') return;
    Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
  };

  const handleCopy = async () => {
    const text = (body ?? '').toString();
    const { clipboard } = navigator as Navigator & { clipboard?: Clipboard };

    if (clipboard?.writeText) {
      await clipboard.writeText(text);
    } else {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }

    triggerLightHaptic();
    handleClose();
  };

  const handleStartEdit = () => {
    if (!canEdit) return;
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setDraft(body ?? '');
    setIsEditing(false);
  };

  const handleSaveEdit = () => {
    const trimmed = draft.trim();
    if (!trimmed || trimmed === body) {
      setIsEditing(false);
      return;
    }
    triggerLightHaptic();
    onEdit(id, trimmed);
    handleClose();
  };

  return (
    <div
      onClick={handleClose}
      style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.45)',
        zIndex: 40,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{
          width: '100%',
          background: '#050509',
          transform: `translateY(${offset}px)`,
          transition: dragStartY == null ? 'transform 160ms ease-out' : 'none',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: '12px 16px 24px',
        }}
      >
        {/* grab handle */}
        <div
          style={{
            width: 36,
            height: 4,
            borderRadius: 999,
            background: 'rgba(180,180,200,0.35)',
            margin: '0 auto 14px',
          }}
        />

        {/* editable preview card */}
        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 14,
            background: darkCard,
            border: '1px solid rgba(148,163,184,0.45)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'baseline',
              justifyContent: 'space-between',
              gap: 8,
              marginBottom: 6,
            }}
          >
            <div
              style={{
                fontSize: 11,
                color: 'rgba(156,163,175,0.95)',
              }}
            >
              {displayName}
            </div>

            {canEdit && !isEditing && (
              <button
                type="button"
                onClick={handleStartEdit}
                style={{
                  borderRadius: 999,
                  border: '1px solid rgba(148,163,184,0.7)',
                  background: 'rgba(15,23,42,0.95)',
                  color: '#E5E7EB',
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '4px 10px',
                  textTransform: 'uppercase',
                  letterSpacing: 0.08,
                  cursor: 'pointer',
                }}
              >
                Edit
              </button>
            )}
          </div>

          {!isEditing || !canEdit ? (
            <div
              style={{
                fontSize: 14,
                color: '#EDE9FE',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {body}
            </div>
          ) : (
            <>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                rows={4}
                autoFocus
                style={{
                  width: '100%',
                  borderRadius: 10,
                  border: '1px solid rgba(148,163,184,0.8)',
                  background: 'rgba(15,23,42,0.98)',
                  color: '#E5E7EB',
                  fontSize: 14,
                  padding: 8,
                  resize: 'none',
                  outline: 'none',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginTop: 8,
                  justifyContent: 'flex-end',
                }}
              >
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 999,
                    border: '1px solid rgba(148,163,184,0.8)',
                    background: 'rgba(15,23,42,0.95)',
                    color: 'rgba(209,213,219,0.96)',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: '1px solid rgba(216,180,254,0.9)',
                    background:
                      'linear-gradient(135deg, rgba(147,51,234,0.96), rgba(107,58,157,0.98))',
                    color: '#F9FAFB',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Save changes
                </button>
              </div>
            </>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 10,
            marginBottom: 18,
          }}
        >
          {[
            '👍',
            '❤️',
            '😂',
            '👀',
            '🔥',
            '🎉',
            '🙏',
            '👏',
            '😮',
            '😢',
            '😡',
            '💯',
            '🤘',
            '⭐️',
          ].map((emoji) => (
            <div
              key={emoji}
              style={{
                padding: 4,
                borderRadius: 12,
                background: darkCard,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 40,
                minHeight: 40,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  triggerLightHaptic();
                  onReact(emoji);
                  handleClose();
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  border: 'none',
                  background: '#050509',
                  color: '#fff',
                  fontSize: 20,
                  lineHeight: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                }}
              >
                {emoji}
              </button>
            </div>
          ))}
        </div>

        {!confirmingDelete ? (
          <>
            <div
              onClick={handleCopy}
              style={{
                borderRadius: 14,
                background: darkCard,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                marginBottom: 8,
              }}
            >
              <IonIcon
                icon={copyOutline}
                style={{ fontSize: 20, opacity: 0.9, color: '#E5E7EB' }}
              />
              <span
                style={{
                  color: '#E5E7EB',
                  fontWeight: 600,
                  fontSize: 15,
                }}
              >
                Copy message
              </span>
            </div>

            {canDelete && (
              <div
                onClick={() => setConfirmingDelete(true)}
                style={{
                  borderRadius: 14,
                  background: darkCard,
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  cursor: 'pointer',
                }}
              >
                <IonIcon
                  icon={trashOutline}
                  color="danger"
                  style={{ fontSize: 20, opacity: 0.9 }}
                />
                <span
                  style={{
                    color: '#EF4444',
                    fontWeight: 700,
                    fontSize: 15,
                  }}
                >
                  Delete message
                </span>
              </div>
            )}
          </>
        ) : (
          <div
            style={{
              background: darkCard,
              borderRadius: 14,
              padding: '12px',
              border: `1px solid ${neon}`,
              marginTop: 8,
            }}
          >
            <p
              style={{
                color: '#FECACA',
                margin: 0,
                marginBottom: 10,
                fontSize: 14,
              }}
            >
              Delete this message for everyone?
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setConfirmingDelete(false)}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 12,
                  border: `1px solid ${neon}`,
                  background: darkCard,
                  color: '#E5E7EB',
                  fontSize: 14,
                  fontWeight: 500,
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete();
                  handleClose();
                }}
                style={{
                  flex: 1,
                  padding: '10px',
                  borderRadius: 12,
                  border: '1px solid rgba(248,113,113,0.9)',
                  background: 'rgba(70,10,20,0.9)',
                  color: '#FECACA',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Delete
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
