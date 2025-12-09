import {
  IonButton,
  IonContent,
  IonHeader,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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

type RawInviteResponse =
  | InvitePreview
  | {
      ok: boolean;
      invite: {
        token: string;
        band_id: string;
        email: string;
        role: 'member' | 'admin' | null;
        status: 'pending' | 'accepted' | 'revoked' | 'expired';
        bandName?: string | null;
        inviterEmail?: string | null;
      };
    };

// Normalize API response → InvitePreview shape
function normalizeInvite(raw: RawInviteResponse): InvitePreview {
  if ('invite' in raw) {
    const { invite } = raw;
    return {
      ok: raw.ok,
      token: invite.token,
      bandId: invite.band_id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      bandName: invite.bandName ?? null,
      inviterEmail: invite.inviterEmail ?? null,
    };
  }
  return raw as InvitePreview;
}

export default function Invite() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  // Base URL for calling your Next API from mobile
  const apiBase = useMemo(() => {
    const envBase =
      import.meta.env.VITE_API_BASE?.replace(/\/+$/, '') ||
      import.meta.env.VITE_APP_URL?.replace(/\/+$/, '') ||
      '';

    // Fallback for safety so mobile dev app still works if env is missing
    const base = envBase || 'https://amplee.app';

    // Debug log to confirm where we're actually calling
    // (shows up in Xcode / Android Studio console)
    // eslint-disable-next-line no-console
    console.log('[InviteMobile] apiBase =', base);

    return base;
  }, []);

  // ─────────────────────────────────────────
  // Load invite preview
  // ─────────────────────────────────────────
  useEffect(() => {
    if (!token) {
      setErr('Missing invite token.');
      setLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        const url = `${apiBase}/api/invites/${encodeURIComponent(token)}`;
        // eslint-disable-next-line no-console
        console.log('[InviteMobile] GET', url);

        const res = await fetch(url);

        if (!res.ok) {
          const t = await res.text();
          if (!cancelled) {
            setErr(t || 'Invite not found.');
            setLoading(false);
          }
          return;
        }

        const data = (await res.json()) as RawInviteResponse;
        const normalized = normalizeInvite(data);

        if (!cancelled) {
          setInvite(normalized);
          setLoading(false);
        }
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.error('[InviteMobile] fetch error', e);
        if (!cancelled) {
          setErr(e?.message || 'Failed to load invite.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, apiBase]);

  // ─────────────────────────────────────────
  // Accept invite (with onboarding-aware redirect)
  // ─────────────────────────────────────────
  const onContinue = async () => {
    if (!token || !invite || invite.status !== 'pending') return;

    setErr(null);
    setAccepting(true);

    try {
      // 1) Check session
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      if (!data.session) {
        navigate(`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`, {
          replace: true,
        });
        setAccepting(false);
        return;
      }

      // 2) Email mismatch guard
      const sessionEmail = (data.session.user.email ?? '').toLowerCase();
      const inviteEmail = (invite.email ?? '').toLowerCase();
      if (inviteEmail && sessionEmail && inviteEmail !== sessionEmail) {
        setAccepting(false);
        setErr(
          `You are signed in as ${sessionEmail}, but this invite is for ${inviteEmail}. Sign out and sign in as the invited email.`
        );
        return;
      }

      // 3) Accept via API
      const acceptUrl = `${apiBase}/api/invites/${encodeURIComponent(
        token
      )}/accept`;
      // eslint-disable-next-line no-console
      console.log('[InviteMobile] POST', acceptUrl);

      const resp = await fetch(acceptUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      if (!resp.ok) {
        const text = await resp.text();

        // If backend returns 401/403, treat as "you need to login"
        if (resp.status === 401 || resp.status === 403) {
          navigate(
            `/login?redirect=${encodeURIComponent(`/invite/${token}`)}`,
            { replace: true }
          );
          setAccepting(false);
          return;
        }

        setErr(text || 'Failed to accept invite.');
        setAccepting(false);
        return;
      }

      const acceptData = await resp.json();
      const bandId = acceptData.bandId || acceptData.band_id;
      if (!bandId) {
        throw new Error('Accept response missing bandId');
      }

      const bandPath = `/bands/${encodeURIComponent(bandId)}`;

      // 4) Check onboarding status
      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) {
        navigate(`/login?redirect=${encodeURIComponent(`/invite/${token}`)}`, {
          replace: true,
        });
        setAccepting(false);
        return;
      }

      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', user.id)
        .maybeSingle();

      if (pErr) {
        // eslint-disable-next-line no-console
        console.warn('[InviteMobile] profile check error', pErr);
      }

      if (!profile || profile.onboarded === false) {
        // New user / not onboarded → onboarding first, then band
        navigate(`/onboarding?next=${encodeURIComponent(bandPath)}`, {
          replace: true,
        });
      } else {
        // Already onboarded → straight to band
        navigate(bandPath, { replace: true });
      }
    } catch (e: any) {
      // eslint-disable-next-line no-console
      console.error('[InviteMobile] onContinue error', e);
      setErr(e?.message || 'Failed to accept invite.');
    } finally {
      setAccepting(false);
    }
  };

  // ─────────────────────────────────────────
  // UI
  // ─────────────────────────────────────────
  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Band Invite</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="ion-padding">
        {loading ? (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <IonSpinner name="dots" />
          </div>
        ) : err ? (
          <div>
            <IonText color="danger">
              <p>{err}</p>
            </IonText>
            <IonButton
              expand="block"
              onClick={() => navigate('/login', { replace: true })}
              style={{ marginTop: 16 }}
            >
              Go to login
            </IonButton>
          </div>
        ) : !invite ? null : (
          <>
            <h2>Join {invite.bandName || 'this band'}</h2>
            <p>
              You were invited{' '}
              {invite.inviterEmail ? `by ${invite.inviterEmail}` : ''} to join
              as <b>{invite.role ?? 'member'}</b>.
            </p>
            {invite.status !== 'pending' ? (
              <IonText color="danger">
                <p>
                  This invite is <b>{invite.status}</b>.
                </p>
              </IonText>
            ) : (
              <IonButton
                expand="block"
                onClick={onContinue}
                disabled={accepting}
              >
                {accepting ? 'Joining…' : 'Join this band'}
              </IonButton>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
