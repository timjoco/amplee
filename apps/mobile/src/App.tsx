import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import MobileBottomNav from './components/Nav/MobileBottomNav';
import { useSession } from './lib/useSession';

import AuthCallback from './pages/AuthCallback';
import BandSheetMobile from './pages/BandSheetMobile';
import EventSheetMobile from './pages/EventSheetMobile';
import Home from './pages/Home';
import Invite from './pages/Invite';
import Login from './pages/Login';
import Profile from './pages/Profile';
import ProfileBasics from './pages/ProfileBasics';
import VerifyEmail from './pages/VerifyEmail';
import GlobalCreateHost from './shared/GlobalCreateHost';

// ✅ NEW: import the band settings page
import BandSettingsMobile from './pages/BandSettingsMobile';

import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import EventSettingsMobile from './pages/EventSettingsMobile';
import InviteBandMobile from './pages/InviteBandMobile';
import ProposedGigSheetMobile from './pages/ProposedGigSheetMobile';

export default function App() {
  const { loading, session } = useSession();
  const { pathname } = useLocation();

  /* ------------------------------------------------------------
     MOBILE KEYBOARD HANDLING (MUST RUN BEFORE ANY CONDITIONAL RETURNS)
  ------------------------------------------------------------- */
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let showSub: PluginListenerHandle | undefined;
    let hideSub: PluginListenerHandle | undefined;

    const setup = async () => {
      try {
        await Keyboard.setResizeMode({ mode: KeyboardResize.None });

        const kbWithAccessory = Keyboard as unknown as {
          setAccessoryBarVisible?: (opts: {
            isVisible: boolean;
          }) => Promise<void>;
        };

        if (typeof kbWithAccessory.setAccessoryBarVisible === 'function') {
          await kbWithAccessory.setAccessoryBarVisible({ isVisible: true });
        }

        // Keyboard listeners
        showSub = await Keyboard.addListener(
          'keyboardWillShow',
          ({ keyboardHeight }) => {
            document.body.classList.add('keyboard-open');
            document.documentElement.style.setProperty(
              '--keyboard-height',
              `${keyboardHeight}px`
            );
          }
        );

        hideSub = await Keyboard.addListener('keyboardWillHide', () => {
          document.body.classList.remove('keyboard-open');
          document.documentElement.style.removeProperty('--keyboard-height');
        });
      } catch (error) {
        console.warn('[Keyboard setup error]', error);
      }
    };

    void setup();

    return () => {
      showSub?.remove();
      hideSub?.remove();
    };
  }, []);

  /* NOW SAFE TO DO EARLY RETURNS */
  if (loading) return null;

  /* HIDE NAV ON EVENT SHEET */
  const hideChrome =
    /^\/bands\/[^/]+\/events\/[^/]+\/?$/.test(pathname) ||
    /^\/event\/[^/]+\/?$/.test(pathname);

  /* ROUTES */
  return (
    <>
      <Routes>
        {/* public */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/invite/:token" element={<Invite />} />

        {!session ? (
          <>
            {/* NOT authed: only login flow */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            {/* authed */}
            <Route path="/home" element={<Home />} />

            {/* band sheets */}
            <Route path="/bands/:id" element={<BandSheetMobile />} />
            <Route path="/bands/:bandId" element={<BandSheetMobile />} />
            <Route
              path="/bands/:bandId/settings"
              element={<BandSettingsMobile />}
            />
            <Route
              path="/bands/:bandId/proposals/:proposalId"
              element={<ProposedGigSheetMobile />}
            />

            {/* Band Invites sheet */}
            <Route path="/invite" element={<InviteBandMobile />} />

            {/* event sheet */}
            <Route
              path="/bands/:bandId/events/:eventId"
              element={<EventSheetMobile />}
            />
            <Route
              path="/bands/:bandId/events/:eventId/settings"
              element={<EventSettingsMobile />}
            />

            {/* profile routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/basics" element={<ProfileBasics />} />

            {/* default redirects */}
            <Route path="/" element={<Navigate to="/home" replace />} />
            <Route path="*" element={<Navigate to="/home" replace />} />
          </>
        )}
      </Routes>

      {/* Global dialog + bottom nav */}
      {session && !hideChrome && (
        <>
          <GlobalCreateHost />
          <MobileBottomNav />
        </>
      )}
    </>
  );
}
