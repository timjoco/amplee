/* eslint-disable @typescript-eslint/no-explicit-any */
import logo from '@amplee/assets/logo.png';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { atOutline, locationOutline, personOutline } from 'ionicons/icons';
import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function useQuery() {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
}

export default function OnboardingPageMobile() {
  const nav = useNavigate();
  const qs = useQuery();
  const next = qs.get('next') ?? '/home';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const {
          data: { user },
          error: uErr,
        } = await supabase.auth.getUser();
        if (uErr) throw uErr;
        if (!user) {
          if (active) {
            nav(`/login?next=${encodeURIComponent('/onboarding')}`, {
              replace: true,
            });
          }
          return;
        }

        if (!active) return;

        setUserId(user.id);

        try {
          const { error: rpcErr } = await supabase.rpc('ensure_profile');
          if (rpcErr && rpcErr.code !== '42883') {
            console.warn('[ensure_profile] RPC error:', rpcErr.message);
          }
        } catch (e) {
          console.warn('[ensure_profile] call failed:', e);
        }

        const { data: profile, error: pErr } = await supabase
          .from('profiles')
          .select('first_name, last_name, display_name, location, onboarded')
          .eq('id', user.id)
          .maybeSingle();

        if (pErr) throw pErr;

        if (profile?.onboarded === true) {
          if (active) {
            nav(next, { replace: true });
          }
          return;
        }

        if (profile?.first_name) {
          setFirstName(profile.first_name);
        } else if (user.email) {
          setFirstName(user.email.split('@')[0]);
        }

        if (profile?.last_name) setLastName(profile.last_name);
        if (profile?.display_name) setDisplayName(profile.display_name);
        if (profile?.location) setLocation(profile.location);
      } catch (e: any) {
        if (active) {
          setError(e?.message || 'Failed to load profile');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [nav, next]);

  // Auto-generate display name suggestion when first/last name changes
  useEffect(() => {
    if (!displayName && (firstName || lastName)) {
      const suggested = [firstName, lastName]
        .filter(Boolean)
        .map((n) => n.trim())
        .join(' ');
      // Only suggest, don't override if user has typed something
      if (suggested && !displayName) {
        // We don't auto-set, let user choose
      }
    }
  }, [firstName, lastName, displayName]);

  const handleSubmit = async () => {
    if (!userId) return;
    if (!firstName.trim()) {
      setError('Please enter your first name.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Generate display name if not provided
      const finalDisplayName =
        displayName.trim() ||
        [firstName, lastName]
          .filter(Boolean)
          .map((n) => n.trim())
          .join(' ');

      const { error: upErr } = await supabase.from('profiles').upsert(
        {
          id: userId,
          first_name: firstName.trim(),
          last_name: lastName.trim() || null,
          display_name: finalDisplayName || null,
          location: location.trim() || null,
          onboarded: true,
        },
        { onConflict: 'id' }
      );
      if (upErr) throw upErr;

      nav(next, { replace: true });
    } catch (e: any) {
      setError(e?.message || 'Failed to complete onboarding');
    } finally {
      setSaving(false);
    }
  };

  const isBusy = loading || saving;

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '14px 16px',
    paddingLeft: 44,
    borderRadius: 12,
    border: '1px solid rgba(139, 92, 246, 0.3)',
    background: 'rgba(15, 10, 30, 0.8)',
    color: '#e5e7eb',
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };

  const inputFocusStyle = {
    borderColor: 'rgba(139, 92, 246, 0.6)',
    boxShadow: '0 0 0 3px rgba(139, 92, 246, 0.15)',
  };

  return (
    <IonPage>
      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': 'transparent',
        }}
      >
        {/* Starry Background */}
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background:
              'radial-gradient(ellipse at 50% 0%, #1a0a2e 0%, #0f0720 40%, #050509 100%)',
            zIndex: -2,
          }}
        />
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundImage: `
              radial-gradient(1px 1px at 20% 30%, rgba(255,255,255,0.8) 0%, transparent 100%),
              radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.6) 0%, transparent 100%),
              radial-gradient(1px 1px at 60% 20%, rgba(255,255,255,0.7) 0%, transparent 100%),
              radial-gradient(1px 1px at 80% 50%, rgba(255,255,255,0.5) 0%, transparent 100%),
              radial-gradient(1.5px 1.5px at 10% 80%, rgba(139,92,246,0.8) 0%, transparent 100%),
              radial-gradient(1.5px 1.5px at 70% 90%, rgba(168,85,247,0.7) 0%, transparent 100%),
              radial-gradient(1px 1px at 30% 50%, rgba(255,255,255,0.6) 0%, transparent 100%),
              radial-gradient(1px 1px at 90% 10%, rgba(255,255,255,0.5) 0%, transparent 100%),
              radial-gradient(1px 1px at 50% 60%, rgba(255,255,255,0.4) 0%, transparent 100%),
              radial-gradient(1.5px 1.5px at 25% 15%, rgba(139,92,246,0.6) 0%, transparent 100%),
              radial-gradient(1px 1px at 85% 75%, rgba(255,255,255,0.5) 0%, transparent 100%),
              radial-gradient(1px 1px at 15% 45%, rgba(255,255,255,0.6) 0%, transparent 100%),
              radial-gradient(1.5px 1.5px at 95% 35%, rgba(168,85,247,0.5) 0%, transparent 100%),
              radial-gradient(1px 1px at 5% 65%, rgba(255,255,255,0.4) 0%, transparent 100%),
              radial-gradient(1px 1px at 45% 85%, rgba(255,255,255,0.5) 0%, transparent 100%)
            `,
            zIndex: -1,
          }}
        />

        <div
          style={{
            minHeight: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px 24px',
          }}
        >
          <div style={{ maxWidth: 400, margin: '0 auto', width: '100%' }}>
            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 32 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 96,
                  height: 96,
                  borderRadius: 24,
                  marginBottom: 20,
                  boxShadow: '0 12px 32px rgba(147, 51, 234, 0.4)',
                  background: 'rgba(137, 35, 232, 0.15)',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(147, 51, 234, 0.3)',
                }}
              >
                <img
                  src={logo}
                  alt="Amplee"
                  style={{
                    width: 64,
                    height: 64,
                    objectFit: 'contain',
                    filter: 'drop-shadow(0 4px 12px rgba(147, 51, 234, 0.5))',
                  }}
                />
              </div>
              <h1
                style={{
                  margin: 0,
                  fontSize: 32,
                  fontWeight: 800,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.2,
                }}
              >
                <div style={{ color: '#ffffff' }}>WELCOME TO</div>
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, #c084fc 0%, #9333ea 50%, #7c3aed 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    marginTop: 4,
                  }}
                >
                  AMPLEE
                </div>
              </h1>
              <p
                style={{
                  margin: '12px 0 0',
                  fontSize: 15,
                  color: 'rgba(255,255,255,0.6)',
                  lineHeight: 1.5,
                }}
              >
                Let's set up your profile so your bandmates can find you
              </p>
            </div>

            {loading ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 16,
                  padding: 48,
                }}
              >
                <IonSpinner
                  name="crescent"
                  style={{ color: 'rgba(168, 85, 247, 0.95)' }}
                />
                <IonText
                  style={{ color: 'rgba(255,255,255,0.6)', fontSize: 14 }}
                >
                  Loading your profile…
                </IonText>
              </div>
            ) : (
              <>
                {error && (
                  <div
                    style={{
                      marginBottom: 20,
                      padding: 14,
                      borderRadius: 12,
                      background:
                        'linear-gradient(135deg, rgba(127, 29, 29, 0.3), rgba(127, 29, 29, 0.2))',
                      border: '1px solid rgba(248, 113, 113, 0.5)',
                      color: '#fecaca',
                      fontSize: 14,
                      textAlign: 'center',
                    }}
                  >
                    {error}
                  </div>
                )}

                {/* Form Card */}
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(15, 10, 30, 0.9), rgba(15, 10, 30, 0.7))',
                    border: '1px solid rgba(139, 92, 246, 0.25)',
                    borderRadius: 20,
                    padding: 24,
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 18,
                    }}
                  >
                    {/* Name Row */}
                    <div style={{ display: 'flex', gap: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            display: 'block',
                            marginBottom: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.7)',
                          }}
                        >
                          First name *
                        </label>
                        <div style={{ position: 'relative' }}>
                          <IonIcon
                            icon={personOutline}
                            style={{
                              position: 'absolute',
                              left: 14,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              fontSize: 18,
                              color: 'rgba(139, 92, 246, 0.7)',
                              pointerEvents: 'none',
                            }}
                          />
                          <input
                            type="text"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            placeholder="Alex"
                            style={inputStyle}
                            onFocus={(e) =>
                              Object.assign(e.target.style, inputFocusStyle)
                            }
                            onBlur={(e) => {
                              e.target.style.borderColor =
                                'rgba(139, 92, 246, 0.3)';
                              e.target.style.boxShadow = 'none';
                            }}
                          />
                        </div>
                      </div>

                      <div style={{ flex: 1 }}>
                        <label
                          style={{
                            display: 'block',
                            marginBottom: 8,
                            fontSize: 13,
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.7)',
                          }}
                        >
                          Last name
                        </label>
                        <input
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          placeholder="Smith"
                          style={{ ...inputStyle, paddingLeft: 16 }}
                          onFocus={(e) =>
                            Object.assign(e.target.style, inputFocusStyle)
                          }
                          onBlur={(e) => {
                            e.target.style.borderColor =
                              'rgba(139, 92, 246, 0.3)';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>

                    {/* Display Name */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        Display name{' '}
                        <span style={{ opacity: 0.5 }}>
                          (how others see you)
                        </span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <IonIcon
                          icon={atOutline}
                          style={{
                            position: 'absolute',
                            left: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: 18,
                            color: 'rgba(139, 92, 246, 0.7)',
                            pointerEvents: 'none',
                          }}
                        />
                        <input
                          type="text"
                          value={displayName}
                          onChange={(e) => setDisplayName(e.target.value)}
                          placeholder={
                            firstName || lastName
                              ? [firstName, lastName].filter(Boolean).join(' ')
                              : 'Stage name, nickname, etc.'
                          }
                          style={inputStyle}
                          onFocus={(e) =>
                            Object.assign(e.target.style, inputFocusStyle)
                          }
                          onBlur={(e) => {
                            e.target.style.borderColor =
                              'rgba(139, 92, 246, 0.3)';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                      <p
                        style={{
                          margin: '6px 0 0',
                          fontSize: 12,
                          color: 'rgba(255,255,255,0.4)',
                        }}
                      >
                        Leave blank to use your full name
                      </p>
                    </div>

                    {/* Location */}
                    <div>
                      <label
                        style={{
                          display: 'block',
                          marginBottom: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          color: 'rgba(255,255,255,0.7)',
                        }}
                      >
                        Location{' '}
                        <span style={{ opacity: 0.5 }}>(optional)</span>
                      </label>
                      <div style={{ position: 'relative' }}>
                        <IonIcon
                          icon={locationOutline}
                          style={{
                            position: 'absolute',
                            left: 14,
                            top: '50%',
                            transform: 'translateY(-50%)',
                            fontSize: 18,
                            color: 'rgba(139, 92, 246, 0.7)',
                            pointerEvents: 'none',
                          }}
                        />
                        <input
                          type="text"
                          value={location}
                          onChange={(e) => setLocation(e.target.value)}
                          placeholder="Kansas City, MO"
                          style={inputStyle}
                          onFocus={(e) =>
                            Object.assign(e.target.style, inputFocusStyle)
                          }
                          onBlur={(e) => {
                            e.target.style.borderColor =
                              'rgba(139, 92, 246, 0.3)';
                            e.target.style.boxShadow = 'none';
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <IonButton
                  expand="block"
                  onClick={handleSubmit}
                  disabled={isBusy || !firstName.trim()}
                  style={
                    {
                      marginTop: 24,
                      '--background':
                        'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                      '--background-hover':
                        'linear-gradient(135deg, #9333ea 0%, #a855f7 100%)',
                      '--background-activated':
                        'linear-gradient(135deg, #7c3aed 0%, #9333ea 100%)',
                      '--border-radius': '14px',
                      '--box-shadow': '0 8px 24px rgba(139, 92, 246, 0.4)',
                      '--padding-top': '16px',
                      '--padding-bottom': '16px',
                      fontSize: 16,
                      fontWeight: 700,
                      textTransform: 'none',
                      letterSpacing: '0.3px',
                    } as any
                  }
                >
                  {saving ? (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <IonSpinner
                        name="crescent"
                        style={{ width: 20, height: 20 }}
                      />
                      Setting up…
                    </span>
                  ) : (
                    "Let's go!"
                  )}
                </IonButton>

                <p
                  style={{
                    marginTop: 16,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.4)',
                    textAlign: 'center',
                  }}
                >
                  You can always update this later in settings
                </p>
              </>
            )}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
