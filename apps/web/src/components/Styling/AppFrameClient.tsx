'use client';

import { Box, useMediaQuery } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabaseClient';
import BottomNav from '../Nav/BottomNav';
import HeaderPublic from '../Nav/HeaderPublic';
import SideNav, { SIDE_NAV_WIDTH } from '../Nav/SideNav';

type Props = { children: React.ReactNode; initialAuthed: boolean };

// Band pages (including their event sheets) should hide home SideNav
const isBandPagePath = (p: string) => /^\/bands\/[^/]+(?:[/?].*)?$/.test(p);

// Standalone event pages (from dashboard) - show home SideNav
const isStandaloneEventPath = (p: string) =>
  /^\/events\/[^/]+(?:[/?].*)?$/.test(p);

// Public band pages should also hide SideNav
const isPublicBandPagePath = (p: string) => /^\/b\/[^/]+(?:[/?].*)?$/.test(p);

// Routes that should be true full-bleed (no left/right padding)
const isPublicNoPadPath = (p: string) =>
  p === '/' ||
  p === '/download' ||
  p.startsWith('/download/') ||
  p === '/privacy' ||
  p.startsWith('/privacy/') ||
  p === '/terms' ||
  p.startsWith('/terms/') ||
  p === '/support' ||
  p.startsWith('/support/') ||
  p === '/community-guidelines' ||
  p.startsWith('/community-guidelines/');

export default function AppFrameClient({ children, initialAuthed }: Props) {
  const [authed, setAuthed] = useState(initialAuthed);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  const mdUp = useMediaQuery('(min-width:900px)');
  const isMobile = !mdUp;

  useEffect(() => {
    setMounted(true);
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data: { user } }) => setAuthed(!!user));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) =>
      setAuthed(!!s?.user)
    );
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  // Hide home SideNav on band pages (they have BandSheet with band nav)
  const isBandPage = mounted && isBandPagePath(pathname || '');

  // Show home SideNav for standalone events (from dashboard)
  const isStandaloneEvent = mounted && isStandaloneEventPath(pathname || '');

  const isWaitlist = mounted && pathname?.startsWith('/waitlist');
  const isPublicBandPage = mounted && pathname?.startsWith('/b/');

  // Never show app SideNav on public band pages (even if authed)
  const showSideNav =
    authed && !isPublicBandPage && (!isBandPage || isStandaloneEvent);

  const showPublicHeader =
    mounted && !authed && !isWaitlist && !isPublicBandPage;

  const hideBottomNav = useMemo(
    () => isMobile && isBandPage && !isStandaloneEvent,
    [isMobile, isBandPage, isStandaloneEvent]
  );

  // Remove padding for public routes, band pages, AND standalone event sheets
  const noPad = useMemo(
    () =>
      (mounted && !authed && isPublicNoPadPath(pathname || '')) ||
      isBandPage ||
      isStandaloneEvent, // ← ADD THIS
    [mounted, authed, pathname, isBandPage, isStandaloneEvent]
  );

  return (
    <Box sx={{ minHeight: '100dvh', display: 'flex', bgcolor: 'transparent' }}>
      {showSideNav && <SideNav />}

      <Box
        component="main"
        sx={{
          flex: 1,
          minWidth: 0,
          ml: { md: showSideNav ? `${SIDE_NAV_WIDTH}px` : 0 },
          height: '100dvh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          overscrollBehaviorY: 'contain',
          px: noPad ? 0 : { xs: 2, md: 3 },
          pb: { xs: showSideNav && !hideBottomNav ? '68px' : 0, md: 0 },
          transition: 'margin-left .15s ease',
        }}
      >
        {showPublicHeader && <HeaderPublic />}
        {children}
      </Box>

      {showSideNav && (
        <Box
          sx={{
            position: 'fixed',
            top: 12,
            right: 12,
            zIndex: (t) => t.zIndex.appBar + 2,
            pointerEvents: 'none',
          }}
        />
      )}

      {showSideNav && !hideBottomNav && <BottomNav />}
    </Box>
  );
}
