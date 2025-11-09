'use client';

import SettingsIcon from '@mui/icons-material/Settings';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { useMemo } from 'react';
import AvatarImage from '../ui/AvatarImage';

type ProfileLite = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
};

export default function AccountDock({
  profile,
  placement = 'inline',
  offsetLeft = 12,
}: {
  profile?: ProfileLite;
  placement?: 'fixed' | 'inline';
  offsetLeft?: number;
}) {
  const displayName = useMemo(() => {
    const dnRaw = profile?.display_name ?? undefined;
    const dn = typeof dnRaw === 'string' ? dnRaw.trim() : '';

    if (dn) return dn;

    const full = [profile?.first_name, profile?.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();
    if (full) return full;

    return profile?.email || 'Account';
  }, [profile]);

  return (
    <Box
      sx={(t) =>
        placement === 'fixed'
          ? {
              position: 'fixed',
              left: { xs: 12, md: offsetLeft },
              bottom: 12,
              zIndex: t.zIndex.appBar + 1,
              display: { xs: 'none', md: 'block' },
            }
          : { width: '100%' }
      }
    >
      <Box
        sx={(t) => ({
          borderRadius: 12,
          p: 1.25,
          border: `1px solid ${alpha(t.palette.primary.main, 0.28)}`,
          backdropFilter: 'blur(8px)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
        })}
      >
        <Stack direction="row" alignItems="center" spacing={1.25}>
          <AvatarImage
            name={displayName}
            bucket="profile-avatars"
            srcGuess={profile?.avatar_url ?? undefined}
            size={36}
          />

          <Typography
            variant="subtitle2"
            sx={{
              fontWeight: 800,
              flex: 1,
              minWidth: 0,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={displayName}
          >
            {displayName}
          </Typography>

          <Tooltip title="Settings">
            <IconButton
              component={Link}
              href="/profiles/settings"
              size="small"
              aria-label="Open settings"
              sx={{
                borderRadius: 2,
                border: (t) =>
                  `1px solid ${alpha(t.palette.primary.main, 0.3)}`,
                bgcolor: 'transparent',
                '&:hover': { bgcolor: 'action.hover' },
              }}
            >
              <SettingsIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>
    </Box>
  );
}
