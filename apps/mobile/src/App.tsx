// app.tsx
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from 'react-router-dom';

import MobileBottomNav from './components/Nav/MobileBottomNav';
import { usePushNotifications } from './hooks/usePushNotifications';
import { useSession } from './hooks/useSession';

import { App as CapApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { useEffect } from 'react';

import { useDeepLinks } from './hooks/useDeepLinks';
import AuthCallback from './pages/AuthCallback';
import BandAvailabilityPage from './pages/Bands/BandAvailabilityPage';
import BandEventsPage from './pages/Bands/BandEventsPage';
import BandLibraryPage from './pages/Bands/BandLibraryPage';
import BandProposalsPage from './pages/Bands/BandProposalsPage';
import BandPublicProfileMobile from './pages/Bands/BandPublicProfileMobile';
import BandRosterPage from './pages/Bands/BandRosterPage';
import BandSetlistPageMobile from './pages/Bands/BandSetlistPageMobile';
import BandSettingsMobile from './pages/Bands/BandSettingsMobile';
import BandSheetMobile from './pages/Bands/BandSheet';
import BandSongEditRouteMobile from './pages/Bands/BandSongEditRouteMobile';
import BandSongListRouteMobile from './pages/Bands/BandSongListRouteMobile';
import BandSongSheetRouteMobile from './pages/Bands/BandSongSheetRouteMobile';
import SetlistTemplateEditorMobile from './pages/Bands/Setlists/SetlistTemplateEditorMobile';
import DiscoverPage from './pages/Discover/DiscoverPage';
import VendorProfilePage from './pages/Discover/VendorProfilePage';
import VendorDashboardPage from './pages/Vendor/VendorDashboardPage';
import VendorProfileEditPage from './pages/Vendor/VendorProfileEditPage';
import VendorContactPage from './pages/Discover/VendorContactPage';
import JobChatPage from './pages/Jobs/JobChatPage';
// TOUR PRO - commented out until ready for release
// import BandToursListPage from './pages/Bands/Tours/BandToursListPage';
// import TourEditorPage from './pages/Bands/Tours/TourEditorPage';
// import TourStopEditorPage from './pages/Bands/Tours/TourStopEditorPage';
// import TourChatPage from './pages/Bands/Tours/TourChatPage';
import EventChatPageMobile from './pages/Events/EventChat/EventChatPageMobile';
import EventFilesPage from './pages/Events/EventFiles';
import EventLayoutMobile from './pages/Events/EventLayoutMobile';
import EventNotesPage from './pages/Events/EventNotes';
import EventRollCallPageMobile from './pages/Events/EventRollCallPageMobile';
import EventSetlistPageMobile from './pages/Events/EventSetlistPageMobile';
import EventSettingsMobile from './pages/Events/EventSettings';
import EventSheetMobile from './pages/Events/EventSheet';
import Home from './pages/Home';
import Invite from './pages/Invite';
import InviteBandPage from './pages/Invite/Band';
import Login from './pages/Login';
import OnboardingPageMobile from './pages/OnboardingPageMobile';
import Profile from './pages/Profile';
import AccountManagement from './pages/Profile/AccountManagement';
import ProfileAvailability from './pages/ProfileAvailability';
import ProfileBasicsPage from './pages/Profile/Basics';
import ProposedGigSheet from './pages/ProposedGig';
import Support from './pages/Support';
import VerifyEmail from './pages/VerifyEmail';
import GlobalCreateHost from './shared/GlobalCreateHost';

export default function App() {
  const { loading, session } = useSession();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  // Initialize push notifications when user is logged in
  usePushNotifications(session?.user?.id);

  useEffect(() => {
    const setupKeyboard = async () => {
      const platform = Capacitor.getPlatform();

      if (platform === 'ios') {
        try {
          await Keyboard.setResizeMode({ mode: KeyboardResize.None });
          await Keyboard.setScroll({ isDisabled: false });
        } catch (e) {
          console.warn('[keyboard setup error]', e);
        }
      } else if (platform === 'android') {
        try {
          await Keyboard.setResizeMode({ mode: KeyboardResize.None });
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

  useDeepLinks();

  if (loading) return null;

  /* HIDE NAV ON EVENT SHEET + event subpages */
  const hideChrome =
    /^\/bands\/[^/]+\/events\/[^/]+(\/.*)?$/.test(pathname) ||
    /^\/event\/[^/]+(\/.*)?$/.test(pathname);
    // TOUR PRO: /^\/bands\/[^/]+\/tours\/[^/]+(\/.*)?$/.test(pathname)

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

            {/* DISCOVER ROUTES */}
            <Route path="/discover" element={<DiscoverPage />} />
            <Route path="/discover/vendors/:vendorId" element={<VendorProfilePage />} />
            <Route path="/discover/vendors/:vendorId/contact" element={<VendorContactPage />} />

            {/* JOB ROUTES */}
            <Route path="/jobs/:jobId" element={<JobChatPage />} />

            {/* VENDOR ROUTES (for users who are vendors) */}
            <Route path="/vendor/dashboard" element={<VendorDashboardPage />} />
            <Route path="/vendor/edit" element={<VendorProfileEditPage />} />

            {/* BAND ROUTES*/}
            <Route path="/bands/:bandId" element={<BandSheetMobile />} />
            <Route path="/invite" element={<InviteBandPage />} />
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
              element={<ProposedGigSheet />}
            />

            <Route
              path="/bands/:bandId/setlists"
              element={<BandSetlistPageMobile />}
            />
            <Route
              path="/bands/:bandId/setlists/:setlistId"
              element={<SetlistTemplateEditorMobile />}
            />

            {/* TOUR PRO - commented out until ready for release
            <Route
              path="/bands/:bandId/tours"
              element={<BandToursListPage />}
            />
            <Route
              path="/bands/:bandId/tours/:tourId"
              element={<TourEditorPage />}
            />
            <Route
              path="/bands/:bandId/tours/:tourId/stops/:stopId"
              element={<TourStopEditorPage />}
            />
            <Route
              path="/bands/:bandId/tours/:tourId/chat"
              element={<TourChatPage />}
            />
            */}

            <Route
              path="/bands/:bandId/songs"
              element={<BandSongListRouteMobile />}
            />
            <Route
              path="/bands/:bandId/songs/:songId"
              element={<BandSongSheetRouteMobile />}
            />

            <Route
              path="/bands/:bandId/songs/new"
              element={<BandSongEditRouteMobile />}
            />
            <Route
              path="/bands/:bandId/songs/:songId/edit"
              element={<BandSongEditRouteMobile />}
            />

            {/* --- EVENT ROUTES --- */}

            {/* New chat-first event layout with sidebar */}
            <Route
              path="/bands/:bandId/events/:eventId"
              element={<EventLayoutMobile />}
            />

            {/* Legacy routes - redirect to new layout or keep for direct access */}
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
              element={<EventNotesPage />}
            />
            <Route
              path="/bands/:bandId/events/:eventId/files"
              element={<EventFilesPage />}
            />
            <Route
              path="/bands/:bandId/events/:eventId/settings"
              element={<EventSettingsMobile />}
            />

            {/* Keep old event sheet accessible for reference */}
            <Route
              path="/bands/:bandId/events/:eventId/overview"
              element={<EventSheetMobile />}
            />

            <Route path="/support" element={<Support />} />

            {/* profile routes */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/basics" element={<ProfileBasicsPage />} />
            <Route path="/profile/account" element={<AccountManagement />} />
            <Route
              path="/profile/availability"
              element={<ProfileAvailability />}
            />
            <Route
              path="/bands/:bandId/availability"
              element={<BandAvailabilityPage />}
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
