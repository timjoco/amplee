/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import CloseIcon from '@mui/icons-material/Close';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
} from '@mui/material';
import { useMemo, useState } from 'react';

type Props = {
  bandId: string;
  open: boolean;
  onClose: () => void;
  onCreated?: (proposalId: string) => void; // fire after create
};

export default function AddProposalDialog({
  bandId,
  open,
  onClose,
  onCreated,
}: Props) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const reset = () => {
    setTitle('');
    setVenue('');
    setSaving(false);
    setErr(null);
  };

  async function handleCreate() {
    try {
      setSaving(true);
      setErr(null);

      const {
        data: { user },
        error: userErr,
      } = await sb.auth.getUser();
      if (userErr) throw userErr;
      if (!user) throw new Error('Not signed in');

      const { data, error } = await sb
        .from('gig_proposals')
        .insert([
          {
            band_id: bandId,
            title: title.trim() || null,
            venue: venue.trim() || null,
            created_by: user.id,
          },
        ])
        .select('id')
        .single();

      if (error) throw error;

      reset();
      onClose();
      onCreated?.(data.id);
    } catch (e: any) {
      setSaving(false);
      setErr(e?.message ?? 'Failed to create proposal');
    }
  }

  const canSave = title.trim().length > 0 && !saving;

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        New proposed gig
        <IconButton
          aria-label="close"
          onClick={() => !saving && onClose()}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 0.5 }}>
          {err && <Alert severity="error">{err}</Alert>}

          <TextField
            label="Gig idea (required)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            fullWidth
            onKeyDown={(e) => {
              if (e.key === 'Enter' && canSave) handleCreate();
            }}
          />

          <TextField
            label="Venue (optional)"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            fullWidth
          />

          <Box sx={{ height: 2 }}>
            {saving && <CircularProgress size={18} sx={{ ml: 0.5 }} />}
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button color="inherit" onClick={() => !saving && onClose()}>
          Cancel
        </Button>
        <Button variant="contained" disabled={!canSave} onClick={handleCreate}>
          Create
        </Button>
      </DialogActions>
    </Dialog>
  );
}
