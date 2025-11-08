'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import ProfileAvatarCard from '../../../../components/Profile/ProfileAvatarCard';
import ProfileBasicsCard from '../../../../components/Profile/ProfileBasicsCard';
import { supabaseBrowser } from '../../../../lib/supabaseClient';

export default function MobileProfileSettingsPage() {
  const router = useRouter();
  const sb = useMemo(() => supabaseBrowser(), []);

  const [userId, setUserId] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: sessionData } = await sb.auth.getSession();
      const uid = sessionData.session?.user?.id ?? null;
      if (!alive || !uid) return;

      setUserId(uid);
      const { data: row } = await sb
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', uid)
        .maybeSingle();

      if (!alive) return;
      setDisplayName(row?.display_name ?? null);
      setAvatarUrl(row?.avatar_url ?? null);
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
          Profile
        </Typography>
      </Box>

      <Stack spacing={2}>
        <ProfileBasicsCard
          userId={userId ?? undefined}
          initialDisplayName={displayName ?? undefined}
          onSaved={(v) => setDisplayName(v)}
        />
        <ProfileAvatarCard
          userId={userId ?? undefined}
          initialUrl={avatarUrl ?? undefined}
          onSaved={(u) => setAvatarUrl(u)}
        />
      </Stack>
    </Box>
  );
}
