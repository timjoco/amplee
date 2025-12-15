import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
  useIonRouter,
} from '@ionic/react';
import {
  alertCircleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  closeOutline,
  musicalNotesOutline,
  timeOutline,
} from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  const ionRouter = useIonRouter();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<InvitePreview | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  const apiBase = useMemo(() => {
    const envBase =
      import.meta.env.VITE_API_BASE?.replace(/\/+$/, '') ||
      import.meta.env.VITE_APP_URL?.replace(/\/+$/, '') ||
      '';
    const base = envBase || 'https://amplee.app';
    console.log('[InviteMobile] apiBase =', base);
    return base;
  }, []);

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

  const onContinue = async () => {
    if (!token || !invite || invite.status !== 'pending') return;

    setErr(null);
    setAccepting(true);

    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;

      // Not logged in - redirect to login with next param
      if (!data.session) {
        setAccepting(false);
        ionRouter.push(
          `/login?next=${encodeURIComponent(`/invite/${token}`)}`,
          'forward',
          'replace'
        );
        return;
      }

      const sessionEmail = (data.session.user.email ?? '').toLowerCase();
      const inviteEmail = (invite.email ?? '').toLowerCase();
      if (inviteEmail && sessionEmail && inviteEmail !== sessionEmail) {
        setAccepting(false);
        setErr(
          `You are signed in as ${sessionEmail}, but this invite is for ${inviteEmail}. Sign out and sign in as the invited email.`
        );
        return;
      }

      const acceptUrl = `${apiBase}/api/invites/${encodeURIComponent(
        token
      )}/accept`;
      console.log('[InviteMobile] POST', acceptUrl);

      const resp = await fetch(acceptUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${data.session.access_token}` },
      });

      if (!resp.ok) {
        const text = await resp.text();

        if (resp.status === 401 || resp.status === 403) {
          setAccepting(false);
          ionRouter.push(
            `/login?next=${encodeURIComponent(`/invite/${token}`)}`,
            'forward',
            'replace'
          );
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

      const { data: userRes } = await supabase.auth.getUser();
      const user = userRes?.user;
      if (!user) {
        setAccepting(false);
        ionRouter.push(
          `/login?next=${encodeURIComponent(`/invite/${token}`)}`,
          'forward',
          'replace'
        );
        return;
      }

      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('onboarded')
        .eq('id', user.id)
        .maybeSingle();

      if (pErr) {
        console.warn('[InviteMobile] profile check error', pErr);
      }

      if (!profile || profile.onboarded === false) {
        ionRouter.push(
          `/onboarding?next=${encodeURIComponent(bandPath)}`,
          'forward',
          'replace'
        );
      } else {
        ionRouter.push(bandPath, 'forward', 'replace');
      }
    } catch (e: any) {
      console.error('[InviteMobile] onContinue error', e);
      setErr(e?.message || 'Failed to accept invite.');
      setAccepting(false);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'accepted':
        return {
          icon: checkmarkCircleOutline,
          color: '#22c55e',
          label: 'Already Accepted',
        };
      case 'revoked':
        return {
          icon: closeCircleOutline,
          color: '#ef4444',
          label: 'Revoked',
        };
      case 'expired':
        return {
          icon: timeOutline,
          color: '#f59e0b',
          label: 'Expired',
        };
      default:
        return null;
    }
  };

  return (
    <IonPage>
      <IonContent
        fullscreen
        style={{
          '--background': '#0c0a14',
        }}
      >
        {/* Close Button */}
        <div
          style={{
            position: 'absolute',
            top: 'calc(env(safe-area-inset-top) + 12px)',
            right: 16,
            zIndex: 10,
          }}
        >
          <IonButton
            fill="clear"
            onClick={() => ionRouter.push('/home', 'back', 'replace')}
            style={{
              '--color': 'rgba(156,163,175,0.9)',
              '--padding-start': '8px',
              '--padding-end': '8px',
            }}
          >
            <IonIcon icon={closeOutline} style={{ fontSize: 24 }} />
          </IonButton>
        </div>

        <div
          style={{
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            paddingTop: 'calc(env(safe-area-inset-top) + 24px)',
            paddingBottom: 'calc(env(safe-area-inset-bottom) + 24px)',
          }}
        >
          {loading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <IonSpinner
                name="dots"
                style={{ '--color': '#8b5cf6', transform: 'scale(1.5)' }}
              />
              <span style={{ color: 'rgba(156,163,175,0.7)', fontSize: 14 }}>
                Loading invite…
              </span>
            </div>
          ) : err ? (
            <div
              style={{
                width: '100%',
                maxWidth: 360,
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(239,68,68,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 20px',
                }}
              >
                <IonIcon
                  icon={alertCircleOutline}
                  style={{ fontSize: 32, color: '#ef4444' }}
                />
              </div>

              <h2
                style={{
                  margin: '0 0 12px',
                  color: '#e5e7eb',
                  fontSize: 20,
                  fontWeight: 600,
                }}
              >
                Something went wrong
              </h2>

              <p
                style={{
                  margin: '0 0 24px',
                  color: 'rgba(156,163,175,0.9)',
                  fontSize: 14,
                  lineHeight: 1.5,
                }}
              >
                {err}
              </p>

              <IonButton
                expand="block"
                onClick={() => ionRouter.push('/login', 'forward', 'replace')}
                style={{
                  '--background': '#7c3aed',
                  '--background-hover': '#6d28d9',
                  '--border-radius': '10px',
                }}
              >
                Go to Login
              </IonButton>
            </div>
          ) : !invite ? null : (
            <div
              style={{
                width: '100%',
                maxWidth: 360,
                textAlign: 'center',
              }}
            >
              {/* Band Icon */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 20,
                  background: 'rgba(139,92,246,0.15)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                }}
              >
                <IonIcon
                  icon={musicalNotesOutline}
                  style={{ fontSize: 36, color: '#a78bfa' }}
                />
              </div>

              {/* Invite Header */}
              <h1
                style={{
                  margin: '0 0 8px',
                  color: '#e5e7eb',
                  fontSize: 24,
                  fontWeight: 700,
                }}
              >
                You're invited!
              </h1>

              <p
                style={{
                  margin: '0 0 24px',
                  color: 'rgba(156,163,175,0.9)',
                  fontSize: 15,
                }}
              >
                Join{' '}
                <strong style={{ color: '#e5e7eb' }}>
                  {invite.bandName || 'this band'}
                </strong>
              </p>

              {/* Invite Details Card */}
              <div
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 12,
                  padding: 16,
                  marginBottom: 24,
                  textAlign: 'left',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gap: 12,
                    fontSize: 14,
                    color: 'rgba(203,213,225,0.9)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <span style={{ color: 'rgba(156,163,175,0.7)' }}>Role</span>
                    <span
                      style={{
                        background:
                          invite.role === 'admin'
                            ? 'rgba(139,92,246,0.2)'
                            : 'rgba(34,197,94,0.2)',
                        color: invite.role === 'admin' ? '#a78bfa' : '#4ade80',
                        padding: '4px 10px',
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                      }}
                    >
                      {invite.role ?? 'Member'}
                    </span>
                  </div>

                  {invite.inviterEmail && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span style={{ color: 'rgba(156,163,175,0.7)' }}>
                        Invited by
                      </span>
                      <span>{invite.inviterEmail}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status / Action */}
              {invite.status !== 'pending' ? (
                <div
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12,
                    padding: 20,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                  }}
                >
                  {(() => {
                    const config = getStatusConfig(invite.status);
                    if (!config) return null;
                    return (
                      <>
                        <IonIcon
                          icon={config.icon}
                          style={{ fontSize: 32, color: config.color }}
                        />
                        <span
                          style={{
                            color: config.color,
                            fontSize: 15,
                            fontWeight: 600,
                          }}
                        >
                          This invite has been {invite.status}
                        </span>
                      </>
                    );
                  })()}

                  <IonButton
                    fill="outline"
                    onClick={() => ionRouter.push('/home', 'back', 'replace')}
                    style={{
                      '--border-color': 'rgba(255,255,255,0.12)',
                      '--color': 'rgba(156,163,175,0.9)',
                      '--border-radius': '10px',
                      marginTop: 8,
                    }}
                  >
                    Go to Home
                  </IonButton>
                </div>
              ) : (
                <IonButton
                  expand="block"
                  onClick={onContinue}
                  disabled={accepting}
                  style={{
                    '--background': '#7c3aed',
                    '--background-hover': '#6d28d9',
                    '--border-radius': '10px',
                    '--padding-top': '14px',
                    '--padding-bottom': '14px',
                    fontWeight: 600,
                  }}
                >
                  {accepting ? (
                    <>
                      <IonSpinner
                        name="dots"
                        style={{ marginRight: 8, width: 20, height: 20 }}
                      />
                      Joining…
                    </>
                  ) : (
                    'Join Band'
                  )}
                </IonButton>
              )}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
