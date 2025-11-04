'use client';

import BottomNav from '@/components/Nav/BottomNav';
import HeaderPublic from '@/components/Nav/HeaderPublic';
import SideNav, { SIDE_NAV_WIDTH } from '@/components/Nav/SideNav';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { Box, useMediaQuery } from '@mui/material';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

type Props = { children: React.ReactNode; initialAuthed: boolean };

const isEventSheetPath = (p: string) =>
  /^\/bands\/[^/]+\/events\/[^/]+(?:[/?].*)?$/.test(p);

export default function AppFrameClient({ children, initialAuthed }: Props) {
  const [authed, setAuthed] = useState(initialAuthed);
  const [mounted, setMounted] = useState(false); // ← add
  const pathname = usePathname();

  const mdUp = useMediaQuery('(min-width:900px)');
  const isMobile = !mdUp;

  useEffect(() => {
    setMounted(true); // ← add
    const sb = supabaseBrowser();
    sb.auth.getUser().then(({ data: { user } }) => setAuthed(!!user));
    const { data: sub } = sb.auth.onAuthStateChange((_e, s) =>
      setAuthed(!!s?.user)
    );
    return () => sub?.subscription?.unsubscribe?.();
  }, []);

  const showSideNav = authed;

  // Only compute route-based UI after mount to avoid SSR/client mismatch
  const isWaitlist = mounted && pathname?.startsWith('/waitlist'); // ← add
  const showPublicHeader = mounted && !authed && !isWaitlist; // ← change

  const hideBottomNav = useMemo(
    () => isMobile && isEventSheetPath(pathname || ''),
    [isMobile, pathname]
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
          px: { xs: 2, md: 3 },
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
