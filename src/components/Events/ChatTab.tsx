/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import AvatarImage from '@/components/ui/AvatarImage';
import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';

const SIDE_NAV_WIDTH = 288;

type ProfileLite = {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  updated_at?: string | null;
};

type ChatMsg = {
  id: string | number;
  event_id: string;
  user_id: string;
  body: string;
  created_at: string;
  profiles?: ProfileLite;
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
  const BOTTOM_NAV_H = mdUpSafe ? 0 : 56;
  const isEmpty = !loading && messages.length === 0;
  const profilesById = useRef<Map<string, ProfileLite>>(new Map());

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

  // Initial load: messages with embedded profiles (no view needed)
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

      setMessages((data as unknown as ChatMsg[]) ?? []);
      setLoading(false);
      queueMicrotask(() =>
        bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      );
    })();
    return () => {
      alive = false;
    };
  }, [sb, eventId]);

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

    // optimistic message
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

    // real insert
    const { error } = await sb
      .from('event_messages')
      .insert({ event_id: eventId, user_id: user.id, body });
    if (error) {
      // roll back optimistic on failure
      setMessages((prev) => prev.filter((m) => m.id !== optimisticId));
      setInput(body);
    }
  }, [input, eventId, sb]);

  // Realtime: enrich inserts (and dedupe optimistic)
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

          // ensure we have the author's profile for instant avatar
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

          const enriched: ChatMsg = { ...row, profiles: prof };

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
          // --- Welcome empty state ---
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
              This if your bands hub for messaging about this event. Say hello
              to get started.
            </Typography>

            <div ref={bottomRef} />
          </Stack>
        ) : (
          // --- Normal message list ---
          <Stack
            spacing={1.25}
            sx={{
              px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
              maxWidth: 1600,
              mx: 'auto',
            }}
          >
            {messages.map((m) => (
              <Stack key={m.id} direction="row" gap={1.25}>
                <Typography>{m.profiles?.display_name}</Typography>
                <AvatarImage
                  name={m.profiles?.display_name || 'Member'}
                  bucket="profile-avatars"
                  srcGuess={m.profiles?.avatar_url ?? undefined}
                  size={32}
                />
                <Stack sx={{ minWidth: 0 }}>
                  <Typography
                    variant="caption"
                    sx={{ opacity: 0.7 }}
                    suppressHydrationWarning
                  >
                    {timeFmt.format(new Date(m.created_at))}
                  </Typography>
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                    {m.body}
                  </Typography>
                </Stack>
              </Stack>
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
          ref={composerRef}
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
