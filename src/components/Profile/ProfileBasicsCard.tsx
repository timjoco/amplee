'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import {
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
  alpha,
} from '@mui/material';
import { useEffect, useMemo, useState } from 'react';

type Props = {
  userId?: string;
  initialDisplayName?: string | null;
  onSaved?: (displayName: string) => void;
};

export default function ProfileBasicsCard({
  userId,
  initialDisplayName,
  onSaved,
}: Props) {
  const sb = useMemo(() => supabaseBrowser(), []);

  const [value, setValue] = useState(initialDisplayName ?? '');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(Boolean(initialDisplayName));

  // If initialDisplayName arrives later, hydrate local state
  useEffect(() => {
    if (initialDisplayName !== undefined && initialDisplayName !== null) {
      setValue(initialDisplayName);
      setLoaded(true);
    }
  }, [initialDisplayName]);

  const canSave = !!userId && value.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!userId) return;
    setSaving(true);
    const newName = value.trim();

    // optimistic UI: nothing to roll back since it's a simple field
    try {
      const { error } = await sb
        .from('profiles')
        .update({ display_name: newName })
        .eq('id', userId);

      if (error) throw error;
      onSaved?.(newName);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box
      sx={(t) => ({
        p: { xs: 2, md: 3 },
        borderRadius: 2,
        border: `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
      })}
    >
      <Stack spacing={1.5}>
        <Typography variant="h6" fontWeight={800} letterSpacing={0.2}>
          Profile basics
        </Typography>

        {!loaded ? (
          <Stack direction="row" alignItems="center" spacing={1}>
            <CircularProgress size={18} />
            <Typography variant="body2">Loading…</Typography>
          </Stack>
        ) : (
          <>
            <TextField
              label="Display name"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              inputProps={{ maxLength: 80 }}
              fullWidth
            />

            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!canSave}
                sx={{ borderRadius: 2, fontWeight: 800 }}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </Stack>
          </>
        )}
      </Stack>
    </Box>
  );
}
