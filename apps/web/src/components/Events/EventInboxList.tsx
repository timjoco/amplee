'use client';

import CheckIcon from '@mui/icons-material/Check';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabaseClient';
import NoBandNoEventsPaper from '../Bands/NoBandsNoEventsPaper';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice';
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  is_cancelled: boolean;
  is_booked: boolean;
  my_event_status: 'pending' | 'confirmed' | 'cancelled';
  bands: { id: string; name: string; avatar_url: string | null } | null;
};

type LastMsg = {
  event_id: string;
  body: string;
  created_at: string;
};

export default function EventInboxList({
  onLoaded,
  bandId,
  showAvatars = true,
  isAdmin,
  onEventOpen,
}: {
  onLoaded?: (count: number) => void;
  bandId?: string;
  showAvatars?: boolean;
  isAdmin?: boolean;
  onEventOpen?: (eventId: string) => void;
}) {
  const router = useRouter();
  const sb = useMemo(() => supabaseBrowser(), []);

  const [, setCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [lastMsgs, setLastMsgs] = useState<Record<string, LastMsg | undefined>>(
    {}
  );
  const [avatarMap, setAvatarMap] = useState<
    Record<string, string | undefined>
  >({});
  const eventIdsRef = useRef<string[]>([]);

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  );

  const SURFACE_GRAD =
    'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))';
  const AV_BG = 'rgba(255,255,255,0.06)';

  const load = useCallback(async () => {
    setLoading(true);

    const { data: auth } = await sb.auth.getUser();
    const userId = auth?.user?.id ?? null;

    if (!userId) {
      setRows([]);
      setLastMsgs({});
      setAvatarMap({});
      setLoading(false);
      onLoaded?.(0);
      return;
    }

    let bandIds: string[] = [];
    if (bandId) {
      bandIds = [bandId];
    } else {
      const { data: mems, error: memErr } = await sb
        .from('band_members')
        .select('band_id')
        .eq('user_id', userId);
      if (memErr) throw memErr;
      bandIds = (mems ?? []).map((m: any) => m.band_id);
    }

    if (bandIds.length === 0) {
      setRows([]);
      setLastMsgs({});
      setAvatarMap({});
      setLoading(false);
      onLoaded?.(0);
      return;
    }

    const { data: events, error: eErr } = await sb
      .from('events_with_my_attendance')
      .select(
        'id, band_id, title, type, starts_at, ends_at, location, notes, is_booked, is_cancelled, my_event_status, bands(id, name, avatar_url)'
      )
      .in('band_id', bandIds)
      .order('starts_at', { ascending: true })
      .limit(200);
    if (eErr) throw eErr;

    const normalized: EventRow[] = (events ?? []).map((e: any) => ({
      id: String(e.id),
      band_id: String(e.band_id),
      title: String(e.title ?? ''),
      type: e.type === 'practice' ? 'practice' : 'show',
      starts_at: e.starts_at ?? null,
      ends_at: e.ends_at ?? null,
      location: e.location ?? null,
      notes: e.notes ?? null,
      is_booked: Boolean(e.is_booked),
      is_cancelled: Boolean(e.is_cancelled),
      my_event_status:
        (e.my_event_status as EventRow['my_event_status']) ?? 'pending',
      bands: Array.isArray(e.bands)
        ? e.bands[0]
          ? {
              id: String(e.bands[0].id),
              name: String(e.bands[0].name ?? ''),
              avatar_url: e.bands[0].avatar_url ?? null,
            }
          : null
        : e.bands
        ? {
            id: String(e.bands.id),
            name: String(e.bands.name ?? ''),
            avatar_url: e.bands.avatar_url ?? null,
          }
        : null,
    }));

    const now = Date.now();
    const toTs = (s?: string | null) =>
      s ? new Date(s).getTime() : Number.POSITIVE_INFINITY;
    const upcoming = normalized
      .filter((e) => e.starts_at && toTs(e.starts_at) >= now)
      .sort((a, b) => toTs(a.starts_at) - toTs(b.starts_at));
    const past = normalized
      .filter((e) => !e.starts_at || toTs(e.starts_at) < now)
      .sort((a, b) => toTs(b.starts_at) - toTs(a.starts_at));
    const sorted = [...upcoming, ...past];

    setRows(sorted);
    eventIdsRef.current = sorted.map((e) => e.id);
    onLoaded?.(sorted.length);

    if (sorted.length) {
      const ids = sorted.map((e) => e.id);
      const { data: msgs, error: mErr } = await sb
        .from('event_messages')
        .select('event_id, body, created_at')
        .in('event_id', ids)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (!mErr) {
        const map: Record<string, LastMsg> = {};
        for (const m of msgs ?? [])
          if (!map[m.event_id]) map[m.event_id] = m as LastMsg;
        setLastMsgs(map);
      } else {
        setLastMsgs({});
      }
    } else {
      setLastMsgs({});
    }

    if (showAvatars) {
      const uniqueBandPairs = Array.from(
        new Map(
          sorted
            .filter((e) => e.bands?.id && e.bands?.avatar_url)
            .map((e) => [e.bands!.id, e.bands!.avatar_url as string])
        ).entries()
      );
      const nextAvatarMap: Record<string, string> = {};
      for (const [bId, path] of uniqueBandPairs) {
        const { data, error } = await sb.storage
          .from('band-avatars')
          .createSignedUrl(path, 60 * 60);
        if (!error && data?.signedUrl) nextAvatarMap[bId] = data.signedUrl;
      }
      setAvatarMap(nextAvatarMap);
    } else {
      setAvatarMap({});
    }

    setLoading(false);
  }, [sb, onLoaded, bandId, showAvatars]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const ch = sb
      .channel('dashboard:event-inbox')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_messages' },
        (payload) => {
          const msg = payload.new as LastMsg;
          if (!eventIdsRef.current.includes(msg.event_id)) return;
          setLastMsgs((prev) => {
            const current = prev[msg.event_id];
            if (
              !current ||
              new Date(msg.created_at) > new Date(current.created_at)
            ) {
              return { ...prev, [msg.event_id]: msg };
            }
            return prev;
          });
        }
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [sb]);

  const onOpen = (bId: string, eventId: string) => {
    // If onEventOpen callback provided (inside BandSheet), use it
    if (onEventOpen) {
      onEventOpen(eventId);
    } else {
      // Dashboard view: use standalone event route
      router.push(`/events/${eventId}`);
    }
  };

  function EmptyListMessage({ children }: { children: React.ReactNode }) {
    return (
      <Stack spacing={2}>
        <Typography sx={{ opacity: 0.7 }}>{children}</Typography>
      </Stack>
    );
  }

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      {loading ? (
        <Stack alignItems="center" sx={{ py: 4, opacity: 0.7 }}>
          <CircularProgress size={20} />
        </Stack>
      ) : rows.length === 0 ? (
        isAdmin ? (
          <NoBandNoEventsPaper
            kind="events"
            onPrimary={() => setCreateOpen(true)}
            maxWidth="100%"
            contentMaxWidth="100%"
            center
          />
        ) : (
          <EmptyListMessage>No events scheduled yet.</EmptyListMessage>
        )
      ) : (
        <List
          disablePadding
          sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}
        >
          {rows.map((e, idx) => {
            const band = e.bands;
            const when = e.starts_at
              ? timeFmt.format(new Date(e.starts_at))
              : '';
            const lm = lastMsgs[e.id];
            const preview =
              lm?.body ??
              (e.location ? `Location: ${e.location}` : `${e.type} scheduled`);
            const avatarSrc = (band?.id && avatarMap[band.id]) || undefined;

            const statusChip = e.is_booked ? (
              <MiniIconChip color="success">
                <CheckIcon fontSize="small" />
              </MiniIconChip>
            ) : (
              <MiniIconChip color="warning">
                <HourglassEmptyIcon fontSize="small" />
              </MiniIconChip>
            );

            return (
              <Box key={e.id}>
                <ListItemButton
                  onClick={() => onOpen(e.band_id, e.id)}
                  sx={(t) => ({
                    py: 1.25,
                    px: 1.25,
                    borderRadius: 2,
                    alignItems: 'flex-start',
                    border: `1px solid ${alpha(t.palette.primary.main, 0.08)}`,
                    background: SURFACE_GRAD,
                    transition:
                      'background-color 120ms ease, border-color 120ms ease',
                    '&:hover': {
                      backgroundColor: alpha(t.palette.primary.main, 0.06),
                      borderColor: alpha(t.palette.primary.main, 0.16),
                    },
                  })}
                >
                  {/* Avatar (optional) */}
                  {showAvatars && (
                    <Avatar
                      src={avatarSrc}
                      alt={band?.name || 'Band'}
                      sx={{
                        width: 48,
                        height: 48,
                        mr: 1.5,
                        fontWeight: 800,
                        bgcolor: AV_BG,
                        color: 'white',
                        flexShrink: 0,
                        boxShadow: '0 0 0 2px rgba(255,255,255,0.06) inset',
                      }}
                    >
                      {(band?.name || '?')
                        .split(/\s+/)
                        .slice(0, 2)
                        .map((p) => p[0]?.toUpperCase())
                        .join('')}
                    </Avatar>
                  )}

                  {/* Content: two-row grid */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        alignItems: 'center',
                        gap: 1,
                        minWidth: 0,
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 900,
                          lineHeight: 1.2,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 16,
                          letterSpacing: 0.2,
                          minWidth: 0,
                        }}
                        title={e?.title || 'Event'}
                      >
                        {e?.title || 'Event'}
                      </Typography>

                      {!!when && (
                        <Typography
                          variant="caption"
                          sx={{
                            opacity: 0.7,
                            whiteSpace: 'nowrap',
                            ml: 1,
                          }}
                        >
                          {when}
                        </Typography>
                      )}
                    </Box>

                    {/* Row 2: location/chat preview (left) — status chip (right) */}
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        alignItems: 'center',
                        gap: 1,
                        minWidth: 0,
                        mt: 0.5,
                      }}
                    >
                      <Typography
                        sx={{
                          opacity: 0.85,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 13.5,
                          minWidth: 0,
                        }}
                        title={preview}
                      >
                        {preview}
                      </Typography>

                      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        {statusChip}
                      </Box>
                    </Box>
                  </Box>
                </ListItemButton>

                {idx < rows.length - 1 && (
                  <Divider sx={{ ml: showAvatars ? 8 : 0, opacity: 0.08 }} />
                )}
              </Box>
            );
          })}
        </List>
      )}
    </Box>
  );
}

function MiniIconChip({
  color,
  children,
}: {
  color: 'success' | 'warning';
  children: React.ReactNode;
}) {
  return (
    <Chip
      size="small"
      color={color}
      label={children}
      sx={{
        height: 22,
        minWidth: 28,
        px: 0.5,
        '& .MuiChip-label': {
          p: 0,
          lineHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    />
  );
}
