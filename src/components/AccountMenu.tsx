'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import LogoutIcon from '@mui/icons-material/Logout';
import SettingsIcon from '@mui/icons-material/Settings';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import {
  Box,
  IconButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import AvatarImage from './ui/AvatarImage';

type ProfileLite = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null;
  display_name?: string;
};

type Props = {
  size?: number; // avatar size in px for the trigger
  onSignedOut?: () => void;
  hideDashboardItem?: boolean;

  // controlled menu props (optional)
  anchorEl?: HTMLElement | null;
  open?: boolean;
  onClose?: () => void;

  // profile data provided by parent (SideNav)
  profile?: ProfileLite;
};

export default function AccountMenu({
  size = 28,
  onSignedOut,
  hideDashboardItem,
  anchorEl: controlledAnchorEl,
  open: controlledOpen,
  onClose: controlledOnClose,
  profile,
}: Props) {
  const router = useRouter();
  const sb = useMemo(() => supabaseBrowser(), []);

  // uncontrolled trigger state
  const [internalAnchor, setInternalAnchor] = useState<HTMLElement | null>(
    null
  );

  // choose controlled vs uncontrolled
  const isControlled = controlledAnchorEl !== undefined;
  const menuAnchorEl = controlledAnchorEl ?? internalAnchor;
  const menuOpen = controlledOpen ?? Boolean(internalAnchor);
  const closeMenu = controlledOnClose ?? (() => setInternalAnchor(null));

  const displayName =
    profile?.display_name ||
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    profile?.email ||
    'Account';

  const handleSignOut = async () => {
    await sb.auth.signOut();
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    onSignedOut ? onSignedOut() : router.replace('/');
  };

  return (
    <>
      {/* Uncontrolled trigger button (common case in SideNav/Header) */}
      {!isControlled && (
        <Tooltip title={displayName}>
          <Box>
            <IconButton
              onClick={(e) => setInternalAnchor(e.currentTarget)}
              aria-label="account menu"
              size="small"
              sx={{
                bgcolor: 'transparent',
                border: (t) =>
                  `1px solid ${alpha(t.palette.primary.main, 0.35)}`,
                '&:hover': { bgcolor: 'action.hover' },
                borderRadius: 999,
                p: 0.5,
              }}
            >
              <AvatarImage
                name={displayName}
                // if you add private storage later, keep this; otherwise omit bucket/avatarPath
                bucket="profile-avatars"
                avatarPath={profile?.avatar_path ?? undefined}
                srcGuess={profile?.avatar_url ?? undefined}
                size={size}
              />
            </IconButton>
          </Box>
        </Tooltip>
      )}

      <Menu
        anchorEl={menuAnchorEl}
        open={menuOpen}
        onClose={closeMenu}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          sx: (t) => ({
            mt: 1,
            minWidth: 220,
            borderRadius: 2,
            border: `1px solid ${alpha(t.palette.primary.main, 0.28)}`,
            backdropFilter: 'blur(8px)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
          }),
        }}
      >
        {!hideDashboardItem && (
          <MenuItem component={Link} href="/dashboard" onClick={closeMenu}>
            <ListItemIcon>
              <DashboardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </MenuItem>
        )}

        <MenuItem
          component={Link}
          href="/profiles/settings"
          onClick={closeMenu}
        >
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </MenuItem>

        <MenuItem
          onClick={async () => {
            closeMenu();
            await handleSignOut();
          }}
        >
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Sign out" />
        </MenuItem>
      </Menu>
    </>
  );
}
