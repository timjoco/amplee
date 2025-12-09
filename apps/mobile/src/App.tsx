// app.tsx
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import MobileBottomNav from './components/Nav/MobileBottomNav';
import { useSession } from './hooks/useSession';

import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { useEffect } from 'react';

// 🔹 NEW: Framer Motion
import { motion } from 'framer-motion';

import AuthCallback from './pages/AuthCallback';
import BandAvailabilityPage from './pages/Bands/BandAvailabilityPage';
import BandEventsPage from './pages/Bands/BandEventsPage';
import BandLibraryPage from './pages/Bands/BandLibraryPage';
import BandProposalsPage from './pages/Bands/BandProposalsPage';
import BandPublicProfileMobile from './pages/Bands/BandPublicProfileMobile';
import BandRosterPage from './pages/Bands/BandRosterPage';
import BandSetlistPageMobile from './pages/Bands/BandSetlistPageMobile';
import BandSettingsMobile from './pages/Bands/BandSettingsMobile';
import BandSheetMobile from './pages/Bands/BandSheetMobile';
import BandSongListRouteMobile from './pages/Bands/BandSongListRouteMobile';
import BandSongSheetRouteMobile from './pages/Bands/BandSongSheetRouteMobile';
import EventChatPageMobile from './pages/Events/EventChatPageMobile';
import EventFilesPageMobile from './pages/Events/EventFilesPageMobile';
import EventNotesPageMobile from './pages/Events/EventNotesPageMobile';
import EventRollCallPageMobile from './pages/Events/EventRollCallPageMobile';
import EventSetlistPageMobile from './pages/Events/EventSetlistPageMobile';
import EventSettingsMobile from './pages/Events/EventSettingsMobile';
import EventSheetMobile from './pages/Events/EventSheetMobile';
import Home from './pages/Home';
import Invite from './pages/Invite';
import InviteBandMobile from './pages/InviteBandMobile';
import Login from './pages/Login';
import OnboardingPageMobile from './pages/OnboardingPageMobile';
import Profile from './pages/Profile';
import ProfileAvailability from './pages/ProfileAvailability';
import ProfileBasics from './pages/ProfileBasics';
import ProposedGigSheetMobile from './pages/ProposedGigSheetMobile';
import SetlistTemplateEditorMobile from './pages/SetlistTemplateEditorMobile';
import VerifyEmail from './pages/VerifyEmail';
import GlobalCreateHost from './shared/GlobalCreateHost';

