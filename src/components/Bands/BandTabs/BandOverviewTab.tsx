/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import AvatarImage from '@/components/ui/AvatarImage';
import RolePill from '@/components/ui/RolePill';
import { supabaseBrowser } from '@/lib/supabaseClient';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PlaceIcon from '@mui/icons-material/Place';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  ListItemButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { alpha } from '@mui/material/styles';
import NextLink from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { ProposedGigsOverviewSeciton } from './ProposedGigsOverviewSection';

type EventRow = {
  is_cancelled: any;
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice' | string;
  starts_at: string | null;
  location: string | null;
};

type RosterRow = {
  user_id: string;
  name: string;
  avatar_url?: string | null;
  updated_at?: string | null;
  role: 'admin' | 'member';
  title?: string | null;
};

export default function BandOverviewTab({ bandId }: { bandId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [nextEvent, setNextEvent] = useState<EventRow | null>(null);
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    []
  );
  const sectionTitleSx = {
    mt: 1,
    mb: 1,
    letterSpacing: 0.3,
    fontWeight: 700,
  } as const;

  const gotoTab = (tab: 'overview' | 'events' | 'proposals' | 'roster') =>
    window.dispatchEvent(
      new CustomEvent('amplee:band-tab', { detail: { tab } })
    );

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    try {
      const { data: events, error: eErr } = await sb
        .from('events')
        .select('id, band_id, title, type, starts_at, location, is_cancelled')
        .eq('band_id', bandId)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(1);
      if (eErr) throw eErr;
      const e = (events?.[0] as EventRow) ?? null;
      setNextEvent(e ?? null);

      const { data: members, error: mErr } = await sb
        .from('band_members')
        .select('user_id, role, title')
        .eq('band_id', bandId)
        .order('created_at', { ascending: true });
      if (mErr) throw mErr;

      const ids = (members ?? []).map((m: any) => m.user_id);
      if (ids.length === 0) {
        setRoster([]);
        return;
      }

      const { data: profiles, error: pErr } = await sb
        .from('profiles')
        .select('id, display_name, first_name, avatar_url, updated_at')
        .in('id', ids);
      if (pErr) throw pErr;

      const byId = new Map<string, any>(
        (profiles ?? []).map((p: any) => [p.id, p])
      );
      const merged: RosterRow[] = (members ?? []).map((m: any) => {
        const p = byId.get(m.user_id) || {};
        return {
          user_id: m.user_id,
          name: p.display_name ?? p.first_name ?? 'Member',
          avatar_url: p.avatar_url ?? null,
          updated_at: p.updated_at ?? null,
          role: m.role === 'admin' ? 'admin' : 'member',
          title: m.title ?? null,
        };
      });

      setRoster(merged);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, [sb, bandId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: { xs: 2, md: 3 } }}>
      <Grid container spacing={1} sx={{ pb: 1 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="subtitle1" sx={sectionTitleSx}>
            Next Upcoming Event{' '}
          </Typography>
          <CardLike loading={loading} err={err}>
            {!nextEvent ? (
              <EmptyHint
                text="No upcoming events scheduled."
                actionLabel="Create event"
                href={`/bands/${bandId}/events/new`}
              />
            ) : (
              <>
                <ListItemButton
                  component={NextLink}
                  href={`/bands/${bandId}/events/${nextEvent.id}`}
                  sx={(t) => ({
                    px: 1.25,
                    py: 1.25,
                    alignItems: 'flex-start',

                    '&:hover': {
                      backgroundColor: alpha(t.palette.primary.main, 0.06),
                      borderColor: alpha(t.palette.primary.main, 0.16),
                      borderRadius: 2,
                    },
                  })}
                >
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: '1fr auto',
                      columnGap: 1,
                      width: '100%',
                      minWidth: 0,
                    }}
                  >
                    {/* Content */}
                    <Stack spacing={1.25} sx={{ minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        fontWeight={900}
                        letterSpacing={0.2}
                        noWrap
                        title={nextEvent.title}
                      >
                        {nextEvent.title}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={1.5}
                        alignItems="center"
                        sx={{ flexWrap: 'wrap' }}
                      >
                        {nextEvent.starts_at && (
                          <RowIconText
                            icon={<CalendarMonthIcon fontSize="small" />}
                            text={timeFmt.format(new Date(nextEvent.starts_at))}
                          />
                        )}
                        {nextEvent.location && (
                          <RowIconText
                            icon={<PlaceIcon fontSize="small" />}
                            text={nextEvent.location}
                          />
                        )}
                        {typeof nextEvent.is_cancelled === 'boolean' && (
                          <Chip
                            label={
                              nextEvent.is_cancelled ? 'Cancelled' : 'Scheduled'
                            }
                            size="small"
                            sx={{
                              height: 22,
                              fontWeight: 800,
                              bgcolor: nextEvent.is_cancelled
                                ? 'error.main'
                                : '#B6FF68',
                              color: nextEvent.is_cancelled
                                ? 'white'
                                : '#193A0A',
                              border: `1px solid ${
                                nextEvent.is_cancelled
                                  ? 'rgba(255,255,255,0.28)'
                                  : '#CEFF9E'
                              }`,
                              '& .MuiChip-label': { px: 1.25 },
                            }}
                          />
                        )}
                      </Stack>
                    </Stack>
                  </Box>
                </ListItemButton>
                <Divider />
                <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                  <Button
                    onClick={() => gotoTab('events')}
                    variant="outlined"
                    sx={{ fontWeight: 900, borderRadius: 2 }}
                  >
                    View all events
                  </Button>
                </Stack>
              </>
            )}
          </CardLike>
        </Grid>

        {/* Roster preview (RolePill + optional title chip) */}
      </Grid>
      <Grid container spacing={2.5}>
        {/* second row on overview*/}
        <Grid size={{ xs: 12, md: 8 }}>
          <ProposedGigsOverviewSeciton
            bandId={bandId}
            maxItems={3}
            sectionTitleSx={sectionTitleSx}
            CardLike={CardLike}
            EmptyHint={EmptyHint}
            gotoTab={gotoTab}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Typography variant="subtitle1" sx={sectionTitleSx}>
            Band Members{' '}
          </Typography>
          <CardLike loading={loading} err={err}>
            {roster.length === 0 ? (
              <EmptyHint
                text="No members yet."
                actionLabel="Manage roster"
                href={`/bands/${bandId}/settings#roster`}
              />
            ) : (
              <Stack
                divider={<Divider sx={{ opacity: 0.12 }} />}
                spacing={0.75}
              >
                {roster.slice(0, 8).map((r) => (
                  <Stack
                    key={r.user_id}
                    direction="row"
                    alignItems="center"
                    spacing={1}
                    sx={{ py: 0.5 }}
                  >
                    <AvatarImage
                      name={r.name}
                      bucket="profile-avatars"
                      srcGuess={r.avatar_url || undefined}
                      size={32}
                    />
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography noWrap fontWeight={700}>
                        {r.name}
                      </Typography>
                    </Box>

                    {/* Optional loose title chip */}
                    {r.title && (
                      <Chip
                        size="small"
                        label={r.title}
                        sx={{
                          mr: 1,
                          textTransform: 'capitalize',
                          height: 24,
                          borderRadius: 12,
                          border: (t) =>
                            `1px solid ${alpha(t.palette.primary.main, 0.24)}`,
                        }}
                      />
                    )}

                    {/* Admin/Member pill */}
                    <RolePill role={r.role} size="small" />
                  </Stack>
                ))}

                {roster.length > 8 && (
                  <Typography variant="caption" sx={{ opacity: 0.7, pt: 0.5 }}>
                    +{roster.length - 8} more
                  </Typography>
                )}
                <Divider />

                <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
                  <Button
                    component={NextLink}
                    href={`/bands/${bandId}?tab=roster`}
                    onClick={(e) => {
                      e.preventDefault();
                      gotoTab('roster');
                    }}
                    variant="outlined"
                    sx={{ fontWeight: 900, borderRadius: 2 }}
                  >
                    View full roster
                  </Button>
                </Stack>
              </Stack>
            )}
          </CardLike>
        </Grid>
      </Grid>
    </Box>
  );
}

/* ----------------------------- Helpers ----------------------------- */
function CardLike({
  title,
  children,
  loading,
  err,
}: {
  title?: string;
  children: React.ReactNode;
  loading?: boolean;
  err?: string | null;
}) {
  return (
    <Paper
      sx={(t) => ({
        p: { xs: 2, md: 2.5 },
        borderRadius: 2,
        border: `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      })}
    >
      <Stack spacing={1.5}>
        <Typography variant="h6" fontWeight={900} letterSpacing={0.2}>
          {title}
        </Typography>

        {loading ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircularProgress size={18} />
            <Typography variant="body2">Loading…</Typography>
          </Stack>
        ) : err ? (
          <Typography variant="body2" color="error">
            {err}
          </Typography>
        ) : (
          children
        )}
      </Stack>
    </Paper>
  );
}

function RowIconText({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <Stack direction="row" spacing={0.75} alignItems="center">
      <Box sx={{ opacity: 0.9, display: 'inline-flex', alignItems: 'center' }}>
        {icon}
      </Box>
      <Typography variant="body2" sx={{ opacity: 0.9 }}>
        {text}
      </Typography>
    </Stack>
  );
}

function EmptyHint({
  text,
  actionLabel,
  href,
}: {
  text: string;
  actionLabel?: string;
  href?: string;
}) {
  return (
    <Stack spacing={1}>
      <Typography variant="body2" sx={{ opacity: 0.85 }}>
        {text}
      </Typography>
      {actionLabel && href && (
        <Box>
          <Button
            component={NextLink}
            href={href}
            variant="outlined"
            endIcon={<ArrowForwardIcon />}
            sx={{ fontWeight: 900, borderRadius: 2 }}
          >
            {actionLabel}
          </Button>
        </Box>
      )}
    </Stack>
  );
}
