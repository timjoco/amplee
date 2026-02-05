'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '../../../lib/supabaseClient';

type InvitePreview = {
  ok: boolean;
  token: string;
  bandId: string;
  email: string;
  role: 'member' | 'admin' | null;
  status: 'pending' | 'accepted' | 'revoked' | 'expired';
  bandName?: string | null;
  inviterEmail?: string | null;
};

export default function InviteClient({ token }: { token: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const supabase = useMemo(() => supabaseBrowser(), []);

  // Detect mobile (for the "Open in app" button)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ua = window.navigator.userAgent || '';
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(ua));
  }, []);

  // Load invite preview
  useEffect(() => {
    let mounted = true;

    (async () => {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/invites/${encodeURIComponent(token)}`);
      if (!res.ok) {
        const t = await res.text();
        if (mounted) {
          setError(t || 'Invite not found');
          setLoading(false);
        }
        return;
      }
      const data = await res.json();
      if (mounted) {
        setInvite(data.invite as InvitePreview);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [token]);

  // 🔗 Open dev app via custom scheme
  const handleOpenInApp = () => {
    if (!token) return;
    const appUrl = `amplee://invite/${encodeURIComponent(token)}`;
    window.location.href = appUrl;
  };

  // Existing continue flow (web accept)
  const onContinue = async () => {
    setError(null);
    setLoading(true);

    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      router.replace(
        `/login?redirect=${encodeURIComponent(`/invite/${token}`)}`
      );
      return;
    }

    // Note: Email validation is handled server-side in the accept endpoint.
    // We don't check here because the GET endpoint returns obfuscated emails for privacy.

    const res = await fetch(
      `/api/invites/${encodeURIComponent(token)}/accept`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      }
    );

    if (!res.ok) {
      const t = await res.text();
      setLoading(false);
      setError(t || 'Failed to accept invite');
      return;
    }
    const { bandId } = await res.json();

    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) {
      router.replace('/login');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarded')
      .eq('user_id', userRes.user.id)
      .maybeSingle();

    if (!profile || profile.onboarded === false) {
      router.replace(`/onboarding/invite?bandId=${encodeURIComponent(bandId)}`);
    } else {
      router.replace(`/bands/${encodeURIComponent(bandId)}`);
    }
  };

  if (loading) return <div style={{ padding: 24 }}>Loading invite…</div>;
  if (error) {
    return (
      <div style={{ padding: 24, maxWidth: 560 }}>
        <h2>Invite problem</h2>
        <p style={{ color: 'crimson' }}>{error}</p>
        <button onClick={() => router.replace('/login')}>Go to login</button>
      </div>
    );
  }
  if (!invite) return null;

  return (
    <div style={{ padding: 24, maxWidth: 560 }}>
      <h1>Join {invite.bandName || 'this band'}</h1>
      <p>
        You were invited{' '}
        {invite.inviterEmail ? `by ${invite.inviterEmail}` : ''} to join as{' '}
        <b>{invite.role ?? 'member'}</b>.
      </p>

      {invite.status !== 'pending' ? (
        <p style={{ color: 'crimson' }}>
          This invite is <b>{invite.status}</b>.
        </p>
      ) : (
        <>
          {isMobile && (
            <>
              <button
                onClick={handleOpenInApp}
                style={{
                  display: 'block',
                  width: '100%',
                  marginBottom: 12,
                  padding: '10px 16px',
                  borderRadius: 999,
                  border: 'none',
                  background:
                    'linear-gradient(135deg, rgba(147,51,234,1), rgba(88,28,135,1))',
                  color: '#fff',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Open in Amplee app (dev)
              </button>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: 12,
                  color: '#6b7280',
                  marginBottom: 8,
                }}
              >
                or continue in browser
              </div>
            </>
          )}

          <button
            onClick={onContinue}
            style={{
              display: 'block',
              width: '100%',
              padding: '10px 16px',
              borderRadius: 999,
              border: '1px solid rgba(148,163,184,0.5)',
              background: 'transparent',
              color: '#e5e7eb',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Continue in browser
          </button>
        </>
      )}
    </div>
  );
}
