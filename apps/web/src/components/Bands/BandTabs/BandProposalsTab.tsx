/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import AddIcon from '@mui/icons-material/Add';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  List,
  ListItemButton,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '../../../lib/supabaseClient';
import AddProposalDialog from '../../Events/Proposals/AddProposalDialog';

type Props = { bandId: string; isAdmin: boolean };

type ProposalLite = {
  id: string;
  title: string | null;
  venue: string | null;
  created_at: string;
};

export default function BandProposalsTab({ bandId, isAdmin }: Props) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [proposals, setProposals] = useState<ProposalLite[]>([]);
  const [openNew, setOpenNew] = useState(false);

  const SURFACE_GRAD =
    'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))';

  const fetchAll = useCallback(async () => {
    try {
      setErr(null);
      setLoading(true);
      const { data, error } = await sb
        .from('gig_proposals')
        .select('id, title, venue, created_at')
        .eq('band_id', bandId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setProposals(data ?? []);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }, [sb, bandId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Empty message WITHOUT its own padding (outer Box provides px/py)
  function EmptyListMessage({ children }: { children: React.ReactNode }) {
    return (
      <Stack spacing={2}>
        <Typography sx={{ opacity: 0.7 }}>{children}</Typography>
      </Stack>
    );
  }

  return (
    // Match Events tab outer padding exactly
    <Box sx={{ px: { xs: 2, md: 3 }, py: 2 }}>
      <Stack spacing={2}>
        {err && <Alert severity="error">{err}</Alert>}

        {!loading && proposals.length === 0 ? (
          <EmptyListMessage>No proposed gigs yet.</EmptyListMessage>
        ) : (
          <List
            disablePadding
            sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}
          >
            {proposals.map((p, idx) => {
              const title = p.title || 'Proposed gig';
              const sub = p.venue?.trim()
                ? `Venue: ${p.venue}`
                : 'Tap to add time options';

              return (
                <Box key={p.id}>
                  <ListItemButton
                    onClick={() =>
                      router.push(`/bands/${bandId}/proposals/${p.id}`)
                    }
                    sx={(t) => ({
                      py: 1.25,
                      px: 1.25,
                      borderRadius: 2,
                      alignItems: 'stretch',
                      border: `1px solid ${alpha(
                        t.palette.primary.main,
                        0.08
                      )}`,
                      background: SURFACE_GRAD,
                      transition:
                        'background-color 120ms ease, border-color 120ms ease',
                      '&:hover': {
                        backgroundColor: alpha(t.palette.primary.main, 0.06),
                        borderColor: alpha(t.palette.primary.main, 0.16),
                      },
                    })}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        gridTemplateColumns: '1fr auto',
                        alignItems: 'center',
                        columnGap: 1,
                        width: '100%',
                        minWidth: 0,
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
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
                          title={title}
                        >
                          {title}
                        </Typography>
                        <Typography
                          sx={{
                            opacity: 0.85,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: 13.5,
                            mt: 0.25,
                          }}
                          title={sub}
                        >
                          {sub}
                        </Typography>
                      </Box>

                      <Chip
                        size="small"
                        label="Proposed"
                        sx={(t) => ({
                          height: 20,
                          fontSize: 11,
                          borderRadius: 1,
                          border: `1px solid ${alpha(
                            t.palette.primary.main,
                            0.28
                          )}`,
                          justifySelf: 'end',
                          alignSelf: 'center',
                        })}
                      />
                    </Box>
                  </ListItemButton>

                  {idx < proposals.length - 1 && (
                    <Divider sx={{ ml: 0, opacity: 0.08 }} />
                  )}
                </Box>
              );
            })}
          </List>
        )}

        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            sx={{ alignSelf: 'center', mb: 1 }}
            onClick={() => setOpenNew(true)}
          >
            Propose New Gig
          </Button>
        )}
      </Stack>

      <AddProposalDialog
        bandId={bandId}
        open={openNew}
        onClose={() => setOpenNew(false)}
        onCreated={(proposalId) =>
          router.push(`/bands/${bandId}/proposals/${proposalId}`)
        }
      />
    </Box>
  );
}
