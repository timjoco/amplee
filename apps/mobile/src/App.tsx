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

import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';

export default function App() {
  const { loading, session } = useSession();
  const location = useLocation();
  const pathname = location.pathname;

  /* ------------------------------------------------------------
     MOBILE KEYBOARD HANDLING (MUST RUN BEFORE ANY CONDITIONAL RETURNS)
  ------------------------------------------------------------- */
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let showSub: PluginListenerHandle | undefined;
    let hideSub: PluginListenerHandle | undefined;

    const setup = async () => {
      try {
        // Don't resize the webview; we'll handle layout via CSS
        await Keyboard.setResizeMode({ mode: KeyboardResize.None });

        try {
          await (Keyboard as any).setAccessoryBarVisible?.({
            isVisible: true,
          });
        } catch (err) {
          console.warn('[Keyboard accessory bar toggle failed]', err);
        }
      } catch (err) {
        console.warn('[Keyboard setup error]', err);
      }

      try {
        showSub = await Keyboard.addListener('keyboardWillShow', (info) => {
          document.body.classList.add('keyboard-open');
          document.documentElement.style.setProperty(
            '--keyboard-height',
            `${info.keyboardHeight}px`
          );
        });

        hideSub = await Keyboard.addListener('keyboardWillHide', () => {
          document.body.classList.remove('keyboard-open');
          document.documentElement.style.removeProperty('--keyboard-height');
        });
      } catch (err) {
        console.error('[Keyboard listener error]', err);
      }
    };

    void setup();

    return () => {
      showSub?.remove();
      hideSub?.remove();
    };
  }, []);

  /* ------------------------------------------------------------
     NOW SAFE TO DO EARLY RETURNS
  ------------------------------------------------------------- */
  if (loading) return null;

  /* ------------------------------------------------------------
     HIDE NAV ON EVENT SHEET
  ------------------------------------------------------------- */
  const hideChrome =
    /^\/bands\/[^/]+\/events\/[^/]+\/?$/.test(pathname) ||
    /^\/event\/[^/]+\/?$/.test(pathname);

  /* ------------------------------------------------------------
     ROUTES
  ------------------------------------------------------------- */
  return (
    <>
      <Routes>
        {/* public */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/invite/:token" element={<Invite />} />

        {!session ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            {/* authed */}
            <Route path="/home" element={<Home />} />

            <Route path="/bands/:id" element={<BandSheetMobile />} />
            <Route
              path="/bands/:bandId/events/:eventId"
              element={<EventSheetMobile />}
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

      {/* Global dialog + bottom nav (except on event sheet) */}
      {session && !hideChrome && (
        <>
          <GlobalCreateHost />
          <MobileBottomNav />
        </>
      )}
    </>
  );
}
