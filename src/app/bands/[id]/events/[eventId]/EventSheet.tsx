/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import AttendanceBar from '@/components/Events/AttendanceBar';
import EventSheetHeader from '@/components/Events/EventSheetHeader';
import { SIDE_NAV_WIDTH } from '@/components/Nav/SideNav';
import { supabaseBrowser } from '@/lib/supabaseClient';
import SendIcon from '@mui/icons-material/Send';

import {
  Box,
  Chip,
  CircularProgress,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { alpha, useTheme } from '@mui/material/styles';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice';
  starts_at: string;
  location: string | null;
  is_booked?: boolean;
  cnt_members?: number;
  cnt_accepted?: number;
};

export default function EventSheet({
  eventId,
  bandId,
  initialEvent,
}: {
  eventId: string;
  bandId: string;
  bandName?: string;
  initialEvent: EventRow;
}) {
  const theme = useTheme();
  const [, setBandName] = useState<string>('Band');
  const [, setError] = useState<string | null>(null);
  const sb = useMemo(() => supabaseBrowser(), []);

  const mdUp = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const [mounted, setMounted] = useState(false);
  const showDesktop = mounted && mdUp;

  const [tab, setTab] = useState<
    'chat' | 'roster' | 'setlist' | 'notes' | 'files'
  >('chat');

  const startsAtLabel = useMemo(() => {
    try {
      const d = new Date(initialEvent.starts_at);
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Chicago',
        hour12: true,
      }).format(d);
    } catch {
      return initialEvent.starts_at;
    }
  }, [initialEvent.starts_at]);

  const GUTTER_X = { xs: 1, sm: 2, md: 3, lg: 5, xl: 7 }; // horizontal padding
  const GUTTER_Y = { xs: 1.5, sm: 2, md: 2.5, lg: 3, xl: 3 }; // vertical padding
  const MAX_W = 2000;

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    (async () => {
      const { data: band, error: bandErr } = await sb
        .from('bands')
        .select('id,name')
        .eq('id', bandId)
        .maybeSingle();

      if (bandErr) {
        setError(bandErr.message);
        return;
      }
      if (!band) {
        setError('Band not found or you do not have access.');
        return;
      }
      setBandName(band.name);
    })();
  }, [bandId, sb]);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: '#0B0A10',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box component="header" sx={{ py: GUTTER_Y }}>
        <Box sx={{ maxWidth: MAX_W, mx: 'auto', px: GUTTER_X }}>
          <EventSheetHeader
            backHref="/dashboard"
            event={{
              title: initialEvent.title,
              type: initialEvent.type,
              location: initialEvent.location,
              is_booked: initialEvent.is_booked,
            }}
            startsAtLabel={startsAtLabel}
            eventId={eventId}
            tab={tab}
            onTabChange={setTab}
            attendanceBar={<AttendanceBar eventId={eventId} />}
          />
        </Box>
      </Box>

      <Box component="main">
        <Box sx={{ maxWidth: MAX_W, mx: 'auto', px: GUTTER_X, height: '100%' }}>
          {tab === 'chat' &&
            (showDesktop ? (
              // DESKTOP
              <Grid
                container
                columnSpacing={2}
                sx={{ alignItems: 'stretch', height: '100%' }}
              >
                <Grid size={{ xs: 12, md: 8 }} sx={{ minHeight: 0 }}>
                  <ChatTab eventId={eventId} />
                </Grid>

                <Grid
                  size={{ xs: 12, md: 4 }}
                  sx={{
                    minHeight: 0,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <Stack
                    gap={1.5}
                    sx={{
                      position: { md: 'sticky' as const },
                      top: { md: 88 },
                    }}
                  ></Stack>
                </Grid>
              </Grid>
            ) : (
              // MOBILE
              <>
                <ChatTab eventId={eventId} />
              </>
            ))}{' '}
          {tab === 'roster' &&
            (showDesktop ? (
              <Grid>
                {' '}
                <RosterPanel bandId={bandId} eventId={eventId} />
              </Grid>
            ) : (
              <RosterPanel bandId={bandId} eventId={eventId} />
            ))}
        </Box>
      </Box>
    </Box>
  );
}

