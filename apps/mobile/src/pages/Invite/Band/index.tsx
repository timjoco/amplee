import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

import { EmailInviteCard } from './components/EmailInviteCard';
import { InviteLinkCard } from './components/InviteLinkCard';
import { InviteModeSelector } from './components/InviteModeSelector';
import { SmsInviteCard } from './components/SmsInviteCard';
import { useInviteBand } from './hooks/useInviteBand';

export default function InviteBandPage() {
  const nav = useNavigate();
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
