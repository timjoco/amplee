import { Capacitor } from '@capacitor/core';
import { IonAlert, IonContent, IonPage, IonSpinner, IonText } from '@ionic/react';
import { useNavigate } from 'react-router-dom';

import { AccountInfoCard } from './components/AccountInfoCard';
import { AvatarCard } from './components/AvatarCard';
import { LogoutCard } from './components/LogoutCard';
import { NavCard } from './components/NavCard';
import { ProfileHeader } from './components/ProfileHeader';
import { useProfile } from './hooks/useProfile';
import { computeDisplayName, computeFullName } from './utils';

const isAndroid = Capacitor.getPlatform() === 'android';

export default function Profile() {
  const nav = useNavigate();
  const {
    loading,
    error,
    profile,
    authUser,
    logoutAlertOpen,
    setLogoutAlertOpen,
    handleConfirmLogout,
  } = useProfile();

  const displayName = computeDisplayName(profile, authUser);
  const location = profile?.location || 'Add your location';
  const email = authUser?.email as string | undefined;
  const fullName = computeFullName(profile);

  return (
    <IonPage>
      <ProfileHeader />

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {loading && (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
            }}
          >
            <IonSpinner style={{ '--color': '#f6f6f6ff' }} />
          </div>
        )}

        {!loading && error && (
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

        {!loading && !error && profile && (
          <div
            style={{
              maxWidth: 600,
              margin: '0 auto',
              padding: '0 16px 32px',
              paddingTop: 16,
              paddingBottom: isAndroid
                ? 'calc(32px + env(safe-area-inset-bottom, 24px))'
                : 32,
            }}
          >
            <AvatarCard
              displayName={displayName}
              avatarUrl={profile.avatar_url}
              location={location}
            />

            <NavCard
              title="Edit profile"
              subtitle="Photo, name & location"
              onClick={() => nav('/profile/basics')}
            />

            <NavCard
              title="My Availability"
              subtitle="Mark dates you're unavailable"
              onClick={() => nav('/profile/availability')}
            />

            <NavCard
              title="Support"
              subtitle="Terms, privacy & help"
              onClick={() => nav('/support')}
            />

            <AccountInfoCard email={email} fullName={fullName} />

            <LogoutCard onClick={() => setLogoutAlertOpen(true)} />
          </div>
        )}

        <IonAlert
          isOpen={logoutAlertOpen}
          onDidDismiss={() => setLogoutAlertOpen(false)}
          header="Confirm logout"
          message="Are you sure you want to log out?"
          cssClass="custom-dark-alert"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel',
            },
            {
              text: 'Log out',
              role: 'destructive',
              handler: () => {
                handleConfirmLogout();
              },
            },
          ]}
        />
      </IonContent>
    </IonPage>
  );
}
