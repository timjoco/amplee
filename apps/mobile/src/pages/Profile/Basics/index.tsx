import { Capacitor } from '@capacitor/core';
import {
  IonActionSheet,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import AndroidBottomSafeArea from '../../../components/AndroidBottomSafeArea';

const isAndroid = Capacitor.getPlatform() === 'android';

import { AvatarCard } from './components/AvatarCard';
import { PersonalInfoCard } from './components/PersonalInfoCard';
import { SaveButton } from './components/SaveButton';
import { useAvatarUpload } from './hooks/useAvatarUpload';
import { useProfileBasics } from './hooks/useProfileBasics';

export default function ProfileBasicsPage() {
  const nav = useNavigate();

  const {
    loading,
    savingProfile,
    saveSuccess,
    error,
    profile,
    setProfile,
    displayName,
    setDisplayName,
    firstName,
    setFirstName,
    lastName,
    setLastName,
    location,
    setLocation,
    toastMessage,
    setToastMessage,
    computedDisplayName,
    onSaveProfile,
    setError,
  } = useProfileBasics();

  const {
    uploadingAvatar,
    showAvatarPicker,
    setShowAvatarPicker,
    fileInputRef,
    onPickFile,
    onFileChange,
    uploadAvatarFromNative,
  } = useAvatarUpload({
    profile,
    setProfile,
    setToastMessage,
    setError,
  });

  return (
    <IonPage>
      {/* Header */}
      <IonHeader>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
            paddingTop: isAndroid ? 'env(safe-area-inset-top, 24px)' : undefined,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              gap: 12,
            }}
          >
            <IonButton
              onClick={() => nav(-1)}
              fill="clear"
              style={{
                minWidth: 0,
                padding: 6,
                margin: 0,
                flexShrink: 0,
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#9ca3af', fontSize: 22 }}
              />
            </IonButton>

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: 20,
                  fontWeight: 800,
                  color: '#F9FAFB',
                  margin: 0,
                  letterSpacing: '-0.8px',
                  lineHeight: 1.15,
                }}
              >
                Edit Profile
              </h1>
              <div
                style={{
                  fontSize: 13,
                  color: '#9ca3af',
                  marginTop: 4,
                }}
              >
                Update your information
              </div>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
          '--padding-bottom': isAndroid
            ? '80px'
            : 'calc(env(safe-area-inset-bottom) + 24px)',
        } as React.CSSProperties}
      >
        {/* Loading state */}
        {loading && (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
            }}
          >
            <IonSpinner style={{ '--color': '#34d399' }} />
          </div>
        )}

        {/* Error state (no profile) */}
        {!loading && error && !profile && (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              gap: 8,
              height: '100%',
              padding: '0 24px',
            }}
          >
            <IonText>
              <p
                style={{
                  color: '#ef4444',
                  fontSize: 14,
                  textAlign: 'center',
                }}
              >
                {error}
              </p>
            </IonText>
          </div>
        )}

        {/* Main content */}
        {!loading && profile && (
          <div
            style={{
              maxWidth: 600,
              margin: '0 auto',
              padding: '0 16px 32px',
            }}
          >
            <AvatarCard
              computedDisplayName={computedDisplayName}
              avatarUrl={profile.avatar_url}
              uploadingAvatar={uploadingAvatar}
              fileInputRef={fileInputRef}
              onPickFile={onPickFile}
              onFileChange={onFileChange}
            />

            <PersonalInfoCard
              displayName={displayName}
              firstName={firstName}
              lastName={lastName}
              location={location}
              onDisplayNameChange={setDisplayName}
              onFirstNameChange={setFirstName}
              onLastNameChange={setLastName}
              onLocationChange={setLocation}
            />

            {/* Error Message */}
            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  marginTop: 12,
                  fontSize: 13,
                  color: '#fca5a5',
                }}
              >
                {error}
              </div>
            )}

            <SaveButton
              saving={savingProfile}
              saveSuccess={saveSuccess}
              onSave={onSaveProfile}
            />
          </div>
        )}
      </IonContent>

      <IonActionSheet
        isOpen={showAvatarPicker}
        cssClass="amplee-action-sheet-dark"
        onDidDismiss={() => setShowAvatarPicker(false)}
        header="Update photo"
        buttons={[
          {
            text: 'Take Photo',
            handler: () => {
              setShowAvatarPicker(false);
              void uploadAvatarFromNative('camera');
            },
          },
          {
            text: 'Choose from Library',
            handler: () => {
              setShowAvatarPicker(false);
              void uploadAvatarFromNative('library');
            },
          },
          { text: 'Cancel', role: 'cancel' },
        ]}
      />

      {/* Toast */}
      <IonToast
        isOpen={toastMessage !== null}
        message={toastMessage ?? ''}
        duration={2200}
        mode="ios"
        position="bottom"
        onDidDismiss={() => setToastMessage(null)}
        cssClass="amplee-toast-success"
      />
      <AndroidBottomSafeArea />
    </IonPage>
  );
}
