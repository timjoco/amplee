import {
  IonAlert,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import {
  chevronBackOutline,
  mailOutline,
  personOutline,
  trashOutline,
  warningOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AccountManagement() {
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [email, setEmail] = React.useState<string | null>(null);
  const [fullName, setFullName] = React.useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [showFinalConfirm, setShowFinalConfirm] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (!alive) return;

      if (authErr || !auth?.user) {
        setError('Unable to load account information.');
        setLoading(false);
        return;
      }

      setEmail(auth.user.email ?? null);

      // Get profile for name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, first_name, last_name')
        .eq('id', auth.user.id)
        .maybeSingle();

      if (!alive) return;

      // Compute full name from first + last, fallback to display_name
      const nameParts = [profile?.first_name, profile?.last_name]
        .filter(Boolean)
        .join(' ');
      setFullName(nameParts || profile?.display_name || null);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setError(null);

    try {
      // Call the delete account edge function
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error('No active session');
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error('Delete account response:', data);
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Failed to delete account';
        throw new Error(errorMsg);
      }

      // Sign out and redirect to login
      // Use scope: 'local' to clear local session without API call (user is already deleted)
      try {
        await supabase.auth.signOut({ scope: 'local' });
      } catch {
        // Ignore errors, user is already deleted
      }

      // Force navigation to login
      nav('/login', { replace: true });
    } catch (err) {
      console.error('Delete account error:', err);
      // If user_not_found, the delete was successful
      const errorMessage = err instanceof Error ? err.message : String(err);
      if (errorMessage.includes('user_not_found')) {
        nav('/login', { replace: true });
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to delete account');
      setDeleting(false);
      setShowFinalConfirm(false);
    }
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
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
              style={{ minWidth: 0, padding: 6, margin: 0 }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#9ca3af', fontSize: 22 }}
              />
            </IonButton>
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#F9FAFB',
                  margin: 0,
                }}
              >
                Account
              </h1>
              <div style={{ fontSize: 13, color: '#949ba4', marginTop: 2 }}>
                Your account details
              </div>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={
          {
            '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
            '--padding-bottom': 'calc(env(safe-area-inset-bottom) + 24px)',
          } as React.CSSProperties
        }
      >
        {loading && (
          <div
            style={{ display: 'grid', placeItems: 'center', height: '60vh' }}
          >
            <IonSpinner style={{ '--color': '#a78bfa' }} />
          </div>
        )}

        {!loading && (
          <div
            style={{
              maxWidth: 600,
              margin: '0 auto',
              padding: '16px 16px 32px',
            }}
          >
            {/* Account Information */}
            <div style={{ marginBottom: 24 }}>
              <h2
                style={{
                  margin: '0 0 12px 4px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Account Information
              </h2>

              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  overflow: 'hidden',
                }}
              >
                {/* Email */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '18px 20px',
                    borderBottom: '1px solid rgba(255,255,255,0.04)',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(139,92,246,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IonIcon
                      icon={mailOutline}
                      style={{ fontSize: 20, color: '#A78BFA' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#6b7280',
                        marginBottom: 2,
                      }}
                    >
                      Email
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: '#e5e7eb',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {email ?? 'No email'}
                    </div>
                  </div>
                </div>

                {/* Name */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    padding: '18px 20px',
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(139,92,246,0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IonIcon
                      icon={personOutline}
                      style={{ fontSize: 20, color: '#A78BFA' }}
                    />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#6b7280',
                        marginBottom: 2,
                      }}
                    >
                      Name
                    </div>
                    <div
                      style={{
                        fontSize: 15,
                        color: '#e5e7eb',
                      }}
                    >
                      {fullName ?? 'Not set'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div>
              <h2
                style={{
                  margin: '0 0 12px 4px',
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#ef4444',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Danger Zone
              </h2>

              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.05)',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <IonIcon
                    icon={warningOutline}
                    style={{
                      fontSize: 20,
                      color: '#f87171',
                      flexShrink: 0,
                      marginTop: 2,
                    }}
                  />
                  <div>
                    <h3
                      style={{
                        margin: '0 0 6px',
                        fontSize: 15,
                        fontWeight: 600,
                        color: '#fca5a5',
                      }}
                    >
                      Delete Account
                    </h3>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: '#9ca3af',
                        lineHeight: 1.5,
                      }}
                    >
                      Permanently delete your account and all associated data.
                      This action cannot be undone.
                    </p>
                  </div>
                </div>

                {error && (
                  <div
                    style={{
                      padding: '12px 16px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      borderRadius: 10,
                      marginBottom: 16,
                    }}
                  >
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color: '#fca5a5',
                      }}
                    >
                      {error}
                    </p>
                  </div>
                )}

                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={deleting}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '14px 20px',
                    background: 'rgba(239, 68, 68, 0.15)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    borderRadius: 12,
                    fontSize: 15,
                    fontWeight: 600,
                    color: '#f87171',
                    cursor: deleting ? 'not-allowed' : 'pointer',
                    opacity: deleting ? 0.5 : 1,
                    transition: 'all 0.15s ease',
                  }}
                >
                  <IonIcon icon={trashOutline} style={{ fontSize: 18 }} />
                  {deleting ? 'Deleting...' : 'Delete My Account'}
                </button>
              </div>
            </div>
          </div>
        )}
      </IonContent>

      {/* First confirmation */}
      <IonAlert
        isOpen={showDeleteConfirm}
        onDidDismiss={() => setShowDeleteConfirm(false)}
        header="Delete Account?"
        message="Are you sure you want to delete your account? You will lose access to all your bands, events, and data."
        cssClass="custom-dark-alert"
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Continue',
            handler: () => {
              setShowDeleteConfirm(false);
              setShowFinalConfirm(true);
            },
          },
        ]}
      />

      {/* Final confirmation */}
      <IonAlert
        isOpen={showFinalConfirm}
        onDidDismiss={() => !deleting && setShowFinalConfirm(false)}
        header="Final Confirmation"
        message="This will permanently delete your account. This action CANNOT be undone."
        cssClass="custom-dark-alert"
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Delete Forever',
            cssClass: 'alert-button-danger',
            handler: () => {
              handleDeleteAccount();
              return false; // Don't dismiss until complete
            },
          },
        ]}
      />
    </IonPage>
  );
}
