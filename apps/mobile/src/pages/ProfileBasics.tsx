/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonText,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import {
  chevronBackOutline,
  locationOutline,
  personOutline,
} from 'ionicons/icons';
import { LuPencil } from 'react-icons/lu';

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

const AVATAR_BUCKET = 'profile-avatars';

function generateAvatarKey(userId: string, ext: string) {
  const anyCrypto: any = (globalThis as any).crypto;
  const id =
    anyCrypto?.randomUUID?.() ||
    `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return `avatars/${userId}/${id}.${ext}`;
}

async function fetchLocationsFromApi(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];
  try {
    const res = await fetch(`/api/locations?q=${encodeURIComponent(q)}`);
    if (!res.ok) return [];
    const data = await res.json();
    const results = (data.results ?? []) as any[];
    return results
      .map((r) => r.name as string)
      .filter((s) => typeof s === 'string' && s.trim().length > 0);
  } catch {
    return [];
  }
}

type LocationAutocompleteProps = {
  value: string;
  editable: boolean;
  onChange: (next: string) => void;
};

function LocationAutocomplete({
  value,
  editable,
  onChange,
}: LocationAutocompleteProps) {
  const [query, setQuery] = React.useState(value);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  const debounceRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    setQuery(value);
  }, [value]);

  const handleChange: React.ComponentProps<typeof IonInput>['onIonChange'] = (
    e
  ) => {
    const next = e.detail.value ?? '';
    setQuery(next);
    onChange(next);

    if (!editable) return;

    if (debounceRef.current !== null) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(async () => {
      if (!next.trim()) {
        setSuggestions([]);
        setOpen(false);
        return;
      }
      setLoading(true);
      const results = await fetchLocationsFromApi(next);
      setSuggestions(results);
      setOpen(results.length > 0);
      setLoading(false);
    }, 250);
  };

  const handleSelect = (city: string) => {
    onChange(city);
    setQuery(city);
    setOpen(false);
  };

  return (
    <div style={{ width: '100%', position: 'relative' }}>
      <IonInput
        value={query}
        placeholder="City, State"
        readonly={!editable}
        onIonChange={handleChange}
        onIonFocus={() => {
          if (editable && suggestions.length > 0) setOpen(true);
        }}
        onIonBlur={() => {
          setTimeout(() => setOpen(false), 120);
        }}
        style={{ fontSize: 15 }}
      />

      {editable && open && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            marginTop: 4,
            borderRadius: 14,
            background:
              'linear-gradient(145deg, rgba(20,15,25,0.98) 0%, rgba(12,8,18,0.98) 100%)',
            border: '1px solid rgba(168,85,247,0.2)',
            boxShadow:
              '0 12px 28px rgba(0,0,0,0.6), 0 0 20px rgba(168,85,247,0.1)',
            zIndex: 50,
            maxHeight: 220,
            overflowY: 'auto',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {suggestions.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSelect(s)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '14px 16px',
                background: 'transparent',
                border: 'none',
                borderBottom:
                  i < suggestions.length - 1
                    ? '1px solid rgba(148,163,184,0.08)'
                    : 'none',
                color: '#e5e7eb',
                fontSize: 14,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(168,85,247,0.1)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {s}
            </button>
          ))}
          {loading && (
            <div
              style={{
                padding: '12px 16px',
                fontSize: 13,
                color: '#a855f7',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <IonSpinner
                name="crescent"
                style={{ width: 14, height: 14, color: '#a855f7' }}
              />
              Searching…
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ProfileBasics() {
  const nav = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);

  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [displayName, setDisplayName] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [authUser, setAuthUser] = React.useState<any | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user ?? null;

      if (!user) {
        if (alive) setError('You are not signed in.');
        setLoading(false);
        return;
      }

      setAuthUser(user);
      const uid = user.id;
      const fallbackName = user.user_metadata?.full_name ?? user.email ?? '';

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

      const row: ProfileRow = {
        id: uid,
        display_name: data?.display_name ?? null,
        first_name: data?.first_name ?? null,
        last_name: data?.last_name ?? null,
        location: data?.location ?? null,
        avatar_url: data?.avatar_url ?? null,
      };

      setProfile(row);
      setDisplayName(
        row.display_name ??
          [row.first_name, row.last_name].filter(Boolean).join(' ') ??
          fallbackName ??
          ''
      );
      setFirstName(row.first_name ?? '');
      setLastName(row.last_name ?? '');
      setLocation(row.location ?? '');
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const computedDisplayName = (() => {
    if (displayName.trim()) return displayName.trim();
    const names = [firstName, lastName]
      .filter(Boolean)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);
    if (names.length) return names.join(' ');
    const metaName = authUser?.user_metadata?.full_name as string | undefined;
    if (metaName && metaName.trim()) return metaName;
    const email = authUser?.email as string | undefined;
    if (email) return email;
    return 'Your profile';
  })();

  const onSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    setError(null);
    setSuccess(null);

    try {
      const payload = {
        display_name: displayName.trim() || null,
        first_name: firstName.trim() || null,
        last_name: lastName.trim() || null,
        location: location.trim() || null,
      };

      const { error: updateErr } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', profile.id);

      if (updateErr) throw updateErr;

      setSuccess('Profile updated');
      setToastMessage('Profile updated successfully');

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              ...payload,
            }
          : prev
      );

      (document.activeElement as HTMLElement | null)?.blur?.();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save changes.');
    } finally {
      setSavingProfile(false);
    }
  };

  const onPickFile = () => {
    fileInputRef.current?.click();
  };

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e
  ) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    setUploadingAvatar(true);
    setError(null);
    setSuccess(null);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData?.session?.user?.id;
      if (!uid) throw new Error('Not signed in');

      if (!file.type.startsWith('image/')) {
        throw new Error('Please choose an image file.');
      }

      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const path = generateAvatarKey(uid, ext);

      const { error: uploadErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadErr) throw uploadErr;

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({
          avatar_url: path,
          updated_at: new Date().toISOString(),
        })
        .eq('id', profile.id);

      if (updateErr) throw updateErr;

      setProfile((prev) =>
        prev
          ? {
              ...prev,
              avatar_url: path,
            }
          : prev
      );

      setToastMessage('Photo updated successfully');

      window.dispatchEvent(
        new CustomEvent('profiles:avatar_changed', {
          detail: { avatar_url: path, isPreview: false },
        })
      );
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to update photo.');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const inputItemStyle = {
    '--background': 'rgba(255,255,255,0.03)',
    '--border-radius': '12px',
    '--padding-start': '16px',
    '--inner-padding-end': '16px',
    '--min-height': '52px',
    border: '1px solid rgba(148,163,184,0.12)',
    borderRadius: '12px',
    marginTop: 8,
  };

  const labelStyle = {
    fontSize: 11,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    color: '#6b7280',
    fontWeight: 600,
    display: 'block',
  };

  return (
    <IonPage>
      <IonHeader translucent>
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
              padding: '12px 16px',
              gap: 8,
            }}
          >
            <IonButton
              onClick={() => nav(-1)}
              fill="clear"
              style={{
                minWidth: 0,
                padding: 4,
                margin: 0,
                flexShrink: 0,
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#F9FAFB', fontSize: 22 }}
              />
            </IonButton>

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#F9FAFB',
                  margin: 0,
                  letterSpacing: '-0.5px',
                }}
              >
                Edit Profile
              </h1>
              <p
                style={{
                  fontSize: 13,
                  color: '#9ca3af',
                  margin: '4px 0 0',
                }}
              >
                Update your information
              </p>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': 'linear-gradient(180deg, #0a0812 0%, #050509 100%)',
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
            <IonSpinner name="dots" style={{ color: '#a855f7' }} />
          </div>
        )}

        {!loading && error && !profile && (
          <div
            style={{
              padding: 16,
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(127,29,29,0.15) 0%, rgba(80,20,20,0.1) 100%)',
                border: '1px solid rgba(248, 113, 113, 0.25)',
                borderRadius: 16,
                padding: 16,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              <IonText>
                <p style={{ margin: 0, fontSize: 14, color: '#fca5a5' }}>
                  {error}
                </p>
              </IonText>
            </div>
          </div>
        )}

        {!loading && profile && (
          <div
            style={{
              padding: 16,
              paddingBottom: 32,
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            {/* Avatar Section */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(168,85,247,0.08) 0%, rgba(139,92,246,0.04) 100%)',
                border: '1px solid rgba(168,85,247,0.2)',
                borderRadius: 24,
                padding: '32px 24px',
                textAlign: 'center',
                marginBottom: 16,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              {/* Avatar with glow */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 20,
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: 130,
                    height: 130,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(168,85,247,0.3) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                />
                <div
                  style={{
                    position: 'relative',
                    padding: 4,
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, rgba(168,85,247,0.4) 0%, rgba(139,92,246,0.2) 100%)',
                  }}
                >
                  <AvatarImageMobile
                    name={computedDisplayName}
                    bucket={AVATAR_BUCKET}
                    avatarPath={profile.avatar_url ?? undefined}
                    size={120}
                  />
                </div>
              </div>

              <p
                style={{
                  margin: '0 0 20px',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#f9fafb',
                  letterSpacing: '-0.3px',
                }}
              >
                {computedDisplayName}
              </p>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFileChange}
              />

              <button
                type="button"
                onClick={onPickFile}
                disabled={uploadingAvatar}
                style={{
                  padding: '12px 24px',
                  borderRadius: 14,
                  background: uploadingAvatar
                    ? 'rgba(168,85,247,0.1)'
                    : 'linear-gradient(135deg, rgba(168,85,247,0.9) 0%, rgba(139,92,246,0.9) 100%)',
                  border: '1px solid rgba(168,85,247,0.4)',
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                  opacity: uploadingAvatar ? 0.7 : 1,
                  boxShadow: uploadingAvatar
                    ? 'none'
                    : '0 4px 14px rgba(168,85,247,0.3)',
                }}
              >
                {uploadingAvatar ? (
                  <>
                    <IonSpinner
                      name="crescent"
                      style={{ width: 16, height: 16 }}
                    />
                    Uploading…
                  </>
                ) : (
                  <>
                    <LuPencil size={16} />
                    Change photo
                  </>
                )}
              </button>

              <p
                style={{
                  marginTop: 16,
                  marginBottom: 0,
                  fontSize: 13,
                  color: '#9ca3af',
                  lineHeight: 1.5,
                }}
              >
                This is how you appear across Amplee
              </p>
            </div>

            {/* Form Fields */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                border: '1px solid rgba(148,163,184,0.12)',
                borderRadius: 24,
                padding: 24,
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
              }}
            >
              {/* Section Header */}
              <div style={{ marginBottom: 20 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 4,
                  }}
                >
                  <IonIcon
                    icon={personOutline}
                    style={{ fontSize: 18, color: '#a855f7' }}
                  />
                  <p
                    style={{
                      margin: 0,
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      color: '#a855f7',
                    }}
                  >
                    Personal Info
                  </p>
                </div>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 13,
                    color: '#9ca3af',
                  }}
                >
                  Your name and how others see you
                </p>
              </div>

              <IonList
                lines="none"
                style={{
                  background: 'transparent',
                }}
              >
                {/* Display name */}
                <div style={{ marginBottom: 16 }}>
                  <IonLabel style={labelStyle}>Display name</IonLabel>
                  <IonItem lines="none" style={inputItemStyle as any}>
                    <IonInput
                      value={displayName}
                      placeholder="How you appear to your band"
                      onIonChange={(e) => setDisplayName(e.detail.value ?? '')}
                      style={{
                        fontSize: 15,
                        '--placeholder-color': 'rgba(156,163,175,0.5)' as any,
                        '--color': '#e5e7eb',
                      }}
                    />
                  </IonItem>
                </div>

                {/* First name */}
                <div style={{ marginBottom: 16 }}>
                  <IonLabel style={labelStyle}>First name</IonLabel>
                  <IonItem lines="none" style={inputItemStyle as any}>
                    <IonInput
                      value={firstName}
                      placeholder="First name"
                      onIonChange={(e) => setFirstName(e.detail.value ?? '')}
                      style={{
                        fontSize: 15,
                        '--placeholder-color': 'rgba(156,163,175,0.5)' as any,
                        '--color': '#e5e7eb',
                      }}
                    />
                  </IonItem>
                </div>

                {/* Last name */}
                <div style={{ marginBottom: 16 }}>
                  <IonLabel style={labelStyle}>Last name</IonLabel>
                  <IonItem lines="none" style={inputItemStyle as any}>
                    <IonInput
                      value={lastName}
                      placeholder="Last name"
                      onIonChange={(e) => setLastName(e.detail.value ?? '')}
                      style={{
                        fontSize: 15,
                        '--placeholder-color': 'rgba(156,163,175,0.5)' as any,
                        '--color': '#e5e7eb',
                      }}
                    />
                  </IonItem>
                </div>

                {/* Location */}
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <IonIcon
                      icon={locationOutline}
                      style={{ fontSize: 14, color: '#6b7280' }}
                    />
                    <IonLabel style={labelStyle}>Location</IonLabel>
                  </div>
                  <IonItem lines="none" style={inputItemStyle as any}>
                    <LocationAutocomplete
                      value={location}
                      onChange={setLocation}
                      editable={true}
                    />
                  </IonItem>
                </div>
              </IonList>

              {/* Error message */}
              {error && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '12px 16px',
                    borderRadius: 12,
                    background:
                      'linear-gradient(135deg, rgba(127,29,29,0.15) 0%, rgba(80,20,20,0.1) 100%)',
                    border: '1px solid rgba(248, 113, 113, 0.25)',
                  }}
                >
                  <p style={{ margin: 0, fontSize: 14, color: '#fca5a5' }}>
                    {error}
                  </p>
                </div>
              )}

              {/* Save button */}
              <button
                type="button"
                disabled={savingProfile}
                onClick={() => {
                  if (!savingProfile) onSaveProfile();
                }}
                style={{
                  width: '100%',
                  marginTop: 24,
                  padding: '14px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(168,85,247,0.4)',
                  background: savingProfile
                    ? 'rgba(168,85,247,0.1)'
                    : 'linear-gradient(135deg, rgba(168,85,247,0.9) 0%, rgba(139,92,246,0.9) 100%)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: savingProfile ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: savingProfile ? 0.7 : 1,
                  boxShadow: savingProfile
                    ? 'none'
                    : '0 4px 14px rgba(168,85,247,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                {savingProfile ? (
                  <>
                    <IonSpinner
                      name="crescent"
                      style={{ width: 18, height: 18 }}
                    />
                    Saving…
                  </>
                ) : (
                  'Save changes'
                )}
              </button>
            </div>
          </div>
        )}
      </IonContent>

      <IonToast
        isOpen={toastMessage !== null}
        message={toastMessage ?? ''}
        duration={2200}
        mode="ios"
        position="bottom"
        onDidDismiss={() => setToastMessage(null)}
        cssClass="amplee-toast-success"
      />
    </IonPage>
  );
}
