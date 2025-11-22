import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline, mailOutline } from 'ionicons/icons';
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function useQueryParam(name: string): string | null {
  const { search } = useLocation();
  return React.useMemo(() => {
    const params = new URLSearchParams(search);
    const v = params.get(name);
    return v ? v : null;
  }, [search, name]);
}

export default function InviteBandMobile() {
  const bandId = useQueryParam('band');
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const [bandName, setBandName] = React.useState<string>('Band');
  const [isAdmin, setIsAdmin] = React.useState(false);

  const [emailInput, setEmailInput] = React.useState('');
  const [emails, setEmails] = React.useState<string[]>([]);
  const [sendingEmails, setSendingEmails] = React.useState(false);

  // ---------- LOAD BAND + ROLE + ENSURE PROFILE (mirror web) ----------
  React.useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!bandId) {
        setErr('Missing band id.');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErr(null);
        console.log('[InviteBandMobile] loading for bandId', bandId);

        // 1) get current user
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (userErr) throw userErr;
        if (!user) throw new Error('You must be signed in.');

        // 2) ensure_profile – same function as web, no args
        const { error: ensureErr } = await supabase.rpc('ensure_profile');
        if (cancelled) return;
        if (ensureErr) {
          console.error('[InviteBandMobile] ensure_profile error', ensureErr);
          // non-fatal: we still proceed; function is idempotent
        }

        // 3) check membership + role
        const { data: mem, error: memErr } = await supabase
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;
        if (memErr) throw memErr;
        if (!mem) {
          throw new Error('You are not a member of this band.');
        }

        const admin = mem.role === 'admin';
        if (!admin) {
          throw new Error('Only band admins can create invites.');
        }

        // 4) fetch band name
        const { data: band, error: bandErr } = await supabase
          .from('bands')
          .select('name')
          .eq('id', bandId)
          .maybeSingle();

        if (cancelled) return;
        if (bandErr) throw bandErr;
        if (!band) throw new Error('Band not found.');

        setBandName(band.name || 'Band');
        setIsAdmin(true);
      } catch (e: any) {
        if (cancelled) return;
        console.error('[InviteBandMobile] load error', e);
        setErr(e?.message || 'Failed to load invite info.');
        setIsAdmin(false);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [bandId]);

  // ---------- EMAIL-ONLY INVITE FLOW (same backend as web) ----------

  function addEmailFromInput() {
    const trimmed = emailInput.trim().toLowerCase();
    if (!trimmed) return;
    if (emails.includes(trimmed)) {
      setEmailInput('');
      return;
    }
    setEmails((prev) => [...prev, trimmed]);
    setEmailInput('');
  }

  function removeEmail(emailToRemove: string) {
    setEmails((prev) => prev.filter((e) => e !== emailToRemove));
  }

  async function sendEmailInvites() {
    if (!bandId || !isAdmin || emails.length === 0 || sendingEmails) return;

    try {
      setSendingEmails(true);
      setErr(null);

      const {
        data: { session },
        error: sessionErr,
      } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;
      if (!session) throw new Error('Not signed in');

      const role: 'member' = 'member';

      const base =
        import.meta.env.VITE_API_BASE?.replace(/\/+$/, '') ||
        import.meta.env.VITE_APP_URL?.replace(/\/+$/, '') ||
        '';

      console.log(
        '[InviteBandMobile] API base =',
        base,
        'origin =',
        window.location.origin
      );

      for (const em of emails) {
        const res = await fetch(`${base}/api/bands/${bandId}/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            email: em,
            role,
            bandName,
          }),
        });

        if (!res.ok) {
          const ct = res.headers.get('content-type') || '';
          const payload = ct.includes('application/json')
            ? await res.json()
            : await res.text();
          const msg =
            typeof payload === 'string'
              ? payload
              : payload?.error || 'Invite failed';
          throw new Error(msg);
        }
      }

      setEmails([]);
    } catch (e: any) {
      console.error('[InviteBandMobile] sendEmailInvites error', e);
      setErr(e?.message || 'Failed to send email invites.');
    } finally {
      setSendingEmails(false);
    }
  }

  if (!bandId) {
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Invite</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonText color="danger">
            <p>Missing band id.</p>
          </IonText>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader
        translucent
        style={{
          '--background': 'rgba(8,8,12,0.98)',
        }}
      >
        <IonToolbar
          style={{
            '--background': 'transparent',
          }}
        >
          <button
            type="button"
            onClick={() => nav(-1)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 8,
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <IonIcon
              icon={chevronBackOutline}
              style={{ fontSize: 20, color: '#8049afff', marginRight: 4 }}
            />
            <IonTitle style={{ color: '#e8e4ecff' }}>Invite a friend</IonTitle>
          </button>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        className="ion-padding"
        style={{
          '--background':
            'radial-gradient(circle at top, rgba(8,47,73,0.45), #050509 45%, #020109 100%)',
        }}
      >
        {loading ? (
          <div
            style={{
              paddingTop: 40,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <IonSpinner name="crescent" />
            <IonText color="medium">
              <p style={{ margin: 0 }}>Loading band…</p>
            </IonText>
          </div>
        ) : err ? (
          <div style={{ paddingTop: 24 }}>
            <IonText color="danger">
              <p style={{ margin: 0 }}>{err}</p>
            </IonText>
          </div>
        ) : !isAdmin ? (
          <div style={{ paddingTop: 24 }}>
            <IonText color="danger">
              <p style={{ margin: 0 }}>
                Only band admins can send invites for {bandName}.
              </p>
            </IonText>
          </div>
        ) : (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              paddingTop: 4,
            }}
          >
            {/* Heading */}
            <div>
              <IonText color="light">
                <h2
                  style={{
                    margin: 0,
                    fontSize: 20,
                    fontWeight: 800,
                  }}
                >
                  Invite to {bandName}
                </h2>
              </IonText>
              <IonText color="medium">
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  Send email invites so bandmates can join this band on Amplee.
                  They’ll click the link in the email, hit your{' '}
                  <code>/auth/callback</code> flow, and land in the app.
                </p>
              </IonText>
            </div>

            {/* Email “mode” row */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                marginTop: 4,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 999,
                  background: '#111827',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 0 0 1px rgba(148,163,184,0.4)',
                }}
              >
                <IonIcon
                  icon={mailOutline}
                  style={{ fontSize: 18, color: '#a5b4fc' }}
                />
              </div>
              <IonText color="medium">
                <span style={{ fontSize: 12 }}>Email invites only</span>
              </IonText>
            </div>

            {/* Email invites section */}
            <div id="email-invites">
              <IonText color="light">
                <h3
                  style={{
                    margin: '12px 0 4px',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Send email invites
                </h3>
              </IonText>
              <IonText color="medium">
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                  }}
                >
                  Add one or more email addresses. We’ll send the same invite
                  emails used on the web app.
                </p>
              </IonText>

              <IonItem
                lines="none"
                style={
                  {
                    '--background': 'rgba(15,23,42,0.96)',
                    borderRadius: 10,
                    marginTop: 8,
                  } as any
                }
              >
                <IonLabel position="stacked">Email address</IonLabel>
                <IonInput
                  type="email"
                  value={emailInput}
                  placeholder="friend@example.com"
                  onIonChange={(e) => setEmailInput(e.detail.value ?? '')}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addEmailFromInput();
                    }
                  }}
                />
              </IonItem>

              <div
                style={{
                  marginTop: 8,
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <IonButton
                  size="small"
                  fill="outline"
                  onClick={addEmailFromInput}
                  disabled={!emailInput.trim()}
                  style={
                    {
                      '--border-radius': '999px',
                    } as any
                  }
                >
                  Add email
                </IonButton>
              </div>

              {/* Chipped list of emails */}
              {emails.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 6,
                  }}
                >
                  {emails.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => removeEmail(em)}
                      style={{
                        borderRadius: 999,
                        border: '1px solid rgba(148,163,184,0.8)',
                        padding: '3px 8px',
                        fontSize: 11,
                        background: 'rgba(15,23,42,0.95)',
                        color: '#e5e7eb',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>{em}</span>
                      <span
                        style={{
                          fontSize: 12,
                          opacity: 0.7,
                        }}
                      >
                        ×
                      </span>
                    </button>
                  ))}
                </div>
              )}

              <div
                style={{
                  marginTop: 10,
                  display: 'flex',
                  justifyContent: 'flex-end',
                }}
              >
                <IonButton
                  size="default"
                  onClick={sendEmailInvites}
                  disabled={emails.length === 0 || sendingEmails}
                  style={
                    {
                      '--border-radius': '999px',
                      '--background': 'rgba(147,51,234,0.96)',
                      '--background-activated': 'rgba(124,58,237,0.98)',
                    } as any
                  }
                >
                  {sendingEmails ? 'Sending…' : 'Send invites'}
                </IonButton>
              </div>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
