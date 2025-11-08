/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import EventIcon from '@mui/icons-material/Event';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import PlaceIcon from '@mui/icons-material/Place';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import {
  Button,
  Chip,
  List,
  ListItemButton,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import NextLink from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

type ProposalRow = {
  id: string;
  title: string | null;
  venue: string | null;
  created_at: string;
  options: {
    id: string;
    starts_at: string | null;
    votes: { user_id: string; vote: 'yes' | 'no' }[];
  }[];
};

type Ranked = {
  base: ProposalRow;
  totalMembers: number;
  votedCount: number;
  bestYesCount: number;
  bestYesPct: number;
  hasOptions: boolean;
  tag: 'needs-votes' | 'trending' | 'all-yes' | null;
};

export function ProposedGigsOverviewSection({
  bandId,
  isAdmin,
  maxItems = 3,
  sectionTitleSx,
  CardLike,
  EmptyHint,
  gotoTab,
}: {
  bandId: string;
  isAdmin?: boolean;
  maxItems?: number;
  sectionTitleSx: any;
  CardLike: React.ComponentType<{
    title?: string;
    loading?: boolean;
    err?: string | null;
    children: React.ReactNode;
  }>;
  EmptyHint: React.ComponentType<{
    text: string;
    actionLabel?: string;
    href?: string;
  }>;
  gotoTab: (tab: 'overview' | 'events' | 'roster' | 'proposals') => void;
}) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<Ranked[]>([]);

  const load = useCallback(async () => {
    try {
      setErr(null);
      setLoading(true);

      const { count: totalMembers, error: memErr } = await sb
        .from('band_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('band_id', bandId);
      if (memErr) throw memErr;

      // Simpler relation path (don’t depend on FK name)
      const { data: proposals, error: pErr } = await sb
        .from('gig_proposals')
        .select(
          `
    id, title, venue, created_at,
    options:gig_proposal_options!gig_proposal_options_proposal_id_fkey (
      id, starts_at,
      votes:gig_proposal_votes!gig_proposal_votes_option_id_fkey ( user_id, vote )
    )
  `
        )
        .eq('band_id', bandId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (pErr) throw pErr;

      const rows: ProposalRow[] = (proposals ?? []).map((p: any) => ({
        id: p.id,
        title: p.title,
        venue: p.venue,
        created_at: p.created_at,
        options: (p.options ?? []).map((o: any) => ({
          id: o.id,
          starts_at: o.starts_at ?? null,
          votes: (o.votes ?? []) as { user_id: string; vote: 'yes' | 'no' }[],
        })),
      }));

      const ranked: Ranked[] = rows.map((r) => {
        const voterSet = new Set<string>();
        let bestYes = 0;
        for (const o of r.options) {
          let yes = 0;
          for (const v of o.votes) {
            voterSet.add(v.user_id);
            if (v.vote === 'yes') yes++;
          }
          bestYes = Math.max(bestYes, yes);
        }
        const tm = totalMembers ?? 0;
        const hasOptions = r.options.length > 0;
        const votedCount = voterSet.size;
        const bestYesPct = tm > 0 ? bestYes / tm : 0;

        let tag: Ranked['tag'] = null;
        if (hasOptions && tm > 0 && bestYes === tm && votedCount === tm)
          tag = 'all-yes';
        else if (hasOptions && bestYesPct >= 0.6) tag = 'trending';
        else tag = 'needs-votes';

        return {
          base: r,
          totalMembers: tm,
          votedCount,
          bestYesCount: bestYes,
          bestYesPct,
          hasOptions,
          tag,
        };
      });

      const needsVotes = ranked
        .filter((x) => x.tag === 'needs-votes')
        .sort((a, b) => {
          if (a.votedCount !== b.votedCount) return a.votedCount - b.votedCount;
          return +new Date(b.base.created_at) - +new Date(a.base.created_at);
        })
        .slice(0, 2);

      const trending = ranked
        .filter((x) => x.tag === 'trending' || x.tag === 'all-yes')
        .sort((a, b) => {
          if (b.bestYesPct !== a.bestYesPct) return b.bestYesPct - a.bestYesPct;
          const aMin = minStartsAt(a.base);
          const bMin = minStartsAt(b.base);
          if (aMin && bMin && aMin !== bMin) return aMin - bMin;
          return +new Date(b.base.created_at) - +new Date(a.base.created_at);
        })
        .slice(0, 1);

      setItems([...needsVotes, ...trending].slice(0, maxItems));
    } catch (e: any) {
      setErr(e.message ?? 'Failed to load proposed gigs');
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [sb, bandId, maxItems]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Typography variant="subtitle1" sx={sectionTitleSx}>
        Proposed Gigs
      </Typography>

      <CardLike loading={loading} err={err}>
        {!items.length ? (
          <Stack spacing={1.25} sx={{ pt: 0.5 }}>
            <Typography sx={{ opacity: 0.8 }}>No proposals yet.</Typography>

            <Stack direction="row" spacing={1}>
              {isAdmin && (
                <Button
                  component={NextLink}
                  href={`/bands/${bandId}?tab=proposals`}
                  onClick={(e) => {
                    e.preventDefault();
                    gotoTab('proposals');
                  }}
                  endIcon={<ArrowForwardIcon />}
                  variant="outlined"
                  sx={{ fontWeight: 900, borderRadius: 2 }}
                >
                  Propose New Gig
                </Button>
              )}
            </Stack>
          </Stack>
        ) : (
          <Stack spacing={1}>
            {/* ---- List of ranked proposals ---- */}
            <List disablePadding>
              {items.map((it) => {
                const p = it.base;
                const soonestTs = minStartsAt(p);
                const dateLabel =
                  soonestTs != null
                    ? new Intl.DateTimeFormat('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      }).format(soonestTs)
                    : 'TBD';

                const tagChip =
                  it.tag === 'all-yes' ? (
                    <Chip size="small" color="success" label="All yes" />
                  ) : it.tag === 'trending' ? (
                    <Chip
                      size="small"
                      color="warning"
                      icon={<WhatshotIcon sx={{ fontSize: 16 }} />}
                      label="Trending"
                    />
                  ) : (
                    <Chip
                      size="small"
                      variant="outlined"
                      icon={<HowToVoteIcon sx={{ fontSize: 16 }} />}
                      label="Needs votes"
                    />
                  );

                const yesPct =
                  it.totalMembers > 0
                    ? Math.round((it.bestYesCount / it.totalMembers) * 100)
                    : 0;

                return (
                  <ListItemButton
                    key={p.id}
                    dense
                    component={NextLink}
                    href={`/bands/${bandId}/proposals/${p.id}`}
                    prefetch={false}
                    sx={{
                      px: 1,
                      py: 1,
                      borderRadius: 1.25,
                      '&:not(:last-of-type)': { mb: 0.5 },
                    }}
                  >
                    <ListItemText
                      primary={
                        <Stack
                          direction="row"
                          alignItems="center"
                          justifyContent="space-between"
                          spacing={1}
                        >
                          <Typography fontWeight={700} noWrap>
                            {p.title || 'Proposed gig'}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={1}
                            alignItems="center"
                          >
                            {tagChip}
                            <Chip
                              size="small"
                              variant="outlined"
                              label={`${yesPct}% yes`}
                            />
                          </Stack>
                        </Stack>
                      }
                      secondary={
                        <Stack
                          direction="row"
                          spacing={2}
                          sx={{ mt: 0.5 }}
                          alignItems="center"
                        >
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <PlaceIcon sx={{ fontSize: 16, opacity: 0.75 }} />
                            <Typography
                              variant="caption"
                              sx={{ opacity: 0.8 }}
                              noWrap
                            >
                              {p.venue || 'Venue TBD'}
                            </Typography>
                          </Stack>
                          <Stack
                            direction="row"
                            spacing={0.5}
                            alignItems="center"
                          >
                            <EventIcon sx={{ fontSize: 16, opacity: 0.75 }} />
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              {dateLabel}
                            </Typography>
                          </Stack>
                          <Typography variant="caption" sx={{ opacity: 0.8 }}>
                            {it.votedCount}/{it.totalMembers} voted
                          </Typography>
                        </Stack>
                      }
                    />
                  </ListItemButton>
                );
              })}
            </List>

            {/* ---- Footer actions ---- */}
            <Stack direction="row" spacing={1} sx={{ pt: 1 }}>
              <Button
                component={NextLink}
                href={`/bands/${bandId}?tab=proposals`}
                onClick={(e) => {
                  e.preventDefault();
                  gotoTab('proposals');
                }}
                variant="outlined"
                sx={{ fontWeight: 900, borderRadius: 2 }}
              >
                View all proposals
              </Button>

              {isAdmin && (
                <Button
                  component={NextLink}
                  href={`/bands/${bandId}?tab=proposals`}
                  onClick={(e) => {
                    e.preventDefault();
                    gotoTab('proposals');
                  }}
                  startIcon={<AddIcon />}
                  variant="contained"
                  sx={{ fontWeight: 900, borderRadius: 2 }}
                >
                  Add proposed gig
                </Button>
              )}
            </Stack>
          </Stack>
        )}
      </CardLike>
    </>
  );
}

/* helper */
function minStartsAt(p: ProposalRow): number | null {
  const ts = p.options
    .map((o) => (o.starts_at ? +new Date(o.starts_at) : null))
    .filter((n): n is number => !!n);
  return ts.length ? Math.min(...ts) : null;
}
