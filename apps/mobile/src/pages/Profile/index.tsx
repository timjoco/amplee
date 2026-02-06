import { Capacitor } from '@capacitor/core';
import { IonAlert, IonContent, IonPage, IonSpinner, IonText } from '@ionic/react';
import { useNavigate } from 'react-router-dom';

import AndroidBottomSafeArea from '../../components/AndroidBottomSafeArea';
import { useUserVendor } from '../../hooks/useUserVendor';
import { AccountInfoCard } from './components/AccountInfoCard';
import { AvatarCard } from './components/AvatarCard';
import { LogoutCard } from './components/LogoutCard';
import { NavCard } from './components/NavCard';
import { ProfileHeader } from './components/ProfileHeader';
import { useProfile } from './hooks/useProfile';
import { computeDisplayName } from './utils';

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
  const { vendor, hasVendor } = useUserVendor();

  const displayName = computeDisplayName(profile, authUser);
  const location = profile?.location || 'Add your location';

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
              paddingBottom: isAndroid ? 80 : 32,
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

            {/* Vendor Section */}
            <div style={{ marginTop: 8, marginBottom: 8 }}>
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.4)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                  paddingLeft: 4,
                }}
              >
                Vendor
              </p>
              <NavCard
                title={hasVendor ? 'My Vendor Profile' : 'Become a Vendor'}
                subtitle={
                  hasVendor
                    ? vendor?.is_public
                      ? 'Visible on Discover'
                      : 'Draft - not visible yet'
                    : 'Get discovered by bands'
                }
                onClick={() =>
                  nav(hasVendor ? '/vendor/dashboard' : '/vendor/edit')
                }
              />
            </div>

            <AccountInfoCard />

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
      <AndroidBottomSafeArea />
    </IonPage>
  );
}
