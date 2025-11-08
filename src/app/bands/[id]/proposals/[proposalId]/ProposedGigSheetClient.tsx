/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';

type Props = {
  bandId: string;
  proposalId: string;
};

type Option = {
  id: string;
  starts_at: string;
  yes: number;
  no: number;
  myVote?: 'yes' | 'no';
};

type Proposal = {
  id: string;
  title: string | null;
  venue: string | null;
  created_at: string;
  created_by: string | null;
  options: Option[];
};

export default function ProposedGigSheetClient({ bandId, proposalId }: Props) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [membersCount, setMembersCount] = useState(0);
  const [myId, setMyId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Admin: add option
  const [adding, setAdding] = useState(false);
  const [newDate, setNewDate] = useState('');

  const gotoTab = (tab: 'overview' | 'events' | 'roster') =>
    window.dispatchEvent(
      new CustomEvent('amplee:band-tab', { detail: { tab } })
    );

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await sb.auth.getUser();
      const uid = user?.id ?? '';
      setMyId(uid);

      const { count: memCount } = await sb
        .from('band_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('band_id', bandId);
      setMembersCount(memCount ?? 0);

      const { data, error: propErr } = await sb
        .from('gig_proposals')
        .select(
          `
          id,
          title,
          venue,
          created_at,
          created_by,
          gig_proposal_options!gig_proposal_options_proposal_id_fkey (
            id,
            starts_at,
            gig_proposal_votes!gig_proposal_votes_option_id_fkey (
              user_id,
              vote
            )
          )
        `
        )
        .eq('id', proposalId)
        .maybeSingle();

      if (propErr) throw propErr;
      if (!data) {
        setError('Proposal not found');
        return;
      }

      const options = (data.gig_proposal_options ?? []).map((o: any) => {
        const votes = o.gig_proposal_votes ?? [];
        return {
          id: o.id,
          starts_at: o.starts_at,
          yes: votes.filter((v: any) => v.vote === 'yes').length,
          no: votes.filter((v: any) => v.vote === 'no').length,
          myVote: votes.find((v: any) => v.user_id === uid)?.vote,
        };
      });

      setProposal({
        id: data.id,
        title: data.title,
        venue: data.venue,
        created_at: data.created_at,
        created_by: data.created_by ?? null,
        options,
      });
    } catch (e: any) {
      console.error(e);
      setError(e.message ?? 'Failed to load proposal');
    } finally {
      setLoading(false);
    }
  }, [sb, bandId, proposalId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function addOption() {
    try {
      if (!newDate) return;
      const iso = new Date(newDate).toISOString();
      const { error } = await sb.from('gig_proposal_options').insert({
        proposal_id: proposalId,
        starts_at: iso,
      });
      if (error) throw error;
      setNewDate('');
      setAdding(false);
      fetchData();
    } catch (e) {
      console.error(e);
      setError('Failed to add date option');
    }
  }

  async function vote(optionId: string, vote: 'yes' | 'no') {
    try {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new Error('Not signed in');

      await sb.from('gig_proposal_votes').upsert(
        {
          proposal_id: proposalId,
          option_id: optionId,
          user_id: user.id,
          vote,
        },
        { onConflict: 'proposal_id,option_id,user_id' }
      );

      fetchData();
    } catch (e) {
      console.error(e);
    }
  }

  async function convert(optionId: string) {
    try {
      const res = await fetch(
        `/api/bands/${bandId}/proposals/${proposalId}/convert`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ optionId }),
        }
      );
      if (!res.ok) throw new Error(await res.text());

      router.replace(`/bands/${bandId}`);
      setTimeout(() => gotoTab('events'), 0);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to convert to event');
    }
  }

  if (loading) {
    return (
      <Stack alignItems="center" sx={{ mt: 8 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 4 }}>
        {error}
      </Alert>
    );
  }

  if (!proposal) return null;

  const isAdmin = proposal.created_by === myId;

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, pb: 5 }}>
      <Button
        onClick={() => router.push(`/bands/${bandId}?tab=proposals`)}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2 }}
      >
        Back to Proposed Gigs
      </Button>

      <Paper
        elevation={0}
        sx={(t) => ({
          p: 3,
          borderRadius: 2,
          mb: 3,
          border: `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        })}
      >
        <Typography variant="h5" fontWeight={900}>
          {proposal.title || 'Proposed Gig'}
        </Typography>
        {proposal.venue && (
          <Typography sx={{ opacity: 0.8, mt: 0.5 }}>
            {proposal.venue}
          </Typography>
        )}
      </Paper>

      {/* Options list */}
      <Stack spacing={2}>
        {proposal.options.map((o) => {
          const allYes =
            membersCount > 0 && o.yes === membersCount && o.no === 0;

          return (
            <Paper
              key={o.id}
              elevation={0}
              sx={(t) => ({
                p: 2,
                borderRadius: 2,
                border: `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
                background:
                  'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
              })}
            >
              <Stack spacing={1}>
                <Typography fontWeight={700}>
                  {new Date(o.starts_at).toLocaleString()}
                </Typography>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Button
                    variant={o.myVote === 'yes' ? 'contained' : 'outlined'}
                    color="success"
                    size="small"
                    startIcon={<CheckIcon />}
                    onClick={() => vote(o.id, 'yes')}
                  >
                    Yes ({o.yes})
                  </Button>

                  <Button
                    variant={o.myVote === 'no' ? 'contained' : 'outlined'}
                    size="small"
                    color="error"
                    startIcon={<CloseIcon />}
                    onClick={() => vote(o.id, 'no')}
                  >
                    No ({o.no})
                  </Button>
                </Stack>

                {allYes && (
                  <Button
                    size="small"
                    color="success"
                    variant="contained"
                    sx={{ mt: 1 }}
                    onClick={() => convert(o.id)}
                  >
                    Convert to Event
                  </Button>
                )}
              </Stack>
            </Paper>
          );
        })}
      </Stack>

      {isAdmin && (
        <Stack
          spacing={1.5}
          sx={() => ({
            p: 2,
            mb: 3,
          })}
        >
          {!adding ? (
            <Button
              variant="contained"
              onClick={() => setAdding(true)}
              startIcon={<AddIcon />}
              sx={{ alignSelf: 'center', mb: 1 }}
            >
              Add date option
            </Button>
          ) : (
            <Stack spacing={1}>
              <Typography fontWeight={700}>Add a date option</Typography>

              <Stack direction="row" spacing={1}>
                <TextField
                  type="datetime-local"
                  fullWidth
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                />
                <Button
                  variant="contained"
                  disabled={!newDate}
                  onClick={addOption}
                >
                  Save
                </Button>
              </Stack>

              <Button
                color="inherit"
                onClick={() => {
                  setAdding(false);
                  setNewDate('');
                }}
                sx={{ alignSelf: 'flex-start' }}
              >
                Cancel
              </Button>
            </Stack>
          )}
        </Stack>
      )}
    </Box>
  );
}
