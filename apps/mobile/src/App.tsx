// src/App.tsx (RRv6, no IonApp here)
import { Navigate, Route, Routes } from 'react-router-dom';
import { useSession } from './lib/useSession';
import AuthCallback from './pages/AuthCallback';
import Event from './pages/Event';
import GreenRoom from './pages/GreenRoom';
import Home from './pages/Home';
import Invite from './pages/Invite';
import Login from './pages/Login';
import VerifyEmail from './pages/VerifyEmail';

export default function App() {
  const { loading, session } = useSession();
  if (loading) return null;

  return (
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
          <Route path="/home" element={<Home />} />
          <Route path="/event/:id" element={<Event />} />
          <Route path="/greenroom/:eventId" element={<GreenRoom />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<Navigate to="/home" replace />} />
        </>
      )}
    </Routes>
  );
}
