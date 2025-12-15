import {
  IonButton,
  IonButtons,
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
  IonToast,
  IonToolbar,
} from '@ionic/react';
import {
  chatbubbleOutline,
  checkmarkOutline,
  chevronBackOutline,
  copyOutline,
  mailOutline,
  personAddOutline,
  refreshOutline,
} from 'ionicons/icons';
import React from 'react';
import { supabase } from '../lib/supabase';

import { useLocation, useNavigate, useParams } from 'react-router-dom';

type RouteParams = { bandId?: string };

function useBandId(): string | null {
  const { bandId: bandIdParam } = useParams<RouteParams>();
  const { search } = useLocation();

  return React.useMemo(() => {
    if (bandIdParam) return bandIdParam;
    const params = new URLSearchParams(search);
    return params.get('band');
  }, [bandIdParam, search]);
}

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
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);

  const [bandName, setBandName] = React.useState<string>('Band');
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [userId, setUserId] = React.useState<string | null>(null);

  const [mode, setMode] = React.useState<InviteMode>('email');
  const [emailInput, setEmailInput] = React.useState('');
  const [emails, setEmails] = React.useState<string[]>([]);
  const [sendingInvites, setSendingInvites] = React.useState(false);
  const [inviteLink, setInviteLink] = React.useState<string | null>(null);
  const [generatingLink, setGeneratingLink] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showSentToast, setShowSentToast] = React.useState(false);

  const bandId = useBandId();

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

        setUserId(user.id);

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

        // Generate invite link (creates a DB record)
        await generateInviteLink(user.id);
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

  // ---------- GENERATE INVITE LINK (creates DB record) ----------
  async function generateInviteLink(inviterId?: string) {
    if (!bandId) return;

    try {
      setGeneratingLink(true);
      setErr(null);

      const inviterUserId = inviterId || userId;
      if (!inviterUserId) {
        console.error('[InviteBandMobile] No user ID available');
        setErr('Not signed in');
        return;
      }

      // Ensure profile exists BEFORE creating invite (handles FK constraint)
      const { error: ensureErr } = await supabase.rpc('ensure_profile');
      if (ensureErr) {
        console.error('[InviteBandMobile] ensure_profile error:', ensureErr);
        // Continue anyway - profile might already exist
      }

      // Create a shareable invite record (no email - anyone with link can use it)
      const { data: invite, error } = await supabase
        .from('band_invitations')
        .insert({
          band_id: bandId,
          invited_by: inviterUserId,
          email: null,
          role: 'member',
          status: 'pending',
        })
        .select('token')
        .single();

      if (error) {
        console.error('[InviteBandMobile] Failed to create invite:', error);
        setErr('Failed to generate invite link');
        return;
      }

      const link = `https://amplee.app/invite/${invite.token}`;
      setInviteLink(link);
      console.log('[InviteBandMobile] Generated invite link:', link);
    } catch (e: any) {
      console.error('[InviteBandMobile] generateInviteLink error:', e);
      setErr(e?.message || 'Failed to generate link');
    } finally {
      setGeneratingLink(false);
    }
  }

  // ---------- REGENERATE LINK (creates new invite) ----------
  async function regenerateInviteLink() {
    await generateInviteLink();
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
      const base = 'https://amplee.app';
      console.log('[InviteBandMobile] api base =', base);

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
      setShowSentToast(true);
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
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <IonButtons slot="start">
            <IonButton
              fill="clear"
              onClick={() => nav(-1)}
              style={{ minWidth: 0, paddingInline: 4 }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ fontSize: 22, color: '#F9FAFB' }}
              />
            </IonButton>
          </IonButtons>

          <div
            style={{
              paddingInline: 12,
              paddingBlock: 8,
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: 24,
                fontWeight: 800,
                color: '#F9FAFB',
                letterSpacing: '-0.5px',
              }}
            >
              Invite Band Members
            </h1>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 13,
                color: '#9ca3af',
              }}
            >
              Share a link or send direct invites to {bandName}
            </p>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {loading ? (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <IonSpinner name="dots" style={{ color: '#a855f7' }} />
          </div>
        ) : err ? (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              padding: 16,
            }}
          >
            <div
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.4)',
                borderRadius: 20,
                padding: 20,
                maxWidth: 360,
              }}
            >
              <IonText>
                <p
                  style={{
                    margin: 0,
                    color: '#fecaca',
                    fontSize: 14,
                  }}
                >
                  {err}
                </p>
              </IonText>
            </div>
          </div>
        ) : !isAdmin ? (
          <div
            style={{
              height: '100%',
              display: 'grid',
              placeItems: 'center',
              padding: 16,
            }}
          >
            <div
              style={{
                background: 'rgba(250,204,21,0.08)',
                border: '1px solid rgba(250,204,21,0.4)',
                borderRadius: 20,
                padding: 20,
                maxWidth: 360,
              }}
            >
              <IonText>
                <p
                  style={{
                    margin: 0,
                    color: '#facc15',
                    fontSize: 14,
                  }}
                >
                  Only band admins can send invites for {bandName}.
                </p>
              </IonText>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 16,
              paddingBottom: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* INVITE LINK CARD */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: 20,
                padding: 20,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 8,
                }}
              >
                <IonIcon
                  icon={personAddOutline}
                  style={{ fontSize: 20, color: '#a855f7' }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    color: '#e5e7eb',
                  }}
                >
                  Share invite link
                </p>
              </div>
              <p
                style={{
                  margin: '0 0 12px',
                  fontSize: 13,
                  color: '#9ca3af',
                }}
              >
                Send a link for friends to join {bandName} directly.
              </p>

              <div
                style={{
                  background: 'rgba(15,23,42,0.96)',
                  borderRadius: 12,
                  padding: 10,
                  marginBottom: 12,
                  border: '1px solid rgba(148,163,184,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    color: '#a78bfa',
                    fontSize: 13,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {generatingLink
                    ? 'Generating link…'
                    : inviteLink || 'No link generated'}
                </span>
                {inviteLink && !generatingLink && (
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={regenerateInviteLink}
                    style={{
                      '--padding-start': '6px',
                      '--padding-end': '6px',
                      minHeight: 28,
                    }}
                  >
                    <IonIcon
                      icon={refreshOutline}
                      style={{ fontSize: 16, color: '#9ca3af' }}
                    />
                  </IonButton>
                )}
              </div>

              <IonButton
                expand="block"
                onClick={copyInviteLink}
                disabled={!inviteLink || generatingLink}
                style={{
                  '--background': copied
                    ? 'rgba(34,197,94,0.9)'
                    : 'linear-gradient(135deg, rgba(147,51,234,1), rgba(88,28,135,1))',
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
                {copied ? 'Copied!' : 'Copy link'}
              </IonButton>
            </div>

            {/* DIVIDER */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBlock: 8,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'rgba(148,163,184,0.3)',
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: 0.5,
                  color: '#6b7280',
                }}
              >
                OR SEND DIRECTLY
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: 'rgba(148,163,184,0.3)',
                }}
              />
            </div>

            {/* MODE SELECTOR */}
            <IonSegment
              value={mode}
              onIonChange={(e) => setMode(e.detail.value as InviteMode)}
              style={{
                '--background': 'rgba(15,23,42,0.9)',
                marginTop: 4,
                marginBottom: 8,
                borderRadius: 12,
                border: '1px solid rgba(148,163,184,0.35)',
              }}
            >
              <IonSegmentButton value="email">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 0',
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
                    padding: '6px 0',
                  }}
                >
                  <IonIcon icon={chatbubbleOutline} style={{ fontSize: 18 }} />
                  <span style={{ fontSize: 14, fontWeight: 600 }}>Text</span>
                </div>
              </IonSegmentButton>
            </IonSegment>

            {/* INPUT CARD */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: 20,
                padding: 20,
              }}
            >
              {mode === 'email' ? (
                <>
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: 13,
                      color: '#9ca3af',
                    }}
                  >
                    Enter email addresses to send invites.
                  </p>

                  <div
                    style={{
                      background: 'rgba(15,23,42,0.96)',
                      borderRadius: 10,
                      padding: '4px 12px',
                      marginBottom: 12,
                      border: '1px solid rgba(148,163,184,0.35)',
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
                        '--color': '#e5e7eb',
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
                    Add email
                  </IonButton>

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
                            color: '#e5e7eb',
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

                  <IonButton
                    expand="block"
                    onClick={sendEmailInvites}
                    disabled={emails.length === 0 || sendingInvites}
                    style={{
                      '--background':
                        'linear-gradient(135deg, rgba(147,51,234,1), rgba(88,28,135,1))',
                      '--border-radius': '14px',
                      height: 48,
                      fontWeight: 700,
                      fontSize: 15,
                      marginTop: 4,
                    }}
                  >
                    {sendingInvites
                      ? 'Sending…'
                      : `Send ${emails.length} invite${
                          emails.length !== 1 ? 's' : ''
                        }`}
                  </IonButton>
                </>
              ) : (
                <>
                  <p
                    style={{
                      margin: '0 0 12px',
                      fontSize: 13,
                      color: '#9ca3af',
                    }}
                  >
                    Opens your native texting app with the invite link
                    pre-filled.
                  </p>

                  <IonButton
                    expand="block"
                    onClick={openNativeTexting}
                    disabled={!inviteLink}
                    style={{
                      '--background':
                        'linear-gradient(135deg, rgba(147,51,234,1), rgba(88,28,135,1))',
                      '--border-radius': '14px',
                      height: 48,
                      fontWeight: 700,
                      fontSize: 15,
                    }}
                  >
                    <IonIcon icon={chatbubbleOutline} slot="start" />
                    Open Messages app
                  </IonButton>
                </>
              )}
            </div>
          </div>
        )}
      </IonContent>

      {/* Invites sent toast */}
      <IonToast
        isOpen={showSentToast}
        onDidDismiss={() => setShowSentToast(false)}
        message="Invites sent successfully."
        duration={2000}
        position="bottom"
        style={
          {
            '--background': 'rgba(5,46,22,0.96)',
            '--color': '#BBF7D0',
          } as any
        }
      />
    </IonPage>
  );
}
