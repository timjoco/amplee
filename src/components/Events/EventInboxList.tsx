/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  Avatar,
  Box,
  CircularProgress,
  Divider,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NoBandNoEventsPaper from '../Bands/NoBandNoEventsPaper';

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
}: {
  onLoaded?: (count: number) => void;
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

  const load = useCallback(async () => {
    setLoading(true);

    // 1) Who am I?
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

    // 2) Which bands do I belong to?
    const { data: mems, error: memErr } = await sb
      .from('band_members')
      .select('band_id')
      .eq('user_id', userId);
    if (memErr) throw memErr;

    const bandIds = (mems ?? []).map((m: any) => m.band_id);
    if (bandIds.length === 0) {
      setRows([]);
      setLastMsgs({});
      setAvatarMap({});
      setLoading(false);
      onLoaded?.(0);
      return;
    }

    // 3) Fetch events WITH my tri-state status from the view
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

    // 4) Sort: upcoming asc, past desc
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

    // 5) Latest message per event
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
      } else setLastMsgs({});
    } else {
      setLastMsgs({});
    }

    // 6) Sign private band avatar URLs
    const uniqueBandPairs = Array.from(
      new Map(
        sorted
          .filter((e) => e.bands?.id && e.bands?.avatar_url)
          .map((e) => [e.bands!.id, e.bands!.avatar_url as string])
      ).entries()
    );
    const nextAvatarMap: Record<string, string> = {};
    for (const [bandId, path] of uniqueBandPairs) {
      const { data, error } = await sb.storage
        .from('band-avatars')
        .createSignedUrl(path, 60 * 60);
      if (!error && data?.signedUrl) nextAvatarMap[bandId] = data.signedUrl;
    }
    setAvatarMap(nextAvatarMap);
    setLoading(false);
  }, [sb, onLoaded]);

  useEffect(() => {
    load();
  }, [load]);

  // Realtime: last message updates
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

  const onOpen = (bandId: string, eventId: string) => {
    router.push(`/bands/${bandId}/events/${eventId}`);
  };

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      {loading ? (
        <Stack alignItems="center" sx={{ py: 4, opacity: 0.7 }}>
          <CircularProgress size={20} />
        </Stack>
      ) : rows.length === 0 ? (
        <NoBandNoEventsPaper
          kind="events"
          onPrimary={() => setCreateOpen(true)}
          maxWidth="100%"
          contentMaxWidth="100%"
          center
        />
      ) : (
        <List disablePadding>
          {rows.map((e, idx) => {
            const band = e.bands;
            const when = e.starts_at
              ? new Date(e.starts_at).toLocaleDateString(undefined, {
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '';
            const lm = lastMsgs[e.id];
            const preview =
              lm?.body ??
              (e.location ? `Location: ${e.location}` : `${e.type} scheduled`);
            const avatarSrc = (band?.id && avatarMap[band.id]) || undefined;

            // Tri-state for the right bar comes directly from SQL
            const eventStatus: 'pending' | 'confirmed' | 'cancelled' =
              e.my_event_status;

            return (
              <Box key={e.id}>
                <ListItemButton
                  onClick={() => onOpen(e.band_id, e.id)}
                  sx={(t) => {
                    const barColor =
                      eventStatus === 'cancelled'
                        ? t.palette.error.main
                        : eventStatus === 'confirmed'
                        ? t.palette.success.main
                        : t.palette.warning.main;

                    return {
                      position: 'relative',
                      py: 1.5,
                      px: 1.25,
                      pr: 2.75,
                      borderRadius: 2,
                      alignItems: 'flex-start',
                      '&:hover': {
                        backgroundColor: alpha(t.palette.primary.main, 0.06),
                      },
                      // Right status bar — flat, shorter, no highlight
                      '&::after': {
                        content: '""',
                        position: 'absolute',
                        right: 6,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 4,
                        height: 32,
                        borderRadius: 999,
                        backgroundColor: barColor,
                        boxShadow: 'none',
                        backgroundImage: 'none',
                      },
                    };
                  }}
                >
                  {/* Avatar */}
                  <Avatar
                    src={avatarSrc}
                    alt={band?.name || 'Band'}
                    sx={{
                      width: 48,
                      height: 48,
                      mr: 1.5,
                      fontWeight: 800,
                      bgcolor: alpha('#FFF', 0.06),
                      color: 'white',
                      flexShrink: 0,
                    }}
                  >
                    {(band?.name || '?')
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join('')}
                  </Avatar>

                  <ListItemText
                    primary={
                      <Stack direction="row" alignItems="baseline" spacing={1}>
                        <Typography
                          sx={{
                            fontWeight: 900,
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 16,
                            letterSpacing: 0.2,
                          }}
                        >
                          {e?.title || 'Event'}
                        </Typography>
                        {when && (
                          <Typography
                            variant="caption"
                            sx={{ opacity: 0.7, whiteSpace: 'nowrap' }}
                          >
                            {when}
                          </Typography>
                        )}
                      </Stack>
                    }
                    secondary={
                      <Typography
                        sx={{
                          opacity: 0.85,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          fontSize: 13.5,
                        }}
                        title={preview}
                      >
                        {preview}
                      </Typography>
                    }
                    primaryTypographyProps={{ component: 'div' }}
                    secondaryTypographyProps={{ component: 'div' }}
                    sx={{ mr: 1.5, minWidth: 0 }}
                  />

                  {/* (Optional) actions go here */}
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={0.75}
                    onClick={(ev) => ev.stopPropagation()}
                    onMouseDown={(ev) => ev.stopPropagation()}
                    sx={{ pt: 0.25 }}
                  />
                </ListItemButton>

                {idx < rows.length - 1 && (
                  <Divider sx={{ ml: 8, opacity: 0.08 }} />
                )}
              </Box>
            );
          })}
        </List>
      )}
    </Box>
  );
}
