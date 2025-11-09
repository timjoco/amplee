/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { Box, Chip, Divider, Stack, Typography } from '@mui/material';
import { JSX, useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '../../../lib/supabaseClient';

type AmpLevel = 'basic' | 'boost' | 'pro' | 'elite';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AMP_BADGE_STYLES: Record<AmpLevel, any> = {
  basic: {
    bg: 'rgba(151, 71, 255, 0.22)',
    fg: '#EDEBFF',
    bd: 'rgba(151,71,255,0.55)',
  },
  boost: {
    bg: 'rgba(151, 71, 255, 0.32)',
    fg: '#EDEBFF',
    bd: 'rgba(151,71,255,0.65)',
  },
  pro: {
    bg: 'rgba(0,184,255,0.28)',
    fg: '#E6FBFF',
    bd: 'rgba(0,184,255,0.55)',
  },
  elite: {
    bg: 'rgba(255,215,0,0.28)',
    fg: '#FFF7CC',
    bd: 'rgba(255,215,0,0.55)',
  },
};

export function BandSummaryOverviewSection({
  bandId,
  CardLike,
}: {
  bandId: string;
  CardLike: (p: {
    children: React.ReactNode;
    loading?: boolean;
    err?: string | null;
  }) => JSX.Element;
}) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [memberCount, setMemberCount] = useState(0);
  const [showsPlayed, setShowsPlayed] = useState(0);
  const [genres, setGenres] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [ampLevel, setAmpLevel] = useState<AmpLevel>('basic');
  const [yearsActive, setYearsActive] = useState<string>('—');

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    try {
      // Members
      const { count: mCount } = await sb
        .from('band_members')
        .select('*', { head: true, count: 'exact' })
        .eq('band_id', bandId);

      setMemberCount(mCount ?? 0);

      const { count: sCount } = await sb
        .from('events')
        .select('*', { head: true, count: 'exact' })
        .eq('band_id', bandId)
        .eq('type', 'show')
        .eq('is_cancelled', false);

      setShowsPlayed(sCount ?? 0);

      const { data: gRows } = await sb
        .from('band_genres')
        .select('genres(name)')
        .eq('band_id', bandId)
        .order('genres(name)');

      const gs =
        (gRows ?? []).map((r: any) => r.genres?.name).filter(Boolean) ?? [];
      setGenres(gs);

      const { data: bandRow } = await sb
        .from('bands')
        .select('amplification_level, created_at')
        .eq('id', bandId)
        .maybeSingle();

      if (bandRow?.amplification_level) {
        setAmpLevel(
          (bandRow.amplification_level.toLowerCase() as AmpLevel) ?? 'basic'
        );
      }

      if (bandRow?.created_at) {
        const created = new Date(bandRow.created_at);
        const now = new Date();
        const diffYears = now.getFullYear() - created.getFullYear();

        if (diffYears <= 0) setYearsActive('<1 yr');
        else if (diffYears === 1) setYearsActive('1 yr');
        else setYearsActive(`${diffYears} yrs`);
      }
    } catch (e: any) {
      setErr(e?.message || 'Failed to load band summary');
    } finally {
      setLoading(false);
    }
  }, [sb, bandId]);

  useEffect(() => void load(), [load]);

  return (
    <CardLike loading={loading} err={err}>
      {!loading && !err && (
        <Stack
          spacing={2}
          sx={{
            height: '100%',
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <Stack spacing={0.5}>
            <Stack direction="row" sx={{ py: 0.5, mb: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{
                  fontWeight: 900,
                  fontSize: '0.9rem',
                  color: '#FFD37A',
                  letterSpacing: 0.6,
                }}
              >
                ⚡ Snapshot
              </Typography>

              <Box sx={{ flexGrow: 1 }} />

              {/* <AmpBadge level={ampLevel} /> */}
            </Stack>

            <Stack
              direction="row"
              justifyContent="space-around"
              alignItems="center"
              sx={{ pt: 0, pb: 0 }}
            >
              <StatBlock emoji="👥" value={memberCount} label="Members" />
              <VerticalDivider />
              <StatBlock emoji="🎤" value={showsPlayed} label="Shows" />
              <VerticalDivider />
              <StatBlock emoji="⏳" value={yearsActive} label="Years active" />
            </Stack>
          </Stack>

          <Divider />

          {/* BOTTOM – Genres */}
          <Stack spacing={1}>
            <Typography
              variant="subtitle1"
              sx={{
                fontWeight: 900,
                fontSize: '0.9rem',
                color: '#FFD37A',
                letterSpacing: 0.6,
              }}
            >
              ⚡ Genres
            </Typography>

            {genres.length === 0 ? (
              <Typography variant="body2" sx={{ opacity: 0.85 }}>
                No genres added yet.
              </Typography>
            ) : (
              <Stack
                direction="row"
                spacing={1.2}
                flexWrap="wrap"
                sx={{ pb: 1 }}
              >
                {genres.map((g) => (
                  <Chip
                    key={g}
                    label={g}
                    sx={{
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 3,
                      bgcolor: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#EDEBFF',
                      fontWeight: 700,
                      letterSpacing: 0.3,
                    }}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Stack>
      )}
    </CardLike>
  );
}

function StatBlock({
  emoji,
  value,
  label,
}: {
  emoji: string;
  value: number | string;
  label: string;
}) {
  return (
    <Stack spacing={0.25} alignItems="center">
      <Stack direction="row" spacing={0.75} alignItems="center">
        <span style={{ fontSize: 22 }}>{emoji}</span>

        <Typography variant="h6" sx={{ fontWeight: 900, color: '#DAD6FF' }}>
          {value}
        </Typography>
      </Stack>

      <Typography
        variant="body2"
        sx={{ opacity: 0.85, mt: 0.5, fontWeight: 500 }}
      >
        {label}
      </Typography>
    </Stack>
  );
}

function VerticalDivider() {
  return (
    <Box
      sx={{
        width: '1px',
        bgcolor: 'rgba(255,255,255,0.12)',
        mx: 1,
      }}
    />
  );
}

// function AmpBadge({ level }: { level?: string }) {
//   const normalized = (level?.toLowerCase() as AmpLevel) ?? 'basic';
//   const styles = AMP_BADGE_STYLES[normalized] ?? AMP_BADGE_STYLES.basic;

//   return (
//     <Box
//       sx={{
//         alignSelf: 'center',
//         px: 2.5,
//         py: 0.6,
//         borderRadius: 2,
//         bgcolor: styles.bg,
//         border: `1px solid ${styles.bd}`,
//         boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
//       }}
//     >
//       <Typography
//         variant="subtitle2"
//         sx={{
//           fontWeight: 900,
//           letterSpacing: 1.2,
//           color: styles.fg,
//         }}
//       >
//         {normalized.toUpperCase()}
//       </Typography>
//     </Box>
//   );
// }
