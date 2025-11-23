import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  chatbubbleOutline,
  checkmarkOutline,
  chevronBackOutline,
  copyOutline,
  mailOutline,
  personAddOutline,
} from 'ionicons/icons';
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

type InviteMode = 'email' | 'sms';

export default function InviteBandMobile() {
  const bandId = useQueryParam('band');
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const [bandName, setBandName] = React.useState<string>('Band');
  const [isAdmin, setIsAdmin] = React.useState(false);

  const [mode, setMode] = React.useState<InviteMode>('email');
  const [emailInput, setEmailInput] = React.useState('');
  const [emails, setEmails] = React.useState<string[]>([]);
  const [sendingInvites, setSendingInvites] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  // ---------- LOAD BAND + ROLE ----------
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

        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();
        if (cancelled) return;
        if (userErr) throw userErr;
        if (!user) throw new Error('You must be signed in.');

        const { error: ensureErr } = await supabase.rpc('ensure_profile');
        if (cancelled) return;
        if (ensureErr) {
          console.error('[InviteBandMobile] ensure_profile error', ensureErr);
        }

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

        // Generate invite link with proper domain
        await generateInviteLink();
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

  // ---------- GENERATE INVITE LINK ----------
  async function generateInviteLink() {
    // Use amplee.app domain instead of localhost
    const domain = 'https://amplee.app';
    const link = `${domain}/invite?band=${bandId}`;
    setInviteLink(link);
  }

  // ---------- EMAIL HELPERS ----------
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
    if (!bandId || !isAdmin || emails.length === 0 || sendingInvites) return;

    try {
      setSendingInvites(true);
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
      setSendingInvites(false);
    }
  }

  // ---------- SMS VIA NATIVE APP ----------
  function openNativeTexting() {
    if (!inviteLink) return;

    const message = `Join ${bandName} on Amplee! ${inviteLink}`;
    const smsUrl = `sms:?&body=${encodeURIComponent(message)}`;

    window.location.href = smsUrl;
  }

  async function copyInviteLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Failed to copy', e);
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
            '--padding-start': '8px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '8px 0',
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
            </button>
            <div style={{ flex: 1 }}>
              <IonText
                style={{ color: '#e8e4ecff', fontSize: 18, fontWeight: 700 }}
              >
                Invite Friends
              </IonText>
              <IonText
                style={{
                  color: 'rgba(196,181,253,0.9)',
                  fontSize: 13,
                  display: 'block',
                  marginTop: 2,
                }}
              >
                to {bandName}
              </IonText>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background':
            'radial-gradient(circle at top, rgba(8,47,73,0.45), #050509 45%, #020109 100%)',
        }}
      >
        {loading ? (
          <div
            style={{
              paddingTop: 80,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <IonSpinner name="crescent" style={{ color: '#8049afff' }} />
            <IonText style={{ color: 'rgba(196,181,253,0.9)' }}>
              <p style={{ margin: 0 }}>Loading band…</p>
            </IonText>
          </div>
        ) : err ? (
          <div
            style={{
              padding: 20,
              margin: 16,
              background: 'rgba(242,63,67,0.1)',
              border: '1px solid rgba(242,63,67,0.3)',
              borderRadius: 18,
            }}
          >
            <IonText style={{ color: '#f23f42' }}>
              <p style={{ margin: 0 }}>{err}</p>
            </IonText>
          </div>
        ) : !isAdmin ? (
          <div
            style={{
              padding: 20,
              margin: 16,
              background: 'rgba(250,166,26,0.1)',
              border: '1px solid rgba(250,166,26,0.3)',
              borderRadius: 18,
            }}
          >
            <IonText style={{ color: '#faa61a' }}>
              <p style={{ margin: 0 }}>
                Only band admins can send invites for {bandName}.
              </p>
            </IonText>
          </div>
        ) : (
          <div style={{ padding: 16 }}>
            {/* Invite Link Card */}
            <div
              style={{
                borderRadius: 18,
                background:
                  'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                border: '1px solid rgba(88,28,135,0.7)',
                padding: 16,
                marginBottom: 16,
                boxShadow: '0 22px 45px rgba(0,0,0,0.9)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <IonIcon
                  icon={personAddOutline}
                  style={{ fontSize: 20, color: '#a78bfa' }}
                />
                <IonText
                  style={{
                    color: 'rgba(237,233,254,0.96)',
                    fontSize: 15,
                    fontWeight: 700,
                  }}
                >
                  Share Invite Link
                </IonText>
              </div>
              <IonText
                style={{
                  color: 'rgba(196,181,253,0.9)',
                  fontSize: 13,
                  display: 'block',
                  marginBottom: 12,
                }}
              >
                Send a link for friends to join directly
              </IonText>
              <div
                style={{
                  background: 'rgba(15,23,42,0.96)',
                  borderRadius: 10,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <IonText
                  style={{
                    color: '#a78bfa',
                    fontSize: 13,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {inviteLink || 'Generating...'}
                </IonText>
              </div>
              <IonButton
                expand="block"
                onClick={copyInviteLink}
                disabled={!inviteLink}
                style={{
                  '--background': copied
                    ? 'rgba(34,197,94,0.9)'
                    : 'linear-gradient(135deg, rgba(147,51,234,1), rgba(88,28,135,1))',
                  '--background-hover': copied
                    ? 'rgba(22,163,74,0.9)'
                    : 'linear-gradient(135deg, rgba(147,51,234,0.9), rgba(88,28,135,0.9))',
                  '--border-radius': '14px',
                  height: 48,
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                <IonIcon
                  icon={copied ? checkmarkOutline : copyOutline}
                  slot="start"
                />
                {copied ? 'Copied!' : 'Copy Link'}
              </IonButton>
            </div>

            {/* Divider */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                margin: '24px 0',
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'rgba(88,28,135,0.5)',
                }}
              />
              <IonText
                style={{
                  color: 'rgba(196,181,253,0.9)',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                OR SEND DIRECTLY
              </IonText>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'rgba(88,28,135,0.5)',
                }}
              />
            </div>

            {/* Mode Selector */}
            <IonSegment
              value={mode}
              onIonChange={(e) => setMode(e.detail.value as InviteMode)}
              style={{
                '--background':
                  'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                marginBottom: 16,
                borderRadius: 12,
                border: '1px solid rgba(88,28,135,0.5)',
              }}
            >
              <IonSegmentButton value="email">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 0',
                  }}
                >
                  <IonIcon icon={mailOutline} style={{ fontSize: 18 }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Email</span>
                </div>
              </IonSegmentButton>
              <IonSegmentButton value="sms">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 0',
                  }}
                >
                  <IonIcon icon={chatbubbleOutline} style={{ fontSize: 18 }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Text</span>
                </div>
              </IonSegmentButton>
            </IonSegment>

            {/* Input Card */}
            <div
              style={{
                borderRadius: 18,
                background:
                  'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                border: '1px solid rgba(88,28,135,0.7)',
                padding: 16,
                boxShadow: '0 22px 45px rgba(0,0,0,0.9)',
              }}
            >
              {mode === 'email' ? (
                <>
                  <IonText
                    style={{
                      color: 'rgba(196,181,253,0.9)',
                      fontSize: 13,
                      display: 'block',
                      marginBottom: 8,
                    }}
                  >
                    Enter email addresses to send invites
                  </IonText>
                  <div
                    style={{
                      background: 'rgba(15,23,42,0.96)',
                      borderRadius: 10,
                      padding: '4px 12px',
                      marginBottom: 12,
                    }}
                  >
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
                      style={{
                        '--color': '#e8e4ecff',
                        '--placeholder-color': 'rgba(156,163,175,0.7)',
                      }}
                    />
                  </div>
                  <IonButton
                    expand="block"
                    fill="outline"
                    onClick={addEmailFromInput}
                    disabled={!emailInput.trim()}
                    style={{
                      '--border-color': 'rgba(168,85,247,0.8)',
                      '--color': '#a855f7',
                      '--border-radius': '10px',
                      height: 44,
                      marginBottom: 12,
                      fontWeight: 600,
                    }}
                  >
                    Add Email
                  </IonButton>

                  {/* Email chips */}
                  {emails.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      {emails.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => removeEmail(em)}
                          style={{
                            borderRadius: 999,
                            border: '1px solid rgba(168,85,247,0.6)',
                            padding: '6px 12px',
                            fontSize: 13,
                            background: 'rgba(147,51,234,0.2)',
                            color: '#e8e4ecff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            fontWeight: 500,
                          }}
                        >
                          <span>{em}</span>
                          <span style={{ fontSize: 16, opacity: 0.8 }}>×</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Send button */}
                  <IonButton
                    expand="block"
                    onClick={sendEmailInvites}
                    disabled={emails.length === 0 || sendingInvites}
                    style={{
                      '--background':
                        'linear-gradient(135deg, rgba(147,51,234,1), rgba(88,28,135,1))',
                      '--background-hover':
                        'linear-gradient(135deg, rgba(147,51,234,0.9), rgba(88,28,135,0.9))',
                      '--border-radius': '14px',
                      height: 48,
                      fontWeight: 700,
                      fontSize: 15,
                      marginTop: 4,
                    }}
                  >
                    {sendingInvites
                      ? 'Sending...'
                      : `Send ${emails.length} Email${
                          emails.length !== 1 ? 's' : ''
                        }`}
                  </IonButton>
                </>
              ) : (
                <>
                  <IonText
                    style={{
                      color: 'rgba(196,181,253,0.9)',
                      fontSize: 13,
                      display: 'block',
                      marginBottom: 12,
                    }}
                  >
                    Opens your native texting app with the invite link
                    pre-filled
                  </IonText>

                  <IonButton
                    expand="block"
                    onClick={openNativeTexting}
                    disabled={!inviteLink}
                    style={{
                      '--background':
                        'linear-gradient(135deg, rgba(147,51,234,1), rgba(88,28,135,1))',
                      '--background-hover':
                        'linear-gradient(135deg, rgba(147,51,234,0.9), rgba(88,28,135,0.9))',
                      '--border-radius': '14px',
                      height: 48,
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    <IonIcon icon={chatbubbleOutline} slot="start" />
                    Open Messages App
                  </IonButton>
                </>
              )}
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
