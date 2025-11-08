/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import AddReactionIcon from '@mui/icons-material/AddReaction';
import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  CircularProgress,
  IconButton,
  Paper,
  Popper,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import AvatarImage from '../ui/AvatarImage';

const SIDE_NAV_WIDTH = 288;

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

export default function ChatTab({ eventId }: { eventId: string }) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'), {
    noSsr: true,
    defaultMatches: false,
  });
  const [hasMounted, setHasMounted] = useState(false);
  const mdUpSafe = hasMounted ? mdUp : false;

  const sb = useMemo(() => supabaseBrowser(), []);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const [composerH, setComposerH] = useState(72);
  const BOTTOM_NAV_H = mdUpSafe ? 0 : 100;
  const isEmpty = !loading && messages.length === 0;
  const profilesById = useRef<Map<string, ProfileLite>>(new Map());

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const closeReactions = useCallback(() => setSelectedId(null), []);

  // messageId -> { "👍": 2, "🔥": 1 }
  const [reactions, setReactions] = useState<
    Record<string, Record<string, number>>
  >({});

  // messageId -> { "👍": true, "🔥": true }  (which emojis *I* have on this message)
  const [myReactions, setMyReactions] = useState<
    Record<string, Record<string, true>>
  >({});

  useEffect(() => {
    closeReactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mdUpSafe]);

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

  useEffect(() => setHasMounted(true), []);

  useLayoutEffect(() => {
    const measure = () => {
      if (composerRef.current)
        setComposerH(composerRef.current.offsetHeight || 72);
    };
    measure();
    const obs = new ResizeObserver(measure);
    if (composerRef.current) obs.observe(composerRef.current);
    window.addEventListener('resize', measure);
    return () => {
      obs.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await sb
        .from('event_messages')
        .select(
          `
          id, event_id, user_id, body, created_at,
          profiles:profiles!event_messages_user_id_fkey (
            id, display_name,  avatar_url, updated_at
          )
        `
        )
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(500);

      if (!alive) return;
      if (error) console.error('[chat load error]', error);

      // seed cache
      (data ?? []).forEach((m: any) => {
        if (m.profiles?.id) profilesById.current.set(m.profiles.id, m.profiles);
      });

      setMessages(
        ((data as any[]) ?? []).map((m) => ({ ...m, id: String(m.id) }))
      );
      setLoading(false);

      // NEW: load reactions for these messages
      const ids = ((data as any[]) ?? []).map((m) => String(m.id));
      loadReactionsFor(ids);

      queueMicrotask(() =>
        bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      );
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sb, eventId]);

  useEffect(() => {
    const ch = sb
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
            const { data } = await sb
              .from('profiles')
              .select('id, display_name, avatar_path, avatar_url, updated_at')
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
      sb.removeChannel(ch);
    };
  }, [sb, eventId]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      if (t.closest('[data-reactions-popper="true"]')) return;
      if (t.closest('[data-message-container="true"]')) return;
      if (selectedId) closeReactions();
    };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, [selectedId, closeReactions]);

  useEffect(() => {
    const idSet = new Set(messages.map((m) => m.id));

    const ch = sb
      .channel(`event:${eventId}:reactions`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_message_reactions' },
        async (payload) => {
          const row = (payload.new ??
            payload.old) as Partial<ReactionRow> | null;
          if (!row || typeof row.message_id !== 'number') return;

          const mid = String(row.message_id);
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
            } = await sb.auth.getUser();
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
            } = await sb.auth.getUser();
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
      sb.removeChannel(ch);
    };
  }, [sb, eventId, messages]);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const numericId = Number(messageId);
      if (!Number.isFinite(numericId)) {
        return;
      }

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
      } = await sb.auth.getUser();
      if (!user) return;

      const iHadItBefore = !!(
        myReactions[messageId] && myReactions[messageId][emoji]
      );

      if (iHadItBefore) {
        const { error } = await sb
          .from('event_message_reactions')
          .delete()
          .match({ message_id: numericId, user_id: user.id, emoji });

        if (error) {
          console.error('[reaction delete error]', error);
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
        const { error } = await sb
          .from('event_message_reactions')
          .upsert(
            { message_id: numericId, user_id: user.id, emoji },
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
          setMyReactions((mr) => {
            const next = { ...(mr[messageId] || {}) };
            delete next[emoji];
            return { ...mr, [messageId]: next };
          });
        }
      }
    },
    [sb, myReactions]
  );

  const send = useCallback(async () => {
    const body = input.trim();
    if (!body) return;
    setInput('');

    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;

    let me = profilesById.current.get(user.id);
    if (!me) {
      const { data } = await sb
        .from('profiles')
        .select('id, display_name,  avatar_url, updated_at')
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

    const { error } = await sb
      .from('event_messages')
      .insert({ event_id: eventId, user_id: user.id, body });
    if (error) {
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInput(body);
    }
  }, [input, eventId, sb]);

  const loadReactionsFor = useCallback(
    async (messageIds: string[]) => {
      const numericIds = messageIds.map(Number).filter(Number.isFinite);
      if (numericIds.length === 0) return;

      const { data, error } = await sb
        .from('event_message_reactions')
        .select('message_id, emoji, user_id')
        .in('message_id', numericIds);

      if (error) {
        console.error('[reactions load error]', error);
        return;
      }

      const rows = (data ?? []) as unknown as ReactionRow[];

      const byMsg: Record<string, Record<string, number>> = {};
      const mine: Record<string, Record<string, true>> = {};

      const {
        data: { user },
      } = await sb.auth.getUser();
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
    },
    [sb]
  );

  return (
    <Box
      sx={{
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        data-chat-scroll-area
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          scrollbarGutter: 'stable both-edges',
          py: 2,
          pb: `calc(${composerH}px + ${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px) + 8px)`,
          scrollPaddingBottom: `calc(${composerH}px + ${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px) + 8px)`,
        }}
      >
        {loading ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ py: 4, opacity: 0.7 }}
          >
            <CircularProgress size={22} />
          </Stack>
        ) : isEmpty ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={1.5}
            sx={{
              px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
              maxWidth: 960,
              mx: 'auto',
              py: 6,
              textAlign: 'center',
              opacity: 0.9,
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                letterSpacing: 0.2,
                color: '#C8FFB3',
              }}
            >
              Welcome to the Green Room
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8 }}>
              This is your band’s hub for messaging about this event. Say hello
              to get started.
            </Typography>

            <div ref={bottomRef} />
          </Stack>
        ) : (
          <Stack
            spacing={2}
            sx={{
              px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
              maxWidth: 1600,
              mx: 'auto',
            }}
          >
            {messages.map((m) => (
              <MessageRow
                key={m.id}
                message={m}
                mdUpSafe={mdUpSafe}
                timeFmt={timeFmt}
                selectedId={selectedId}
                setSelectedId={setSelectedId}
                messageReactions={reactions[m.id] || {}}
                myReactions={myReactions[m.id] || {}}
                onToggleEmoji={(emoji) => toggleReaction(m.id, emoji)}
              />
            ))}
            <div ref={bottomRef} />
          </Stack>
        )}
      </Box>

      <Box
        ref={composerRef}
        sx={{
          position: 'fixed',
          left: { xs: 0, md: SIDE_NAV_WIDTH },
          right: 0,
          bottom: `calc(${BOTTOM_NAV_H}px + env(safe-area-inset-bottom, 0px))`,
          zIndex: (t) => t.zIndex.appBar + 1,
        }}
      >
        <Box
          sx={{
            position: 'fixed',
            left: { xs: 0, md: SIDE_NAV_WIDTH },
            right: 0,
            bottom: 0,
            zIndex: (t) => t.zIndex.appBar + 1,

            bgcolor: 'rgba(11,10,16,0.65)',
            backdropFilter: 'blur(8px) saturate(120%)',
            WebkitBackdropFilter: 'blur(8px) saturate(120%)',
            borderTop: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 -8px 24px rgba(0,0,0,0.35)',
            willChange: 'backdrop-filter',
            transform: 'translateZ(0)',
          }}
        >
          <Box
            sx={{
              maxWidth: 1600,
              mx: 'auto',
              px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
              pt: { xs: 2, md: 1.25 },
              pb: {
                xs: 2,
                md: `calc(14px + env(safe-area-inset-bottom, 0px))`,
              },
            }}
          >
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField
                fullWidth
                size="medium"
                minRows={mdUpSafe ? 2 : 1}
                maxRows={mdUpSafe ? 6 : 4}
                placeholder="Message the band…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                InputProps={{
                  sx: {
                    bgcolor: '#11131a',
                    color: 'white',
                    '& .MuiInputBase-input': {
                      py: { xs: 1.25, md: 1.75 },
                      fontSize: { xs: '0.95rem', md: '1rem' },
                    },
                  },
                }}
              />
              <IconButton
                color="primary"
                onClick={send}
                aria-label="Send"
                sx={{
                  width: { xs: 40, md: 44 },
                  height: { xs: 40, md: 44 },
                  flex: '0 0 auto',
                }}
              >
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function useLongPress(
  onLongPress: () => void,
  { delay = 450 }: { delay?: number } = {}
) {
  const timer = useRef<number | null>(null);

  const clear = () => {
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
  };

  const start = () => {
    clear();
    timer.current = window.setTimeout(onLongPress, delay);
  };

  return {
    onPointerDown: start,
    onTouchStart: start,
    onPointerUp: clear,
    onPointerCancel: clear,
    onPointerLeave: clear,
    onTouchEnd: clear,
    onTouchCancel: clear,
  };
}

