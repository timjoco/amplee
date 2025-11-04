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

  const [value, setValue] = useState<string>(initialDisplayName ?? '');
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState<boolean>(
    initialDisplayName !== undefined
  );
  const [initialName, setInitialName] = useState<string>(
    initialDisplayName ?? ''
  );
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  useEffect(() => {
    if (initialDisplayName !== undefined) {
      const v = initialDisplayName ?? '';
      setValue(v);
      setInitialName(v);
      setLoaded(true);
    }
  }, [initialDisplayName]);

  useEffect(() => {
    if (!userId || initialDisplayName !== undefined) return;
    (async () => {
      const { data, error } = await sb
        .from('profiles')
        .select('display_name')
        .eq('id', userId)
        .single();
      if (!error) {
        const v = data?.display_name ?? '';
        setValue(v);
        setInitialName(v);
      }
      setLoaded(true);
    })();
  }, [sb, userId, initialDisplayName]);

  const dirty = value.trim() !== initialName.trim();
  const canSave = !!userId && value.trim().length > 0 && dirty && !saving;

  const handleSave = async () => {
    if (!userId) return;
    const newName = value.trim();
    if (!newName) {
      setErr('Display name cannot be empty.');
      setOk(null);
      return;
    }
    setSaving(true);
    setErr(null);
    setOk(null);
    try {
      const { error } = await sb
        .from('profiles')
        .update({ display_name: newName })
        .eq('id', userId);
      if (error) throw error;
      setInitialName(newName);
      setOk('Profile updated.');
      onSaved?.(newName);

      window.dispatchEvent(
        new CustomEvent('profiles:display_name_changed', {
          detail: { display_name: newName },
        })
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      setErr(e?.message || 'Failed to update profile');
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
              onChange={(e) => {
                setValue(e.target.value);
                if (err) setErr(null);
                if (ok) setOk(null);
              }}
              inputProps={{ maxLength: 80 }}
              fullWidth
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSave) {
                  e.preventDefault();
                  void handleSave();
                }
              }}
            />
            <Stack direction="row" spacing={1}>
              <Button
                variant="contained"
                onClick={handleSave}
                disabled={!canSave}
                startIcon={saving ? <CircularProgress size={16} /> : undefined}
                sx={{ borderRadius: 2, fontWeight: 800 }}
              >
                {saving ? 'Saving…' : 'Save'}
              </Button>
            </Stack>

            {err && (
              <Typography
                variant="caption"
                color="error"
                sx={{ mt: 1, display: 'block' }}
              >
                {err}
              </Typography>
            )}
            {ok && (
              <Typography
                variant="caption"
                color="success.main"
                sx={{ mt: 1, display: 'block' }}
              >
                {ok}
              </Typography>
            )}
          </>
        )}
      </Stack>
    </Box>
  );
}
