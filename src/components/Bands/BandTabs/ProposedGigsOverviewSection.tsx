/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import HowToVoteIcon from '@mui/icons-material/HowToVote';

import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import {
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  List,
  ListItemButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
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

export function ProposedGigsOverviewSeciton({
  bandId,
  isAdmin = false,
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

      const { data: proposals, error: pErr } = await sb
        .from('gig_proposals')
        .select(
          `
          id, title, venue, created_at,
          gig_proposal_options!gig_proposal_options_proposal_id_fkey(
            id, starts_at,
            gig_proposal_votes!gig_proposal_votes_option_id_fkey(user_id, vote)
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
        options: (p.gig_proposal_options ?? []).map((o: any) => ({
          id: o.id,
          starts_at: o.starts_at ?? null,
          votes: (o.gig_proposal_votes ?? []) as {
            user_id: string;
            vote: 'yes' | 'no';
          }[],
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
        {!items.length && !isAdmin ? (
          <Typography sx={{ opacity: 0.75 }}>Nothing to show yet.</Typography>
        ) : !items.length ? (
          <EmptyHint
            text="No proposals yet."
            actionLabel="Add proposed gig"
            href={`/bands/${bandId}?tab=proposals`}
          />
        ) : (
          <Stack spacing={1}>
            <List
              disablePadding
              sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}
            >
              {items.map((x, i) => {
                const title = x.base.title || 'Proposed gig';
                const sub = x.base.venue?.trim()
                  ? `Venue: ${x.base.venue}`
                  : x.hasOptions
                  ? 'Vote on date options'
                  : 'Add time options';

                const pct = Math.round((x.bestYesPct || 0) * 100);
                const votedSummary =
                  x.totalMembers > 0
                    ? `${x.votedCount}/${x.totalMembers} voted`
                    : '';

                const chip =
                  x.tag === 'all-yes' ? (
                    <Chip
                      size="small"
                      icon={<DoneAllIcon sx={{ fontSize: 16 }} />}
                      label="Ready to book"
                      color="success"
                      sx={{ height: 22, fontSize: 12, borderRadius: 1 }}
                    />
                  ) : x.tag === 'trending' ? (
                    <Chip
                      size="small"
                      icon={<TrendingUpIcon sx={{ fontSize: 16 }} />}
                      label="Strong support"
                      color="primary"
                      sx={{ height: 22, fontSize: 12, borderRadius: 1 }}
                    />
                  ) : (
                    <Chip
                      size="small"
                      icon={<HowToVoteIcon sx={{ fontSize: 16 }} />}
                      label="Needs votes"
                      sx={(t) => ({
                        height: 22,
                        fontSize: 12,
                        borderRadius: 1,
                        border: `1px solid ${alpha(
                          t.palette.primary.main,
                          0.28
                        )}`,
                      })}
                    />
                  );

                return (
                  <Box key={x.base.id}>
                    <ListItemButton
                      component={NextLink}
                      href={`/bands/${bandId}/proposals/${x.base.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        window.location.assign(
                          `/bands/${bandId}/proposals/${x.base.id}`
                        );
                      }}
                      sx={(t) => ({
                        py: 1.25,
                        px: 1.25,
                        alignItems: 'flex-start',
                        '&:hover': {
                          backgroundColor: alpha(t.palette.primary.main, 0.06),
                          borderColor: alpha(t.palette.primary.main, 0.16),
                          borderRadius: 2,
                        },
                      })}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            alignItems: 'center',
                            columnGap: 1,
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
                            title={title}
                          >
                            {title}
                          </Typography>
                          <Tooltip title={votedSummary || ''}>
                            <Box sx={{ justifySelf: 'end' }}>{chip}</Box>
                          </Tooltip>
                        </Box>

                        <Typography
                          sx={{
                            opacity: 0.85,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 13.5,
                            mt: 0.5,
                          }}
                          title={sub}
                        >
                          {sub}
                        </Typography>

                        {x.hasOptions && x.totalMembers > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <LinearProgress
                              variant="determinate"
                              value={pct}
                              sx={{
                                height: 6,
                                borderRadius: 999,
                                bgcolor: 'rgba(255,255,255,0.06)',
                              }}
                            />
                            <Typography
                              variant="caption"
                              sx={{ opacity: 0.7, mt: 0.25, display: 'block' }}
                            >
                              {votedSummary}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    </ListItemButton>

                    {i < items.length - 1 && (
                      <Divider sx={{ opacity: 0.08, ml: 0 }} />
                    )}
                    <Divider />
                  </Box>
                );
              })}
            </List>

            {/* footer actions */}
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