function MessageRow({
  message: m,
  mdUpSafe,
  timeFmt,
  selectedId,
  setSelectedId,
  messageReactions,
  myReactions,
  onToggleEmoji,
}: {
  message: ChatMsg;
  mdUpSafe: boolean;
  timeFmt: Intl.DateTimeFormat;
  selectedId: string | null;
  setSelectedId: Dispatch<SetStateAction<string | null>>;
  messageReactions: Record<string, number>;
  myReactions: Record<string, true>;
  onToggleEmoji: (emoji: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const isSelected = selectedId === m.id;
  const open = () => setSelectedId(m.id);
  const toggleSelect = () => setSelectedId(isSelected ? null : m.id);
  const lp = useLongPress(() => open(), { delay: 450 });

  return (
    <Box
      ref={containerRef}
      data-message-container="true"
      role="button"
      tabIndex={0}
      onClick={() => mdUpSafe && toggleSelect()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleSelect();
        }
      }}
      {...(!mdUpSafe ? lp : {})}
      sx={(t) => ({
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        columnGap: 1.25,
        alignItems: 'flex-start',
        px: 1.25,
        py: 1,
        borderRadius: 2,

        transition:
          'border-color 120ms, background-color 120ms, box-shadow 120ms',
        boxShadow: isSelected
          ? '0 0 0 2px rgba(182,255,104,0.18) inset'
          : 'none',
        cursor: 'pointer',
        outline: 'none',
        '&:hover': mdUpSafe
          ? {
              backgroundColor: alpha(t.palette.primary.main, 0.06),
              borderColor: alpha(t.palette.primary.main, 0.16),
            }
          : undefined,
        '&:focus-visible': {
          boxShadow:
            '0 0 0 2px rgba(182,255,104,0.28) inset, 0 0 0 3px rgba(182,255,104,0.18)',
          borderColor: '#CEFF9E',
        },
      })}
    >
      <AvatarImage
        name={m.profiles?.display_name || 'Member'}
        bucket="profile-avatars"
        srcGuess={m.profiles?.avatar_url ?? undefined}
        size={32}
      />

      <Stack sx={{ minWidth: 0 }}>
        <Stack
          direction="row"
          spacing={0.75}
          alignItems="baseline"
          sx={{ minWidth: 0 }}
        >
          <Typography
            variant="subtitle2"
            noWrap
            sx={{ fontWeight: 800, letterSpacing: 0.2, minWidth: 0 }}
            title={m.profiles?.display_name || 'Member'}
          >
            {m.profiles?.display_name || 'Member'}
          </Typography>
          <Typography
            variant="caption"
            sx={{ opacity: 0.7, whiteSpace: 'nowrap', flexShrink: 0 }}
            suppressHydrationWarning
          >
            {timeFmt.format(new Date(m.created_at))}
          </Typography>
        </Stack>

        <Typography
          variant="body1"
          sx={{
            mt: 0.5,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'rgba(237,235,255,0.92)',
          }}
        >
          {m.body}
        </Typography>

        <ReactionBar
          reactions={messageReactions}
          myReactions={myReactions}
          onToggle={onToggleEmoji}
        />
      </Stack>
    </Box>
  );
}

