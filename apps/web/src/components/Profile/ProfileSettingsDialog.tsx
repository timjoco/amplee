'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
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
  alpha,
  useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import type { TransitionProps } from '@mui/material/transitions';
import { useRouter } from 'next/navigation';
import { forwardRef, useEffect, useMemo, useRef, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabaseClient';
import ProfileAvatarCard from './ProfileAvatarCard';
import ProfileBasicsCard from './ProfileBasicsCard';

const blurActive = () =>
  (document.activeElement as HTMLElement | null)?.blur?.();

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement<any, any> },
  ref
) {
  return <Slide direction="up" ref={ref} timeout={220} {...props} />;
});

type Section = 'profile' | 'account';

export default function ProfileSettingsDialog() {
  const router = useRouter();
  const sb = useMemo(() => supabaseBrowser(), []);
  const theme = useTheme();
  const rawIsMobile = useMediaQuery(theme.breakpoints.down('md'), {
    noSsr: true,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [initialDisplayName, setInitialDisplayName] = useState<string | null>(
    null
  );
  const [initialFirst, setInitialFirst] = useState<string | null>(null);
  const [initialLast, setInitialLast] = useState<string | null>(null);
  const [initialAvatarUrl, setInitialAvatarUrl] = useState<string | null>(null);

  const [selected, setSelected] = useState<Section>('profile');
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('detail');

  // Tokens
  const BG = '#0B0A10';
  const SURFACE = '#101117';
  const SURFACE_ALT = '#0E0F15';
  const BORDER = 'rgba(255,255,255,0.10)';
  const TEXT = 'rgba(255,255,255,0.96)';
  const TEXT_DIM = 'rgba(255,255,255,0.72)';
  const ROW_Y = 2;
  const GAP_Y = 2;

  const sections = [
    { id: 'profile' as const, label: 'Profile' },
    { id: 'account' as const, label: 'Account' },
  ];

  const handleCloseSettings = () => {
    blurActive();
    setSettingsOpen(false);
  };

  const openConfirm = () => setConfirmOpen(true);
  const closeConfirm = () => setConfirmOpen(false);

  useEffect(() => setIsMobile(rawIsMobile), [rawIsMobile]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data: sessionData } = await sb.auth.getSession();
        const session = sessionData.session;
        const uid = session?.user?.id ?? null;
        if (!alive || !uid) return;

        setUserId(uid);

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

  const scrollRef = useRef<HTMLDivElement | null>(null);

  const onJump = (id: Section) => {
    setSelected(id);
    if (isMobile) {
      setMobileView('detail');
      return;
    }
    const el = document.getElementById(`section-${id}`);
    if (!el || !scrollRef.current) return;
    const top = el.offsetTop - 12;
    scrollRef.current.scrollTo({ top, behavior: 'smooth' });
  };

  const handleSignOut = async () => {
    try {
      await sb.auth.signOut();
    } finally {
      closeConfirm();
      router.push('/');
      router.refresh();
    }
  };

  const ProfilePane = (
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
          onSaved={() => {
            // Optional: toast/snackbar
          }}
        />

        <ProfileAvatarCard
          userId={userId ?? undefined}
          initialUrl={initialAvatarUrl ?? undefined}
          onSaved={() => {
            // Optional: toast/snackbar
          }}
          compact
        />

        <Box
          sx={{
            p: 2,
            borderRadius: 2,
            border: `1px solid ${BORDER}`,
            bgcolor: 'transparent',
          }}
        >
          <Typography variant="body2" sx={{ color: TEXT_DIM }}>
            (Optional preview) Name on file
          </Typography>
          <Typography variant="body1" sx={{ color: TEXT, fontWeight: 700 }}>
            {[initialFirst, initialLast].filter(Boolean).join(' ') || '—'}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );

  const AccountPane = (
    <Box id="section-account" sx={{ py: ROW_Y }}>
      <Typography
        variant="h6"
        sx={{ color: TEXT, fontWeight: 800, letterSpacing: 0.2, mb: 0.75 }}
      >
        Account
      </Typography>
      <Typography variant="body2" sx={{ color: TEXT_DIM, mb: 1.5 }}>
        Manage your account session.
      </Typography>

      {isMobile && (
        <Stack spacing={GAP_Y}>
          <Button
            variant="text"
            onClick={openConfirm}
            startIcon={<LogoutIcon />}
            sx={(t) => ({
              alignSelf: 'flex-start',
              color: t.palette.error.main,
              borderRadius: 2,
              fontWeight: 800,
              letterSpacing: 0.2,
              px: 1,
              '&:hover': { bgcolor: alpha(t.palette.error.main, 0.08) },
            })}
          >
            Log out
          </Button>
        </Stack>
      )}
    </Box>
  );

  const RightPane = (
    <Box
      ref={scrollRef}
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
        '& .MuiInputBase-root': { color: TEXT, background: 'transparent' },
        '& .MuiOutlinedInput-notchedOutline': { borderColor: BORDER },
        '& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline': {
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
      {selected === 'profile' ? ProfilePane : AccountPane}
      <Divider sx={{ borderColor: BORDER, mt: 2 }} />
    </Box>
  );

  const LeftRail = (
    <Box
      sx={{
        display: { xs: 'block', md: 'block' },
        bgcolor: SURFACE_ALT,
        borderRight: `1px solid ${BORDER}`,
        py: 2,
        px: 1.5,
        height: '100%',
      }}
    >
      {/* Mobile-only header when in detail view */}
      {isMobile && mobileView === 'detail' && (
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <IconButton
            aria-label="Back"
            onClick={() => setMobileView('list')}
            sx={{
              color: TEXT,
              bgcolor: 'rgba(255,255,255,0.06)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' },
              mr: 1,
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="subtitle1" sx={{ color: TEXT, fontWeight: 800 }}>
            {selected === 'profile' ? 'Profile' : 'Account'}
          </Typography>
        </Box>
      )}

      {!isMobile && (
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
      )}

      <Stack spacing={0.5}>
        {sections.map((s) => {
          const active = selected === s.id;
          return (
            <Button
              key={s.id}
              onClick={() => onJump(s.id)}
              fullWidth
              sx={{
                justifyContent: 'flex-start',
                textTransform: 'none',
                color: active ? TEXT : TEXT_DIM,
                px: 1.5,
                py: 1,
                borderRadius: 1.5,
                fontWeight: 700,
                letterSpacing: 0.2,
                bgcolor: active ? 'rgba(255,255,255,0.08)' : 'transparent',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.06)',
                  color: TEXT,
                },
              }}
            >
              {s.label}
            </Button>
          );
        })}

        {!isMobile && (
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
              '&:active': {
                bgcolor:
                  t.palette.mode === 'dark'
                    ? t.palette.error.main + '33'
                    : t.palette.error.main + '1F',
              },
              '&:focus-visible': {
                outline: `2px solid ${t.palette.error.main}`,
                outlineOffset: 2,
              },
            })}
          >
            Log out
          </Button>
        )}
      </Stack>
    </Box>
  );

  return (
    <>
      <Dialog
        open={settingsOpen}
        onClose={handleCloseSettings}
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
            onClick={handleCloseSettings}
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
          {LeftRail}

          {isMobile ? (mobileView === 'detail' ? RightPane : null) : RightPane}
        </DialogContent>
      </Dialog>

      <Dialog
        open={confirmOpen}
        onClose={closeConfirm}
        aria-labelledby="logout-title"
        aria-describedby="logout-desc"
        keepMounted
      >
        <DialogTitle id="logout-title">Confirm logout</DialogTitle>
        <DialogContent>
          <Typography id="logout-desc">
            Are you sure you want to log out?
          </Typography>
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
