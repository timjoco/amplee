/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
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

export default function ChatTabMobile({ eventId }: { eventId: string }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const profilesById = useRef<Map<string, ProfileLite>>(new Map());

  // messageId -> { "👍": 2, "🔥": 1 }
  const [reactions, setReactions] = useState<
    Record<string, Record<string, number>>
  >({});

  // messageId -> { "👍": true, "🔥": true }
  const [myReactions, setMyReactions] = useState<
    Record<string, Record<string, true>>
  >({});

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

  /* ---------- helper: load reactions for messages (same idea as web) ---------- */
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

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const me = user?.id;

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

  /* ---------- initial load (mirrors web ChatTab) ---------- */
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

  /* ---------- realtime inserts (same reconciliation pattern as web) ---------- */
  useEffect(() => {
    const ch = supabase
      .channel(`event:${eventId}`)
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
            // match optimistic message if it exists (like web)
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

  /* ---------- realtime reactions (same table + patterns as web) ---------- */
  useEffect(() => {
    const idSet = new Set(messages.map((m) => m.id));

    const ch = supabase
      .channel(`event:${eventId}:reactions`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_message_reactions' },
        async (payload) => {
          const base = (payload.new ??
            payload.old) as Partial<ReactionRow> | null;
          if (!base || typeof base.message_id !== 'number') return;

          const mid = String(base.message_id);
          if (!idSet.has(mid)) return;

          if (payload.eventType === 'INSERT') {
            const emoji = (payload.new as ReactionRow).emoji;
            setReactions((prev) => {
              const curr = { ...(prev[mid] || {}) };
              curr[emoji] = (curr[emoji] || 0) + 1;
              return { ...prev, [mid]: curr };
            });

            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user && (payload.new as ReactionRow).user_id === user.id) {
              setMyReactions((prev) => ({
                ...prev,
                [mid]: { ...(prev[mid] || {}), [emoji]: true as const },
              }));
            }
          }

          if (payload.eventType === 'DELETE') {
            const emoji = (payload.old as ReactionRow).emoji;
            setReactions((prev) => {
              const curr = { ...(prev[mid] || {}) };
              const next = Math.max(0, (curr[emoji] || 1) - 1);
              if (next <= 0) delete curr[emoji];
              else curr[emoji] = next;
              return { ...prev, [mid]: curr };
            });

            const {
              data: { user },
            } = await supabase.auth.getUser();
            if (user && (payload.old as ReactionRow).user_id === user.id) {
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
  }, [eventId, messages]);

  /* ---------- optimistic reaction toggle (ported from web) ---------- */
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const numericId = Number(messageId);
      if (!Number.isFinite(numericId)) return;

      // optimistic
      setReactions((prev) => {
        const curr = { ...(prev[messageId] || {}) };
        const mine = myReactions[messageId] || {};
        const iHadIt = !!mine[emoji];

        const next = (curr[emoji] || 0) + (iHadIt ? -1 : 1);
        if (next <= 0) delete curr[emoji];
        else curr[emoji] = next;

        setMyReactions((mr) => {
          const nextMine = { ...(mr[messageId] || {}) };
          if (iHadIt) delete nextMine[emoji];
          else nextMine[emoji] = true as const;
          return { ...mr, [messageId]: nextMine };
        });

        return { ...prev, [messageId]: curr };
      });

      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const iHadItBefore = !!(
        myReactions[messageId] && myReactions[messageId][emoji]
      );

      if (iHadItBefore) {
        const { error } = await supabase
          .from('event_message_reactions')
          .delete()
          .match({ message_id: numericId, user_id: user.id, emoji });

        if (error) {
          console.error('[reaction delete error]', error);
          // rollback
          setReactions((prev) => {
            const curr = { ...(prev[messageId] || {}) };
            curr[emoji] = (curr[emoji] || 0) + 1;
            return { ...prev, [messageId]: curr };
          });
          setMyReactions((mr) => {
            const next = { ...(mr[messageId] || {}) };
            next[emoji] = true as const;
            return { ...mr, [messageId]: next };
          });
        }
      } else {
        const { error } = await supabase
          .from('event_message_reactions')
          .upsert(
            { message_id: numericId, user_id: user.id, emoji },
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
          setMyReactions((mr) => {
            const next = { ...(mr[messageId] || {}) };
            delete next[emoji];
            return { ...mr, [messageId]: next };
          });
        }
      }
    },
    [myReactions]
  );

  /* ---------- send message (same optimistic flow as web) ---------- */
  const send = useCallback(async () => {
    const body = input.trim();
    if (!body) return;
    setInput('');

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    let me = profilesById.current.get(user.id);
    if (!me) {
      const { data } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, updated_at')
        .eq('id', user.id)
        .single();
      if (data) {
        me = data as ProfileLite;
        profilesById.current.set(user.id, me);
      } else {
        me = { id: user.id };
      }
    }

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: ChatMsg = {
      id: optimisticId,
      event_id: eventId,
      user_id: user.id,
      body,
      created_at: new Date().toISOString(),
      profiles: me,
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });

    const { error } = await supabase
      .from('event_messages')
      .insert({ event_id: eventId, user_id: user.id, body });

    if (error) {
      console.error('[chat send error]', error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInput(body);
    }
  }, [input, eventId]);

  /* ---------- RENDER ---------- */
  const isEmpty = !loading && messages.length === 0;

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
      {/* messages scroll area */}
      <div
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '12px 12px 8px',
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
            This is your band’s hub for this event. Say hello to get started.
          </div>
        ) : (
          <IonList lines="none" style={{ background: 'transparent' }}>
            {(() => {
              let lastDateKey: string | null = null;

              return messages.map((m) => {
                const msgDate = new Date(m.created_at);
                const dateKey = msgDate.toISOString().slice(0, 10);
                const showDateDivider = dateKey !== lastDateKey;
                lastDateKey = dateKey;

                const dateLabel = msgDate.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                });

                const name = m.profiles?.display_name || 'Member';

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
                          {dateLabel}
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
                        paddingInline: 0,
                        paddingBlock: 10,
                      }}
                    >
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 10,
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            flexShrink: 0,
                            marginTop: 2,
                          }}
                        >
                          <AvatarImageMobile
                            name={name}
                            bucket="profile-avatars"
                            avatarPath={m.profiles?.avatar_url ?? undefined}
                            size={36}
                            style={{ borderWidth: 1 }}
                          />
                        </div>

                        {/* Message content */}
                        <div
                          style={{
                            flex: 1,
                            minWidth: 0,
                          }}
                        >
                          {/* Name + time */}
                          <div
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              gap: 8,
                              marginBottom: 2,
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
                              }}
                            >
                              {name}
                            </span>
                            <span
                              style={{
                                fontSize: 11,
                                opacity: 0.7,
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              {timeFmt.format(new Date(m.created_at))}
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

      {/* composer – pinned at bottom, keyboard resize handled by Capacitor */}
      <div
        style={{
          padding: '8px 10px',
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6px)',
          borderTop: '1px solid rgba(255,255,255,0.12)',
          display: 'flex',
          alignItems: 'flex-end',
          gap: 3,
          background: '#050509',
        }}
      >
        <IonTextarea
          value={input}
          placeholder="Message the band…"
          autoGrow
          rows={1}
          style={
            {
              flex: 1,
              fontSize: 16,
              '--padding-start': '10px',
              '--padding-end': '10px',
              '--padding-top': '8px',
              '--padding-bottom': '8px',
              '--background': '#050509',
              '--color': '#ffffff',
              borderRadius: '16px',
            } as any
          }
          onIonChange={(e) => setInput(e.detail.value ?? '')}
          onFocus={() => {
            setTimeout(
              () => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }),
              150
            );
          }}
        />
        <IonButton
          onClick={send}
          disabled={!input.trim()}
          style={{
            minWidth: 44,
            height: 40,
            borderRadius: '999px',
            padding: 0,
          }}
        >
          <IonIcon icon={sendIcon} />
        </IonButton>
      </div>
    </div>
  );
}

function ReactionBarMobile({
  reactions,
  myReactions,
  onToggle,
}: {
  reactions: Record<string, number>;
  myReactions: Record<string, true>;
  onToggle: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const entries = Object.entries(reactions).sort((a, b) => b[1] - a[1]);
  const hasReactions = entries.length > 0;

  const purpleBorder = 'rgba(150,120,255,0.9)';
  const purpleGlow = 'rgba(150,120,255,0.35)';

  return (
    <div
      style={{
        marginTop: 6,
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

        {/* add emoji button */}
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
      </div>

      {open && (
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