function ReactionBar({
  reactions,
  myReactions,
  onToggle,
}: {
  reactions: Record<string, number>;
  myReactions: Record<string, true>;
  onToggle: (emoji: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const addBtnRef = useRef<HTMLButtonElement | null>(null);

  const entries = Object.entries(reactions).sort((a, b) => b[1] - a[1]);
  const hasReactions = entries.length > 0;

  return (
    <Box
      sx={{
        mt: 0.5,
        display: 'flex',
        gap: 0.5,
        alignItems: 'center',
        flexWrap: 'wrap',
      }}
    >
      {hasReactions &&
        entries.map(([emoji, count]) => {
          const mine = !!myReactions[emoji];
          return (
            <Box
              key={emoji}
              role="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggle(emoji);
              }}
              sx={(t) => ({
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                px: 0.75,
                py: 0.25,
                borderRadius: 999,
                fontSize: '0.85rem',
                border: `1px solid ${
                  mine ? t.palette.primary.main : 'rgba(255,255,255,0.18)'
                }`,
                backgroundColor: mine
                  ? alpha(t.palette.primary.main, 0.16)
                  : 'rgba(255,255,255,0.06)',
                boxShadow: mine
                  ? `0 0 0 2px ${alpha(t.palette.primary.main, 0.18)} inset`
                  : 'none',
                color: 'inherit',
                cursor: 'pointer',
                userSelect: 'none',
                transition:
                  'background-color 120ms, border-color 120ms, box-shadow 120ms',
                '&:hover': {
                  backgroundColor: mine
                    ? alpha(t.palette.primary.main, 0.22)
                    : 'rgba(255,255,255,0.10)',
                },
              })}
            >
              <span aria-hidden>{emoji}</span>
              <Typography variant="caption" sx={{ lineHeight: 1 }}>
                {count}
              </Typography>
            </Box>
          );
        })}

      <IconButton
        ref={addBtnRef}
        size="small"
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        aria-label="Add reaction"
        sx={{
          width: 28,
          height: 28,
          border: '1px solid rgba(255,255,255,0.18)',
          borderRadius: 2,
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.08)' },
        }}
      >
        <AddReactionIcon fontSize="small" />
      </IconButton>

      <Popper
        open={open}
        anchorEl={addBtnRef.current}
        placement="top-start"
        disablePortal
        modifiers={[
          { name: 'offset', options: { offset: [0, 8] } },
          {
            name: 'preventOverflow',
            options: { padding: 8, altBoundary: true },
          },
        ]}
        sx={{ zIndex: (t) => t.zIndex.modal + 1 }}
      >
        <Paper
          data-reactions-popper="true"
          sx={{
            bgcolor: 'rgba(17,19,26,0.95)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
            p: 0.75,
            borderRadius: 2,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <EmojiGrid
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
        </Paper>
      </Popper>
    </Box>
  );
}

function EmojiGrid({
  emojis,
  onPick,
}: {
  emojis: string[];
  onPick: (emoji: string) => void;
}) {
  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(8, 1.75rem)',
        gap: 0.25,
        maxWidth: '16rem',
      }}
    >
      {emojis.map((e) => (
        <Box
          key={e}
          role="button"
          aria-label={`React with ${e}`}
          onClick={() => onPick(e)}
          sx={(t) => ({
            fontSize: 20,
            lineHeight: 1,
            textAlign: 'center',
            px: 0.25,
            py: 0.25,
            borderRadius: 1,
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'background-color 120ms',
            '&:hover': { backgroundColor: alpha(t.palette.primary.main, 0.16) },
            '&:active': {
              backgroundColor: alpha(t.palette.primary.main, 0.24),
            },
          })}
        >
          {e}
        </Box>
      ))}
    </Box>
  );
}
