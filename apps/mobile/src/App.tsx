// app.tsx
import { useEffect } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';

import MobileBottomNav from './components/Nav/MobileBottomNav';
import { useSession } from './hooks/useSession';

import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import AuthCallback from './pages/AuthCallback';
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
import ProfileBasics from './pages/ProfileBasics';
import ProposedGigSheetMobile from './pages/ProposedGigSheetMobile';
import SetlistTemplateEditorMobile from './pages/SetlistTemplateEditorMobile';
import VerifyEmail from './pages/VerifyEmail';
import GlobalCreateHost from './shared/GlobalCreateHost';

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

  if (loading) return null;

  /* HIDE NAV ON EVENT SHEET + event subpages */
  const hideChrome =
    /^\/bands\/[^/]+\/events\/[^/]+(\/.*)?$/.test(pathname) ||
    /^\/event\/[^/]+(\/.*)?$/.test(pathname);

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
            {/* authed home */}
            <Route path="/home" element={<Home />} />
            <Route path="/onboarding" element={<OnboardingPageMobile />} />

            {/* BAND ROUTES*/}
            <Route path="/bands/:id" element={<BandSheetMobile />} />
            <Route path="/bands/:bandId" element={<BandSheetMobile />} />
            <Route path="/invite" element={<InviteBandMobile />} />
            <Route path="/bands/:bandId/events" element={<BandEventsPage />} />
            <Route
              path="/bands/:bandId/public"
              element={<BandPublicProfileMobile />}
            />
            <Route
              path="/bands/:bandId/proposals"
              element={<BandProposalsPage />}
            />
            <Route
              path="/bands/:bandId/library"
              element={<BandLibraryPage />}
            />
            <Route path="/bands/:bandId/roster" element={<BandRosterPage />} />
            <Route
              path="/bands/:bandId/settings"
              element={<BandSettingsMobile />}
            />
            <Route
              path="/bands/:bandId/proposals/:proposalId"
              element={<ProposedGigSheetMobile />}
            />

            <Route
              path="/bands/:bandId/setlists"
              element={<BandSetlistPageMobile />}
            />
            <Route
              path="/bands/:bandId/setlists/:setlistId"
              element={<SetlistTemplateEditorMobile />}
            />
            <Route
              path="/bands/:bandId/songs"
              element={<BandSongListRouteMobile />}
            />
            <Route
              path="/bands/:bandId/songs/:songId"
              element={<BandSongSheetRouteMobile />}
            />

            {/* --- EVENT ROUTES --- */}

            {/* event hub sheet */}
            <Route
              path="/bands/:bandId/events/:eventId"
              element={<EventSheetMobile />}
            />
            <Route
              path="/bands/:bandId/events/:eventId/rollcall"
              element={<EventRollCallPageMobile />}
            />
            <Route
              path="/bands/:bandId/events/:eventId/chat"
              element={<EventChatPageMobile />}
            />
            <Route
              path="/bands/:bandId/events/:eventId/setlist"
              element={<EventSetlistPageMobile />}
            />
            <Route
              path="/bands/:bandId/events/:eventId/notes"
              element={<EventNotesPageMobile />}
            />
            <Route
              path="/bands/:bandId/events/:eventId/files"
              element={<EventFilesPageMobile />}
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