function ChatTab({ eventId }: { eventId: string }) {
  const theme = useTheme();
  const mdUp = useMediaQuery(theme.breakpoints.up('md'), { noSsr: true });
  const sb = useMemo(() => supabaseBrowser(), []);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const [composerH, setComposerH] = useState(72);
  const BOTTOM_NAV_H = mdUp ? 0 : 56;

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
      const { data } = await sb
        .from('event_messages_enriched')
        .select('id,event_id,user_id,body,created_at, first_name')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(500);
      if (!alive) return;
      setMessages(data ?? []);
      setLoading(false);
      queueMicrotask(() =>
        bottomRef.current?.scrollIntoView({ behavior: 'auto' })
      );
    })();
    return () => {
      alive = false;
    };
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
        (payload) => {
          setMessages((prev) => [...prev, payload.new]);
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

  const send = useCallback(async () => {
    const body = input.trim();
    if (!body) return;
    setInput('');
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return;
    const { error } = await sb
      .from('event_messages')
      .insert({ event_id: eventId, user_id: user.id, body });
    if (error) setInput(body);
  }, [input, eventId, sb]);

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
        ) : (
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
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    bgcolor: 'rgba(255,255,255,0.08)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 12,
                    fontWeight: 800,
                    flex: '0 0 auto',
                  }}
                >
                  {String(m.first_name).slice(0, 1).toUpperCase()}
                </Box>
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
          sx={{
            maxWidth: 1600,
            mx: 'auto',
            px: { xs: 2, sm: 3, md: 4, lg: 6, xl: 8 },
            py: 1,
          }}
        >
          <Box
            sx={{
              bgcolor: 'rgba(11,10,16,0.98)',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'saturate(120%) blur(6px)',
            }}
          >
            <Box sx={{ display: 'flex', gap: 1 }}>
              <TextField
                fullWidth
                size="medium"
                placeholder="Message the band…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                InputProps={{ sx: { bgcolor: '#11131a', color: 'white' } }}
              />
              <IconButton color="primary" onClick={send} aria-label="Send">
                <SendIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function RosterPanel({ bandId, eventId }: { bandId: string; eventId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [rows, setRows] = useState<
    {
      user_id: string;
      name: string;
      status: 'accepted' | 'declined' | 'tentative' | 'pending';
    }[]
  >([]);

  const load = useCallback(async () => {
    const { data: members, error: mErr } = await sb
      .from('band_members')
      .select('user_id')
      .eq('band_id', bandId);

    if (mErr) return;

    const ids = (members ?? []).map((m: any) => m.user_id);
    if (ids.length === 0) {
      setRows([]);
      return;
    }

    const { data: profiles, error: pErr } = await sb
      .from('profiles')
      .select('id, display_name, first_name')
      .in('id', ids);

    if (pErr) return;

    const { data: att, error: aErr } = await sb
      .from('event_attendance')
      .select('user_id, status')
      .eq('event_id', eventId);

    if (aErr) return;

    const statusByUser = new Map<
      string,
      'accepted' | 'declined' | 'tentative' | 'pending'
    >((att ?? []).map((a: any) => [a.user_id, a.status]));

    const merged =
      (profiles ?? []).map((p: any) => ({
        user_id: p.id,
        name: p.display_name ?? p.first_name ?? 'Member',
        status: statusByUser.get(p.id) ?? 'pending',
      })) ?? [];

    const orderIndex = new Map(ids.map((id, i) => [id, i]));
    merged.sort(
      (a, b) => orderIndex.get(a.user_id)! - orderIndex.get(b.user_id)!
    );

    setRows(merged);
  }, [sb, bandId, eventId]);

  useEffect(() => {
    load();

    const ch = sb
      .channel(`event:${eventId}:attendance-roster`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_attendance',
          filter: `event_id=eq.${eventId}`,
        },
        () => load()
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [sb, eventId, load]);

  const chipColor = (s: string) =>
    s === 'accepted'
      ? 'success'
      : s === 'declined'
      ? 'error'
      : s === 'tentative'
      ? 'warning'
      : 'default';

  return (
    <Paper
      sx={(t) => ({
        p: 1,
        borderRadius: 2,
        borderColor: alpha(t.palette.primary.main, 0.14),
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      })}
    >
      <List dense disablePadding>
        {rows.map((r) => (
          <ListItem key={r.user_id} sx={{ px: 1 }}>
            <ListItemAvatar></ListItemAvatar>
            <ListItemText
              primary={
                <Typography noWrap sx={{ fontWeight: 600 }}>
                  {r.name}
                </Typography>
              }
              secondary={
                <Tooltip
                  title={r.status === 'pending' ? 'No response yet' : r.status}
                  arrow
                >
                  <Chip
                    size="small"
                    label={r.status}
                    color={chipColor(r.status)}
                  />
                </Tooltip>
              }
              secondaryTypographyProps={{ component: 'span' }}
            />
          </ListItem>
        ))}
        {rows.length === 0 && (
          <Typography variant="body2" sx={{ opacity: 0.7, px: 1.5, py: 1 }}>
            No members found.
          </Typography>
        )}
      </List>
    </Paper>
  );
}

// /* ---------- Setlist (MVP) ---------- */
// function SetlistTab({ eventId }: { eventId: string }) {
//   const sb = useMemo(() => supabaseBrowser(), []);
//   const [items, setItems] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [title, setTitle] = useState('');

//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       setLoading(true);
//       const { data } = await sb
//         .from('event_setlist_items')
//         .select('id, title, position, notes, created_at')
//         .eq('event_id', eventId)
//         .order('position', { ascending: true });
//       if (!alive) return;
//       setItems(data ?? []);
//       setLoading(false);
//     })();
//     return () => {
//       alive = false;
//     };
//   }, [sb, eventId]);

//   useEffect(() => {
//     const ch = sb
//       .channel(`setlist:${eventId}`)
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'event_setlist_items',
//           filter: `event_id=eq.${eventId}`,
//         },
//         () => {
//           sb.from('event_setlist_items')
//             .select('id, title, position, notes, created_at')
//             .eq('event_id', eventId)
//             .order('position', { ascending: true })
//             .then(({ data }) => setItems(data ?? []));
//         }
//       )
//       .subscribe();
//     return () => {
//       sb.removeChannel(ch);
//     };
//   }, [sb, eventId]);

//   const addItem = useCallback(async () => {
//     const t = title.trim();
//     if (!t) return;
//     setTitle('');
//     await sb.from('event_setlist_items').insert({
//       event_id: eventId,
//       title: t,
//       position: (items.at(-1)?.position ?? 0) + 10,
//     });
//   }, [sb, eventId, title, items]);

//   const move = useCallback(
//     async (id: string, dir: -1 | 1) => {
//       const idx = items.findIndex((i) => i.id === id);
//       const swapIdx = idx + dir;
//       if (idx < 0 || swapIdx < 0 || swapIdx >= items.length) return;
//       const a = items[idx],
//         b = items[swapIdx];
//       await sb
//         .from('event_setlist_items')
//         .update({ position: b.position })
//         .eq('id', a.id);
//       await sb
//         .from('event_setlist_items')
//         .update({ position: a.position })
//         .eq('id', b.id);
//     },
//     [items, sb]
//   );

//   const remove = useCallback(
//     async (id: string) => {
//       await sb.from('event_setlist_items').delete().eq('id', id);
//     },
//     [sb]
//   );

//   return (
//     <Stack gap={1.25} sx={{ mt: 1 }}>
//       <Stack direction="row" gap={1}>
//         <TextField
//           fullWidth
//           size="small"
//           label="Add song"
//           value={title}
//           onChange={(e) => setTitle(e.target.value)}
//           onKeyDown={(e) => {
//             if (e.key === 'Enter') addItem();
//           }}
//           InputLabelProps={{ shrink: true }}
//           InputProps={{ sx: { bgcolor: '#11131a', color: 'white' } }}
//         />
//         <Button variant="contained" onClick={addItem} startIcon={<AddIcon />}>
//           Add
//         </Button>
//       </Stack>

//       {loading ? (
//         <Typography color="text.secondary">Loading setlist…</Typography>
//       ) : items.length === 0 ? (
//         <Typography color="text.secondary">
//           No setlist yet. Add your first song.
//         </Typography>
//       ) : (
//         <Stack gap={1.25}>
//           {items.map((it, i) => (
//             <Paper
//               key={it.id}
//               variant="outlined"
//               sx={(t) => ({
//                 p: 1,
//                 borderRadius: 2,
//                 borderColor: alpha(t.palette.primary.main, 0.14),
//                 background:
//                   'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
//               })}
//             >
//               <Stack direction="row" alignItems="center" gap={1}>
//                 <Typography
//                   sx={{ fontWeight: 800, flex: 1, minWidth: 0 }}
//                   noWrap
//                 >
//                   {i + 1}. {it.title}
//                 </Typography>
//                 <IconButton
//                   size="small"
//                   onClick={() => move(it.id, -1)}
//                   disabled={i === 0}
//                 >
//                   <ArrowUpwardIcon fontSize="small" />
//                 </IconButton>
//                 <IconButton
//                   size="small"
//                   onClick={() => move(it.id, +1)}
//                   disabled={i === items.length - 1}
//                 >
//                   <ArrowDownwardIcon fontSize="small" />
//                 </IconButton>
//                 <IconButton size="small" onClick={() => remove(it.id)}>
//                   <DeleteOutlineIcon fontSize="small" />
//                 </IconButton>
//               </Stack>
//               {it.notes && (
//                 <>
//                   <Divider sx={{ my: 0.75, opacity: 0.08 }} />
//                   <Typography variant="body2" sx={{ opacity: 0.9 }}>
//                     {it.notes}
//                   </Typography>
//                 </>
//               )}
//             </Paper>
//           ))}
//         </Stack>
//       )}
//     </Stack>
//   );
// }

// /* ---------- Notes (autosave) ---------- */
// function NotesTab({ eventId }: { eventId: string }) {
//   const sb = useMemo(() => supabaseBrowser(), []);
//   const [body, setBody] = useState('');
//   const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
//   const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

//   useEffect(() => {
//     let alive = true;
//     (async () => {
//       const { data } = await sb
//         .from('event_notes')
//         .select('body')
//         .eq('event_id', eventId)
//         .maybeSingle();
//       if (!alive) return;
//       setBody(data?.body ?? '');
//     })();
//     return () => {
//       alive = false;
//     };
//   }, [sb, eventId]);

//   const save = useCallback(
//     async (next: string) => {
//       setSaving('saving');
//       await sb.from('event_notes').upsert({ event_id: eventId, body: next });
//       setSaving('saved');
//       setTimeout(() => setSaving('idle'), 800);
//     },
//     [sb, eventId]
//   );

//   const onChange = (v: string) => {
//     setBody(v);
//     setSaving('saving');
//     if (timer.current) clearTimeout(timer.current);
//     timer.current = setTimeout(() => save(v), 600);
//   };

//   return (
//     <Stack gap={1.25} sx={{ mt: 1 }}>
//       <TextField
//         multiline
//         minRows={6}
//         fullWidth
//         placeholder="Shared notes for this event…"
//         value={body}
//         onChange={(e) => onChange(e.target.value)}
//         InputProps={{ sx: { bgcolor: '#11131a', color: 'white' } }}
//       />
//       <Typography variant="caption" sx={{ opacity: 0.7 }}>
//         {saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'Saved' : ' '}
//       </Typography>
//     </Stack>
//   );
// }

// /* ---------- Files (private storage: event-files bucket) ---------- */
// function FilesTab({ eventId }: { eventId: string }) {
//   const sb = useMemo(() => supabaseBrowser(), []);
//   const [paths, setPaths] = useState<string[]>([]);
//   const [loading, setLoading] = useState(true);

//   const list = useCallback(async () => {
//     setLoading(true);
//     const { data, error } = await sb.storage
//       .from('event-files')
//       .list(eventId, { limit: 100, offset: 0 });
//     if (!error) setPaths((data ?? []).map((o) => `${eventId}/${o.name}`));
//     setLoading(false);
//   }, [sb, eventId]);

//   useEffect(() => {
//     list();
//   }, [list]);

//   const onUpload = async (file: File) => {
//     const path = `${eventId}/${crypto.randomUUID()}.${
//       file.name.split('.').pop() ?? 'dat'
//     }`;
//     const { error } = await sb.storage
//       .from('event-files')
//       .upload(path, file, { upsert: true });
//     if (!error) list();
//   };

//   const downloadUrl = async (path: string) => {
//     const { data, error } = await sb.storage
//       .from('event-files')
//       .createSignedUrl(path, 60 * 60);
//     if (!error && data?.signedUrl)
//       window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
//   };

//   return (
//     <Stack gap={1.25} sx={{ mt: 1 }}>
//       <Button
//         variant="outlined"
//         component="label"
//         sx={{ alignSelf: 'flex-start' }}
//       >
//         Upload file
//         <input
//           hidden
//           type="file"
//           onChange={(e) => {
//             const f = e.target.files?.[0];
//             if (f) onUpload(f);
//             (e.currentTarget as HTMLInputElement).value = '';
//           }}
//         />
//       </Button>

//       {loading ? (
//         <Typography color="text.secondary">Loading files…</Typography>
//       ) : paths.length === 0 ? (
//         <Typography color="text.secondary">No files yet.</Typography>
//       ) : (
//         <Stack gap={1}>
//           {paths.map((p) => (
//             <Paper
//               key={p}
//               variant="outlined"
//               sx={(t) => ({
//                 p: 1,
//                 borderRadius: 2,
//                 borderColor: alpha(t.palette.primary.main, 0.14),
//                 background:
//                   'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
//                 display: 'flex',
//                 justifyContent: 'space-between',
//                 alignItems: 'center',
//               })}
//             >
//               <Typography sx={{ wordBreak: 'break-all' }}>
//                 {p.split('/').slice(1).join('/')}
//               </Typography>
//               <Button size="small" onClick={() => downloadUrl(p)}>
//                 Open
//               </Button>
//             </Paper>
//           ))}
//         </Stack>
//       )}
//     </Stack>
//   );
// }
