'use client';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import QueueMusicIcon from '@mui/icons-material/QueueMusic';
import SettingsIcon from '@mui/icons-material/Settings';
import { CircularProgress, Stack } from '@mui/material';
import { supabaseBrowser } from '../../lib/supabaseClient';

import {
  Box,
  Button,
  Chip,
  Divider,
  IconButton,
  List,
  ListItem,
  Paper,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { alpha } from '@mui/material/styles';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import AvatarImage from '../ui/AvatarImage';
import ChatTab from './ChatTab';
import SetlistTab from './SetlistTab';

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

const TAB_CONFIG = [
  { key: 'chat', label: 'Chat', icon: ChatBubbleOutlineIcon },
  { key: 'roster', label: 'Roster', icon: PeopleOutlineIcon },
  { key: 'setlist', label: 'Setlist', icon: QueueMusicIcon },
  { key: 'notes', label: 'Notes', icon: DescriptionOutlinedIcon },
  { key: 'files', label: 'Files', icon: AttachFileIcon },
  { key: 'settings', label: 'Settings', icon: SettingsIcon },
] as const;

export default function EventSheet({
  eventId,
  bandId,
  initialEvent,
  onBack,
}: {
  eventId: string;
  bandId: string;
  bandName?: string;
  initialEvent: EventRow;
  onBack?: () => void;
}) {
  const [, setBandName] = useState<string>('Band');
  const [, setError] = useState<string | null>(null);
  const sb = useMemo(() => supabaseBrowser(), []);
  const [isAdmin, setIsAdmin] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [tab, setTab] = useState<
    'chat' | 'roster' | 'setlist' | 'notes' | 'files' | 'settings'
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

  useEffect(() => {
    (async () => {
      const { data, error } = await sb
        .from('band_members')
        .select('role')
        .eq('band_id', bandId)
        .eq('user_id', (await sb.auth.getUser()).data.user?.id)
        .maybeSingle();

      if (!error && data) setIsAdmin(data.role === 'admin');
    })();
  }, [sb, bandId]);

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header with event info and icon navigation - Discord style */}
      <Box
        sx={{
          flexShrink: 0,
          borderBottom: (t) =>
            `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
          bgcolor: 'background.paper',
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          sx={{ px: 2, py: 1.5, gap: 2 }}
        >
          {/* Back button */}
          {onBack && (
            <IconButton
              onClick={onBack}
              size="small"
              sx={{
                color: 'text.secondary',
                '&:hover': {
                  bgcolor: 'action.hover',
                  color: 'text.primary',
                },
              }}
            >
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          )}

          {/* Event title and details */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1rem',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {initialEvent.title}
            </Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.8125rem',
                }}
              >
                {startsAtLabel}
              </Typography>
              {initialEvent.location && (
                <>
                  <Box
                    sx={{
                      width: 3,
                      height: 3,
                      borderRadius: '50%',
                      bgcolor: 'text.secondary',
                      opacity: 0.5,
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{
                      color: 'text.secondary',
                      fontSize: '0.8125rem',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {initialEvent.location}
                  </Typography>
                </>
              )}
            </Stack>
          </Box>

          {/* Icon navigation - Discord style */}
          <Stack
            direction="row"
            spacing={0.5}
            sx={{
              alignItems: 'center',
            }}
          >
            {TAB_CONFIG.map(({ key, label, icon: Icon }) => {
              const isActive = tab === key;
              return (
                <Tooltip key={key} title={label} arrow>
                  <IconButton
                    onClick={() => setTab(key)}
                    size="small"
                    sx={{
                      color: isActive ? 'primary.main' : 'text.secondary',
                      bgcolor: isActive
                        ? alpha('#7C3AED', 0.12)
                        : 'transparent',
                      '&:hover': {
                        bgcolor: isActive
                          ? alpha('#7C3AED', 0.18)
                          : 'action.hover',
                        color: isActive ? 'primary.main' : 'text.primary',
                      },
                    }}
                  >
                    <Icon fontSize="small" />
                  </IconButton>
                </Tooltip>
              );
            })}
          </Stack>

          {/* Status chip */}
          <Chip
            label={initialEvent.is_booked ? 'Booked' : 'Pending'}
            color={initialEvent.is_booked ? 'success' : 'warning'}
            size="small"
            sx={{
              fontWeight: 600,
              height: 24,
              fontSize: '0.75rem',
            }}
          />
        </Stack>
      </Box>

      {/* Scroll host for tab content */}
      <Box
        component="main"
        sx={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <Box sx={{ p: 3 }}>
          {tab === 'chat' && <ChatTab eventId={eventId} />}
          {tab === 'roster' && (
            <Grid>
              <RosterPanel bandId={bandId} eventId={eventId} />
            </Grid>
          )}
          {tab === 'setlist' && (
            <SetlistTab eventId={eventId} bandId={bandId} isAdmin={isAdmin} />
          )}
          {tab === 'notes' && (
            <Grid>
              <NotesTab eventId={eventId} />
            </Grid>
          )}
          {tab === 'files' && (
            <Grid>
              <FilesTab eventId={eventId} />
            </Grid>
          )}
          {tab === 'settings' && (
            <Grid>
              <SettingsTab eventId={eventId} isAdmin={isAdmin} />
            </Grid>
          )}
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

      avatar_url?: string | null;
      updated_at?: string | null;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const load = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);
    try {
      const { data: members, error: mErr } = await sb
        .from('band_members')
        .select('user_id')
        .eq('band_id', bandId)
        .order('created_at', { ascending: true });
      if (mErr) return;

      const ids = (members ?? []).map((m: any) => m.user_id);
      if (ids.length === 0) {
        setRows([]);
        return;
      }

      const { data: profiles, error: pErr } = await sb
        .from('profiles')
        .select('id, display_name, first_name,  avatar_url, updated_at')
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

      const orderIndex = new Map(ids.map((id, i) => [id, i]));
      const merged = (profiles ?? [])
        .map((p: any) => ({
          user_id: p.id,
          name: p.display_name ?? p.first_name ?? 'Member',
          status: statusByUser.get(p.id) ?? 'pending',
          avatar_url: p.avatar_url ?? null,
          updated_at: p.updated_at ?? null,
        }))
        .sort(
          (a, b) => orderIndex.get(a.user_id)! - orderIndex.get(b.user_id)!
        );

      setRows(merged);
    } finally {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, [sb, bandId, eventId]);

  useEffect(() => {
    void load();

    const chAtt = sb
      .channel(`event:${eventId}:attendance-roster`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_attendance',
          filter: `event_id=eq.${eventId}`,
        },
        () => void load()
      )
      .subscribe();

    const chProf = sb
      .channel(`band:${bandId}:profile-roster`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => void load()
      )
      .subscribe();

    return () => {
      sb.removeChannel(chAtt);
      sb.removeChannel(chProf);
    };
  }, [sb, eventId, bandId, load]);

  useEffect(() => {
    const onRsvp = (e: Event) => {
      const ce = e as CustomEvent<{
        eventId: string;
        userId: string;
        next: 'accepted' | 'pending';
      }>;
      const {
        eventId: changedEventId,
        userId,
        next,
      } = ce.detail || ({} as any);
      if (!changedEventId || changedEventId !== eventId || !userId) return;

      // Optimistically update the single row's status
      setRows((prev) =>
        prev.map((r) => (r.user_id === userId ? { ...r, status: next } : r))
      );
    };

    window.addEventListener('amplee:rsvp-change', onRsvp as EventListener);
    return () =>
      window.removeEventListener('amplee:rsvp-change', onRsvp as EventListener);
  }, [eventId]);

  const chipColor = (s: string) =>
    s === 'accepted' ? 'success' : s === 'declined' ? 'error' : 'warning';

  return (
    <Paper
      sx={(t) => ({
        p: 1.5,
        borderRadius: 2,
        borderColor: alpha(t.palette.primary.main, 0.14),
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      })}
    >
      {loading ? (
        <Stack
          alignItems="center"
          justifyContent="center"
          sx={{ py: 3, minHeight: 120, opacity: 0.8 }}
          role="status"
          aria-live="polite"
        >
          <CircularProgress size={22} />
          <Typography variant="body2" sx={{ mt: 1, opacity: 0.7 }}>
            Loading roster…
          </Typography>
        </Stack>
      ) : rows.length === 0 ? (
        <Typography variant="body2" sx={{ opacity: 0.7, px: 1.5, py: 1 }}>
          No members found.
        </Typography>
      ) : (
        <List disablePadding>
          {rows.map((r, i) => (
            <React.Fragment key={r.user_id}>
              <ListItem disableGutters sx={{ px: 1, py: 1 }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  sx={{ width: '100%' }}
                >
                  <AvatarImage
                    name={r.name}
                    bucket="profile-avatars"
                    srcGuess={r.avatar_url || undefined}
                    size={32}
                  />
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography noWrap sx={{ fontWeight: 600 }}>
                      {r.name}
                    </Typography>
                  </Box>
                  <Tooltip
                    title={
                      r.status === 'pending' ? 'No response yet' : r.status
                    }
                    arrow
                  >
                    <Chip
                      size="small"
                      label={r.status}
                      color={chipColor(r.status)}
                      sx={{ textTransform: 'capitalize' }}
                    />
                  </Tooltip>
                </Stack>
              </ListItem>

              {i < rows.length - 1 && (
                <Divider
                  component="li"
                  sx={{ mx: 1, opacity: 0.14, borderColor: 'divider' }}
                />
              )}
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
}

function NotesTab({ eventId }: { eventId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState<'idle' | 'saving' | 'saved'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await sb
        .from('event_notes')
        .select('body')
        .eq('event_id', eventId)
        .maybeSingle();
      if (!alive) return;
      setBody(data?.body ?? '');
    })();
    return () => {
      alive = false;
    };
  }, [sb, eventId]);

  const save = useCallback(
    async (next: string) => {
      setSaving('saving');
      await sb.from('event_notes').upsert({ event_id: eventId, body: next });
      setSaving('saved');
      setTimeout(() => setSaving('idle'), 800);
    },
    [sb, eventId]
  );

  const onChange = (v: string) => {
    setBody(v);
    setSaving('saving');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => save(v), 600);
  };

  return (
    <Stack gap={1.25}>
      <TextField
        multiline
        minRows={6}
        fullWidth
        placeholder="Shared notes for this event…"
        value={body}
        onChange={(e) => onChange(e.target.value)}
      />
      <Typography variant="caption" sx={{ opacity: 0.7 }}>
        {saving === 'saving' ? 'Saving…' : saving === 'saved' ? 'Saved' : ' '}
      </Typography>
    </Stack>
  );
}

function FilesTab({ eventId }: { eventId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [paths, setPaths] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const list = useCallback(async () => {
    setLoading(true);
    const { data, error } = await sb.storage
      .from('event-files')
      .list(eventId, { limit: 100, offset: 0 });
    if (!error) setPaths((data ?? []).map((o) => `${eventId}/${o.name}`));
    setLoading(false);
  }, [sb, eventId]);

  useEffect(() => {
    list();
  }, [list]);

  const onUpload = async (file: File) => {
    const path = `${eventId}/${crypto.randomUUID()}.${
      file.name.split('.').pop() ?? 'dat'
    }`;
    const { error } = await sb.storage
      .from('event-files')
      .upload(path, file, { upsert: true });
    if (!error) list();
  };

  const downloadUrl = async (path: string) => {
    const { data, error } = await sb.storage
      .from('event-files')
      .createSignedUrl(path, 60 * 60);
    if (!error && data?.signedUrl)
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Stack gap={1.25}>
      <Button
        variant="outlined"
        component="label"
        sx={{ alignSelf: 'flex-start' }}
      >
        Upload file
        <input
          hidden
          type="file"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onUpload(f);
            (e.currentTarget as HTMLInputElement).value = '';
          }}
        />
      </Button>

      {loading ? (
        <Typography color="text.secondary">Loading files…</Typography>
      ) : paths.length === 0 ? (
        <Typography color="text.secondary">No files yet.</Typography>
      ) : (
        <Stack gap={1}>
          {paths.map((p) => (
            <Paper
              key={p}
              variant="outlined"
              sx={(t) => ({
                p: 1,
                borderRadius: 2,
                borderColor: alpha(t.palette.primary.main, 0.14),
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              })}
            >
              <Typography sx={{ wordBreak: 'break-all' }}>
                {p.split('/').slice(1).join('/')}
              </Typography>
              <Button size="small" onClick={() => downloadUrl(p)}>
                Open
              </Button>
            </Paper>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

function SettingsTab({
  eventId,
  isAdmin,
}: {
  eventId: string;
  isAdmin: boolean;
}) {
  return (
    <Paper
      sx={(t) => ({
        p: 3,
        borderRadius: 2,
        borderColor: alpha(t.palette.primary.main, 0.14),
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      })}
    >
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 700 }}>
        Event Settings
      </Typography>

      {!isAdmin && (
        <Typography variant="body2" sx={{ opacity: 0.7 }}>
          Only admins can modify event settings.
        </Typography>
      )}

      {isAdmin && (
        <Stack spacing={2}>
          <Typography variant="body2" sx={{ opacity: 0.7 }}>
            Event settings coming soon...
          </Typography>
          {/* Add your event settings form here */}
        </Stack>
      )}
    </Paper>
  );
}
