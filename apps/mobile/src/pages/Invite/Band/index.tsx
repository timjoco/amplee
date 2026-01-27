import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline, personAddOutline, shieldOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { EmailInviteCard } from './components/EmailInviteCard';
import { InviteLinkCard } from './components/InviteLinkCard';
import { InviteModeSelector } from './components/InviteModeSelector';
import { SmsInviteCard } from './components/SmsInviteCard';
import { useInviteBand } from './hooks/useInviteBand';

// Hook to detect screen size for responsive layouts
function useScreenSize() {
  const [size, setSize] = useState<'small' | 'medium' | 'large'>(() => {
    if (typeof window === 'undefined') return 'small';
    if (window.innerWidth >= 1026) return 'large';
    if (window.innerWidth >= 768) return 'medium';
    return 'small';
  });

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1026) setSize('large');
      else if (window.innerWidth >= 768) setSize('medium');
      else setSize('small');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

export default function InviteBandPage() {
  const nav = useNavigate();
  const screenSize = useScreenSize();
  const isLarge = screenSize === 'large';
  const {
    bandId,
    loading,
    err,
    bandName,
    isAdmin,
    mode,
    setMode,
    emailInput,
    setEmailInput,
    emails,
    sendingInvites,
    inviteLink,
    generatingLink,
    copied,
    showSentToast,
    setShowSentToast,
    generateInviteLink,
    addEmailFromInput,
    removeEmail,
    sendEmailInvites,
    openNativeTexting,
    copyInviteLink,
  } = useInviteBand();

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
      <IonHeader translucent className="ion-no-border">
        <IonToolbar
          style={{
            '--background': 'rgba(8, 8, 14, 0.95)',
            '--border-width': 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              gap: 12,
            }}
          >
            {/* Back Button */}
            <button
              onClick={() => nav(-1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                placeItems: 'center',
                color: '#9ca3af',
                flexShrink: 0,
                cursor: 'pointer',
              }}
            >
              <IonIcon icon={chevronBackOutline} style={{ fontSize: 20 }} />
            </button>

            {/* Title Section */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon
                  icon={personAddOutline}
                  style={{ color: '#a78bfa', fontSize: 20 }}
                />
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#f9fafb',
                    margin: 0,
                    letterSpacing: '-0.5px',
                  }}
                >
                  Invite Members
                </h1>
              </div>
              {bandName && (
                <div
                  style={{
                    fontSize: 13,
                    color: '#6b7280',
                    marginTop: 2,
                    marginLeft: 28,
                  }}
                >
                  {bandName}
                </div>
              )}
            </div>

            {/* Admin Badge */}
            {isAdmin && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 10,
                  background: 'rgba(167, 139, 250, 0.08)',
                  border: '1px solid rgba(167, 139, 250, 0.25)',
                }}
              >
                <IonIcon
                  icon={shieldOutline}
                  style={{ fontSize: 14, color: '#a78bfa' }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#a78bfa',
                  }}
                >
                  Admin
                </span>
              </div>
            )}
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
              padding: isLarge ? '24px 48px' : 16,
              paddingBottom: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
              maxWidth: isLarge ? 1100 : 'none',
              margin: isLarge ? '0 auto' : undefined,
            }}
          >
            <InviteLinkCard
              bandName={bandName}
              inviteLink={inviteLink}
              generatingLink={generatingLink}
              copied={copied}
              onCopy={copyInviteLink}
              onRegenerate={() => generateInviteLink()}
            />

            <InviteModeSelector mode={mode} onModeChange={setMode} />

            {mode === 'email' ? (
              <EmailInviteCard
                emailInput={emailInput}
                emails={emails}
                sendingInvites={sendingInvites}
                onEmailInputChange={setEmailInput}
                onAddEmail={addEmailFromInput}
                onRemoveEmail={removeEmail}
                onSendInvites={sendEmailInvites}
              />
            ) : (
              <SmsInviteCard
                inviteLink={inviteLink}
                onOpenTexting={openNativeTexting}
              />
            )}
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
