/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline, logOutOutline } from 'ionicons/icons';
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
        if (alive) {
          setError('Unable to load session');
          setLoading(false);
        }
        return;
      }

      const user = auth?.user ?? null;
      setAuthUser(user);

      if (!user) {
        if (alive) {
          setProfile(null);
          setError('You are not signed in.');
          setLoading(false);
        }
        return;
      }

      const uid = user.id;

      // Load profile
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
        setLoading(false);
        return;
      }

      setProfile({
        id: uid,
        display_name: data?.display_name ?? null,
        first_name: data?.first_name ?? null,
        last_name: data?.last_name ?? null,
        location: data?.location ?? null,
        avatar_url: data?.avatar_url ?? null,
      });

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
      nav('/login');
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
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
                Profile
              </h1>
              <div
                style={{
                  fontSize: 13,
                  color: '#9ca3af',
                  marginTop: 4,
                }}
              >
                Manage your account settings
              </div>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

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
            <IonSpinner style={{ '--color': '#34d399' }} />
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
            }}
          >
            {/* Avatar Card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: 24,
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                }}
              >
                <div style={{ position: 'relative' }}>
                  {/* Glow effect behind avatar */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: -12,
                      background:
                        'radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 70%)',
                      filter: 'blur(16px)',
                      borderRadius: '50%',
                    }}
                  />
                  <AvatarImageMobile
                    name={displayName}
                    bucket={AVATAR_BUCKET}
                    avatarPath={profile.avatar_url ?? undefined}
                    size={120}
                  />
                </div>

                <div style={{ textAlign: 'center' }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#f9fafb',
                      lineHeight: 1.2,
                    }}
                  >
                    {displayName}
                  </h2>
                  <p
                    style={{
                      margin: '6px 0 0',
                      fontSize: 14,
                      color: '#9ca3af',
                    }}
                  >
                    {location}
                  </p>
                </div>
              </div>
            </div>

            {/* Edit Profile Card */}
            <div
              onClick={() => nav('/profile/basics')}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '20px 24px',
                marginBottom: 16,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(52,211,153,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#f9fafb',
                    lineHeight: 1.3,
                  }}
                >
                  Edit profile
                </h3>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 13,
                    color: '#9ca3af',
                  }}
                >
                  Photo, name & location
                </p>
              </div>
              <IonIcon
                icon={chevronBackOutline}
                style={{
                  fontSize: 20,
                  color: '#6b7280',
                  transform: 'rotate(180deg)',
                }}
              />
            </div>

            {/* Availability Card (nav) */}
            <div
              onClick={() => nav('/profile/availability')}
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '20px 24px',
                marginBottom: 16,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                e.currentTarget.style.borderColor = 'rgba(52,211,153,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
              }}
            >
              <div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: '#f9fafb',
                    lineHeight: 1.3,
                  }}
                >
                  My Availability
                </h3>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 13,
                    color: '#9ca3af',
                  }}
                >
                  Mark dates you're unavailable
                </p>
              </div>
              <IonIcon
                icon={chevronBackOutline}
                style={{
                  fontSize: 20,
                  color: '#6b7280',
                  transform: 'rotate(180deg)',
                }}
              />
            </div>

            {/* Account Info Card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '20px 24px',
                marginBottom: 16,
              }}
            >
              <h3
                style={{
                  margin: '0 0 12px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Account
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>
                    Email:{' '}
                  </span>
                  <span style={{ fontSize: 13, color: '#e5e7eb' }}>
                    {email ?? 'Add your email'}
                  </span>
                </div>
                <div>
                  <span style={{ fontSize: 13, color: '#6b7280' }}>Name: </span>
                  <span style={{ fontSize: 13, color: '#e5e7eb' }}>
                    {fullName}
                  </span>
                </div>
              </div>
            </div>

            {/* Log Out Button Card */}
            <div
              onClick={() => setLogoutAlertOpen(true)}
              style={{
                background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 16,
                padding: '20px 24px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.05)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
              }}
            >
              <span
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#ef4444',
                }}
              >
                Log out
              </span>
              <IonIcon
                icon={logOutOutline}
                style={{ fontSize: 20, color: '#ef4444', opacity: 0.9 }}
              />
            </div>
          </div>
        )}

        {/* Confirm logout dialog */}
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
