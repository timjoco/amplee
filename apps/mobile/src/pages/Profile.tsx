// src/pages/Profile.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonAlert,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { logOutOutline } from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarImageMobile from '../components/ui/AvatarImageMobile';
import { supabase } from '../lib/supabase';

type ProfileRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  location: string | null;
  avatar_url: string | null;
};

function computeDisplayName(
  row: ProfileRow | null,
  authUser: any | null
): string {
  const metaName = authUser?.user_metadata?.full_name as string | undefined;
  const email = authUser?.email as string | undefined;

  if (row?.display_name && row.display_name.trim()) return row.display_name;
  const parts = [row?.first_name, row?.last_name]
    .filter(Boolean)
    .map((p) => p!.trim())
    .filter((p) => p.length > 0);
  if (parts.length) return parts.join(' ');
  if (metaName && metaName.trim()) return metaName;
  if (email) return email;
  return 'Your profile';
}

const AVATAR_BUCKET = 'profile-avatars';

export default function Profile() {
  const nav = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [authUser, setAuthUser] = React.useState<any | null>(null);

  const [logoutAlertOpen, setLogoutAlertOpen] = React.useState(false);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        console.error(authErr);
        if (alive) setError('Unable to load session');
        setLoading(false);
        return;
      }

      const user = auth?.user ?? null;
      const uid = user?.id;
      setAuthUser(user);

      if (!uid) {
        if (alive) {
          setProfile(null);
          setError('You are not signed in.');
        }
        setLoading(false);
        return;
      }

      const { data, error: profErr } = await supabase
        .from('profiles')
        .select(
          `
          id,
          display_name,
          first_name,
          last_name,
          location,
          avatar_url
        `
        )
        .eq('id', uid)
        .maybeSingle();

      if (!alive) return;

      if (profErr) {
        console.error(profErr);
        setError('Unable to load profile.');
      } else {
        setProfile({
          id: uid,
          display_name: data?.display_name ?? null,
          first_name: data?.first_name ?? null,
          last_name: data?.last_name ?? null,
          location: data?.location ?? null,
          avatar_url: data?.avatar_url ?? null,
        });
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const displayName = computeDisplayName(profile, authUser);
  const location = profile?.location || 'Add your location';
  const email = authUser?.email as string | undefined;
  const fullName =
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    'Add your name';

  const handleConfirmLogout = async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      // Session hook will flip, but we also navigate to make it snappy
      nav('/login');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen className="ion-padding">
        {loading && (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
            }}
          >
            <IonSpinner />
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              gap: 8,
              height: '100%',
            }}
          >
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        )}

        {!loading && !error && profile && (
          <>
            {/* Top avatar + basics */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                marginBottom: 24,
              }}
            >
              <AvatarImageMobile
                name={displayName}
                bucket={AVATAR_BUCKET}
                avatarPath={profile.avatar_url ?? undefined}
                size={96}
              />

              <div style={{ textAlign: 'center' }}>
                <IonText>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 700,
                    }}
                  >
                    {displayName}
                  </h2>
                </IonText>
                <IonText color="medium">
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 14,
                    }}
                  >
                    {location}
                  </p>
                </IonText>
              </div>
            </div>

            {/* Edit profile */}
            <IonList inset>
              <IonItem button detail onClick={() => nav('/profile/basics')}>
                <IonLabel>
                  <h2>Edit profile</h2>
                  <p>Photo, name & location</p>
                </IonLabel>
              </IonItem>
            </IonList>

            {/* Account info */}
            <IonList inset>
              <IonItem lines="none">
                <IonLabel>
                  <h2>Account</h2>
                  <IonText color="medium">
                    <p style={{ margin: '4px 0 0', fontSize: 13 }}>
                      Email: {email ?? 'Add your email'}
                    </p>
                    <p style={{ margin: '2px 0 0', fontSize: 13 }}>
                      Name: {fullName}
                    </p>
                  </IonText>
                </IonLabel>
              </IonItem>
            </IonList>

            {/* Log out button */}
            <IonList inset>
              <IonItem
                button
                detail={false}
                lines="none"
                onClick={() => setLogoutAlertOpen(true)}
              >
                <IonLabel>
                  <IonText color="danger">
                    <strong>Log out</strong>
                  </IonText>
                </IonLabel>
                <IonIcon
                  icon={logOutOutline}
                  slot="end"
                  color="danger"
                  style={{ fontSize: 20, opacity: 0.9 }}
                />
              </IonItem>
            </IonList>
          </>
        )}

        {/* Confirm logout dialog */}
        <IonAlert
          isOpen={logoutAlertOpen}
          onDidDismiss={() => setLogoutAlertOpen(false)}
          header="Confirm logout"
          message="Are you sure you want to log out?"
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
