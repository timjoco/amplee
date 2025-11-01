/* eslint-disable @typescript-eslint/no-explicit-any */

'use client';

import ProfileAvatarCard from '@/components/Profile/ProfileAvatarCard';
import ProfileBasicsCard from '@/components/Profile/ProfileBasicsCard';
import { supabaseBrowser } from '@/lib/supabaseClient';
import CloseIcon from '@mui/icons-material/Close';
import LogoutIcon from '@mui/icons-material/Logout';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Slide,
  Stack,
  Typography,
  useMediaQuery,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { TransitionProps } from '@mui/material/transitions';
import { useRouter } from 'next/navigation';
import { forwardRef, useEffect, useMemo, useState } from 'react';

const blurActive = () =>
  (document.activeElement as HTMLElement | null)?.blur?.();

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref
) {
  return <Slide direction="up" ref={ref} timeout={220} {...props} />;
});

type Section = 'profile' | 'account';

export default function UserSettingsPage() {
  const router = useRouter();
  const sb = useMemo(() => supabaseBrowser(), []);

  const [open, setOpen] = useState(true);
  const handleClose = () => {
    blurActive();
    setOpen(false);
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const BG = '#0B0A10';
  const SURFACE = '#101117';
  const SURFACE_ALT = '#0E0F15';
  const BORDER = 'rgba(255,255,255,0.10)';
  const TEXT = 'rgba(255,255,255,0.96)';
  const TEXT_DIM = 'rgba(255,255,255,0.72)';
  const ROW_Y = 2;
  const GAP_Y = 2;

  // Desktop vs mobile
  const isDesktop = useMediaQuery('(min-width:900px)', { noSsr: true });

  // Session + profile fields
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [initialDisplayName, setInitialDisplayName] = useState<string | null>(
    null
  );
  const [initialFirst, setInitialFirst] = useState<string | null>(null);
  const [initialLast, setInitialLast] = useState<string | null>(null);
  const [initialAvatarUrl, setInitialAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: sessionData } = await sb.auth.getSession();
        const session = sessionData.session;
        const uid = session?.user?.id ?? null;
        if (!alive || !uid) return;

        setUserId(uid);
        setUserEmail(session?.user?.email ?? null);

        const { data: row } = await sb
          .from('profiles')
          .select('display_name, first_name, last_name, avatar_url')
          .eq('id', uid)
          .maybeSingle();

        if (!alive) return;
        setInitialDisplayName(row?.display_name ?? null);
        setInitialFirst(row?.first_name ?? null);
        setInitialLast(row?.last_name ?? null);
        setInitialAvatarUrl(row?.avatar_url ?? null);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [sb]);

  // Logout confirmation
  const [confirmOpen, setConfirmOpen] = useState(false);
  const openConfirm = () => setConfirmOpen(true);
  const closeConfirm = () => setConfirmOpen(false);

  const handleSignOut = async () => {
    try {
      await sb.auth.signOut();
    } finally {
      closeConfirm();
      router.push('/');
      router.refresh();
    }
  };

  // Desktop section selection
  const [selected, setSelected] = useState<Section>('profile');

  // Reusable section UIs
  const ProfileSection = (
    <Box id="section-profile" sx={{ py: ROW_Y }}>
      <Typography
        variant="h6"
        sx={{ color: TEXT, fontWeight: 800, letterSpacing: 0.2, mb: 0.75 }}
      >
        Profile
      </Typography>
      <Typography variant="body2" sx={{ color: TEXT_DIM, mb: 1.5 }}>
        Update your public profile. Changes save instantly.
      </Typography>

      <Stack spacing={GAP_Y}>
        <ProfileBasicsCard
          userId={userId ?? undefined}
          initialDisplayName={initialDisplayName ?? undefined}
        />

        <ProfileAvatarCard
          userId={userId ?? undefined}
          initialUrl={initialAvatarUrl ?? undefined}
          compact
        />

        {/* Optional: show name on file */}
        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${BORDER}`,
            bgcolor: 'transparent',
          }}
        >
          <Typography variant="body2" sx={{ color: TEXT_DIM }}>
            (Optional) Name on file
          </Typography>
          <Typography variant="body1" sx={{ color: TEXT, fontWeight: 700 }}>
            {[initialFirst, initialLast].filter(Boolean).join(' ') || '—'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  const AccountSection = (
    <Box id="section-account" sx={{ py: ROW_Y }}>
      <Typography
        variant="h6"
        sx={{ color: TEXT, fontWeight: 800, letterSpacing: 0.2, mb: 0.75 }}
      >
        Account
      </Typography>
      <Typography variant="body2" sx={{ color: TEXT_DIM, mb: 1.5 }}>
        Your associated email.
      </Typography>

      <Box
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${BORDER}`,
          bgcolor: 'transparent',
        }}
      >
        <Typography variant="body2" sx={{ color: TEXT_DIM }}>
          Email
        </Typography>
        <Typography variant="body1" sx={{ color: TEXT, fontWeight: 700 }}>
          {userEmail || '—'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        TransitionComponent={Transition}
        TransitionProps={{
          onExit: blurActive,
          onExited: () => {
            router.push('/dashboard');
          },
        }}
        fullScreen
        disableRestoreFocus
        disableAutoFocus
        disableEnforceFocus
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(2px)',
            backgroundColor: 'rgba(0,0,0,0.7)',
          },
        }}
        PaperProps={{
          sx: { bgcolor: BG, color: 'common.white' },
        }}
      >
        {/* Floating close (X) */}
        <Box
          sx={{
            position: 'fixed',
            right: 12,
            top: 12,
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            color: TEXT_DIM,
          }}
        >
          <IconButton
            aria-label="Close"
            onClick={handleClose}
            autoFocus={false}
            sx={{
              color: TEXT,
              bgcolor: 'rgba(255,255,255,0.06)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent
          sx={{
            p: 0,
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: '280px 1fr' },
            minHeight: '100%',
          }}
        >
          {/* Left rail (desktop only) */}
          <Box
            sx={{
              display: { xs: 'none', md: 'block' },
              bgcolor: SURFACE_ALT,
              borderRight: `1px solid ${BORDER}`,
              py: 2,
              px: 1.5,
            }}
          >
            <Typography
              variant="overline"
              sx={{
                color: TEXT_DIM,
                px: 1,
                letterSpacing: 1,
                display: 'block',
                mb: 1.25,
                textTransform: 'uppercase',
              }}
            >
              User Settings
            </Typography>

            <Stack spacing={0.5}>
              {(['profile', 'account'] as Section[]).map((s) => {
                const active = selected === s;
                return (
                  <Button
                    key={s}
                    onClick={() => setSelected(s)}
                    fullWidth
                    aria-current={active ? 'page' : undefined}
                    sx={{
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      color: active ? TEXT : TEXT_DIM,
                      px: 1.5,
                      py: 1,
                      borderRadius: 1.5,
                      fontWeight: 700,
                      letterSpacing: 0.2,
                      bgcolor: active
                        ? 'rgba(255,255,255,0.08)'
                        : 'transparent',
                      '&:hover': {
                        bgcolor: 'rgba(255,255,255,0.06)',
                        color: TEXT,
                      },
                    }}
                  >
                    {s === 'profile' ? 'Profile' : 'Account'}
                  </Button>
                );
              })}

              {/* Desktop: Logout as its own item */}
              <Button
                onClick={openConfirm}
                startIcon={<LogoutIcon />}
                fullWidth
                variant="text"
                sx={(t) => ({
                  justifyContent: 'flex-start',
                  textTransform: 'none',
                  px: 1.5,
                  py: 1,
                  borderRadius: 1.5,
                  fontWeight: 700,
                  letterSpacing: 0.2,
                  mt: 1,
                  color: t.palette.error.main,
                  '& .MuiSvgIcon-root': { color: 'inherit' },
                  '&:hover': {
                    bgcolor:
                      t.palette.mode === 'dark'
                        ? t.palette.error.main + '24'
                        : t.palette.error.main + '14',
                    color: t.palette.error.main,
                  },
                })}
              >
                Log out
              </Button>
            </Stack>
          </Box>

          {/* Right content pane */}
          <Box
            sx={{
              bgcolor: SURFACE,
              minHeight: '100%',
              px: { xs: 2.5, md: 3 },
              py: { xs: 2, md: 3 },
              overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 10 },
              '&::-webkit-scrollbar-thumb': {
                background: 'rgba(255,255,255,0.12)',
                borderRadius: 8,
                border: '2px solid transparent',
                backgroundClip: 'padding-box',
              },

              '& .MuiCard-root': {
                background: 'transparent',
                boxShadow: 'none',
                border: 0,
              },
              '& .MuiCardHeader-root': { px: 0 },
              '& .MuiCardContent-root': { px: 0 },

              '& .MuiFormLabel-root': { color: TEXT_DIM },
              '& .MuiInputBase-root': {
                color: TEXT,
                background: 'transparent',
              },
              '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
              '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline':
                {
                  borderColor: 'rgba(255,255,255,0.18)',
                },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline':
                {
                  borderColor: 'rgba(255,255,255,0.26)',
                },
              '& .MuiButton-root': {
                textTransform: 'none',
                fontWeight: 700,
                letterSpacing: 0.2,
                borderRadius: 10,
              },
            }}
          >
            {/* Desktop: show only selected section; Mobile: show both stacked */}
            {isDesktop ? (
              selected === 'profile' ? (
                ProfileSection
              ) : (
                AccountSection
              )
            ) : (
              <>
                {ProfileSection}
                <Divider sx={{ borderColor: BORDER }} />
                {AccountSection}
                <Divider sx={{ borderColor: BORDER }} />
                {/* Mobile: Logout at bottom */}
                <Box sx={{ display: { xs: 'block', md: 'none' }, mt: 2 }}>
                  <Button
                    onClick={openConfirm}
                    startIcon={<LogoutIcon />}
                    fullWidth
                    sx={(t) => ({
                      justifyContent: 'flex-start',
                      textTransform: 'none',
                      color: t.palette.error.main,
                      px: 1.5,
                      py: 1.25,
                      borderRadius: 1.5,
                      bgcolor: 'rgba(255,255,255,0.06)',
                      '&:hover': { bgcolor: alpha(t.palette.error.main, 0.08) },
                      fontWeight: 700,
                      letterSpacing: 0.2,
                    })}
                  >
                    Log out
                  </Button>
                </Box>
              </>
            )}
          </Box>
        </DialogContent>
      </Dialog>

      {/* Logout confirmation */}
      <Dialog open={confirmOpen} onClose={closeConfirm} keepMounted>
        <DialogTitle>Confirm logout</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to log out?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeConfirm}>Cancel</Button>
          <Button
            onClick={handleSignOut}
            color="inherit"
            startIcon={<LogoutIcon />}
          >
            Log out
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
