'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, Stack, Typography, alpha } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function MobileAccountSettingsPage() {
  const router = useRouter();
  const sb = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: userData } = await sb.auth.getUser();
      if (!alive) return;
      setEmail(userData.user?.email ?? null);
    })();
    return () => {
      alive = false;
    };
  }, [sb]);

  return (
    <Box
      sx={{
        minHeight: '100dvh',
        bgcolor: '#101117',
        color: 'common.white',
        p: 2,
      }}
    >
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <IconButton
          aria-label="Back"
          onClick={() => router.push('/profiles/settings')}
          sx={{
            color: 'common.white',
            bgcolor: 'rgba(255,255,255,0.06)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            mr: 1,
          }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 800 }}>
          Account
        </Typography>
      </Box>

      <Stack
        spacing={1.5}
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${alpha('#ffffff', 0.12)}`,
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        }}
      >
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Signed in as
        </Typography>
        <Typography variant="body1" sx={{ fontWeight: 700 }}>
          {email || '—'}
        </Typography>
      </Stack>
    </Box>
  );
}