// 🔹 NEW: simple page transition wrapper
const PageTransition: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => (
  <motion.div
    style={{ height: '100%' }}
    initial={{ x: 40, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -40, opacity: 0 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
  >
    {children}
  </motion.div>
);

export default function App() {
  const { loading, session } = useSession();
  const location = useLocation();
  const { pathname } = location;
  const navigate = useNavigate();

  // iOS keyboard behavior
  useEffect(() => {
    const setupKeyboard = async () => {
      if (Capacitor.getPlatform() === 'ios') {
        try {
          await Keyboard.setResizeMode({ mode: KeyboardResize.Native });
          await Keyboard.setScroll({ isDisabled: false });
        } catch (e) {
          console.warn('[keyboard setup error]', e);
        }
      }
    };

    void setupKeyboard();
  }, []);

  // ANDROID: hardware back button → native-ish behavior
  useEffect(() => {
    if (Capacitor.getPlatform() !== 'android') return;

    const sub = CapApp.addListener('backButton', ({ canGoBack }) => {
      // 1) If the WebView has history, go back
      if (canGoBack) {
        navigate(-1);
        return;
      }

      // 2) If we're not on /home yet, send them "home" first
      if (pathname !== '/home') {
        navigate('/home', { replace: true });
        return;
      }

      // 3) Already on /home and no history → exit app (classic Android)
      CapApp.exitApp();
    });

    return () => {
      sub.then((h) => h.remove());
    };
  }, [navigate, pathname]);

  if (loading) return null;

  /* HIDE NAV ON EVENT SHEET + event subpages */
  const hideChrome =
    /^\/bands\/[^/]+\/events\/[^/]+(\/.*)?$/.test(pathname) ||
    /^\/event\/[^/]+(\/.*)?$/.test(pathname);

  return (
    <>
      <Routes location={location} key={pathname}>
        {/* public */}
        <Route
          path="/auth/callback"
          element={
            <PageTransition>
              <AuthCallback />
            </PageTransition>
          }
        />
        <Route
          path="/verify-email"
          element={
            <PageTransition>
              <VerifyEmail />
            </PageTransition>
          }
        />
        <Route
          path="/invite/:token"
          element={
            <PageTransition>
              <Invite />
            </PageTransition>
          }
        />

        {!session ? (
          <>
            {/* NOT authed: only login flow */}
            <Route
              path="/login"
              element={
                <PageTransition>
                  <Login />
                </PageTransition>
              }
            />
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <>
            {/* authed home */}
            <Route
              path="/home"
              element={
                <PageTransition>
                  <Home />
                </PageTransition>
              }
            />
            <Route
              path="/onboarding"
              element={
                <PageTransition>
                  <OnboardingPageMobile />
                </PageTransition>
              }
            />

            {/* BAND ROUTES*/}
            <Route
              path="/bands/:id"
              element={
                <PageTransition>
                  <BandSheetMobile />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId"
              element={
                <PageTransition>
                  <BandSheetMobile />
                </PageTransition>
              }
            />
            <Route
              path="/invite"
              element={
                <PageTransition>
                  <InviteBandMobile />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/events"
              element={
                <PageTransition>
                  <BandEventsPage />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/public"
              element={
                <PageTransition>
                  <BandPublicProfileMobile />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/proposals"
              element={
                <PageTransition>
                  <BandProposalsPage />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/library"
              element={
                <PageTransition>
                  <BandLibraryPage />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/roster"
              element={
                <PageTransition>
                  <BandRosterPage />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/settings"
              element={
                <PageTransition>
                  <BandSettingsMobile />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/proposals/:proposalId"
              element={
                <PageTransition>
                  <ProposedGigSheetMobile />
                </PageTransition>
              }
            />

            <Route
              path="/bands/:bandId/setlists"
              element={
                <PageTransition>
                  <BandSetlistPageMobile />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/setlists/:setlistId"
              element={
                <PageTransition>
                  <SetlistTemplateEditorMobile />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/songs"
              element={
                <PageTransition>
                  <BandSongListRouteMobile />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/songs/:songId"
              element={
                <PageTransition>
                  <BandSongSheetRouteMobile />
                </PageTransition>
              }
            />

            {/* --- EVENT ROUTES --- */}

            {/* event hub sheet */}
            <Route
              path="/bands/:bandId/events/:eventId"
              element={
                <PageTransition>
                  <EventSheetMobile />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/events/:eventId/rollcall"
              element={
                <PageTransition>
                  <EventRollCallPageMobile />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/events/:eventId/chat"
              element={
                <PageTransition>
                  <EventChatPageMobile />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/events/:eventId/setlist"
              element={
                <PageTransition>
                  <EventSetlistPageMobile />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/events/:eventId/notes"
              element={
                <PageTransition>
                  <EventNotesPageMobile />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/events/:eventId/files"
              element={
                <PageTransition>
                  <EventFilesPageMobile />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/events/:eventId/settings"
              element={
                <PageTransition>
                  <EventSettingsMobile />
                </PageTransition>
              }
            />

            {/* profile routes */}
            <Route
              path="/profile"
              element={
                <PageTransition>
                  <Profile />
                </PageTransition>
              }
            />
            <Route
              path="/profile/basics"
              element={
                <PageTransition>
                  <ProfileBasics />
                </PageTransition>
              }
            />
            <Route
              path="/profile/availability"
              element={
                <PageTransition>
                  <ProfileAvailability />
                </PageTransition>
              }
            />
            <Route
              path="/bands/:bandId/availability"
              element={
                <PageTransition>
                  <BandAvailabilityPage />
                </PageTransition>
              }
            />

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
