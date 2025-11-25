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
  IonText,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
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
        style={{ fontSize: 16 }}
      />

      {editable && open && suggestions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '100%',
            marginTop: 4,
            borderRadius: 12,
            background: 'rgba(8,8,12,0.98)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 12px 28px rgba(0,0,0,0.6)',
            zIndex: 50,
            maxHeight: 220,
            overflowY: 'auto',
          }}
        >
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleSelect(s)}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '12px 16px',
                background: 'transparent',
                border: 'none',
                color: '#e5e7eb',
                fontSize: 14,
                cursor: 'pointer',
                transition: 'background 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
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
                padding: '8px 16px',
                fontSize: 12,
                color: '#9ca3af',
              }}
            >
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

      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr) {
        console.error(authErr);
        if (alive) setError('Unable to load session');
        setLoading(false);
        return;
      }

      const user = auth?.user ?? null;
      setAuthUser(user);
      const uid = user?.id;
      const fallbackName = user?.user_metadata?.full_name ?? user?.email ?? '';

      if (!uid) {
        if (alive) setError('You are not signed in.');
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
      setToastMessage('Profile updated');

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
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth?.user?.id;
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

      setSuccess('Photo updated');

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
        scrollY={true}
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
            <IonText color="medium">
              <p>Loading…</p>
            </IonText>
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              padding: 16,
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '16px',
              }}
            >
              <IonText color="danger">
                <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
              </IonText>
            </div>
          </div>
        )}

        {!loading && profile && (
          <div
            style={{
              padding: '16px',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            {/* Avatar Section */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '20px',
                padding: '32px 24px',
                textAlign: 'center',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: '20px',
                }}
              >
                <AvatarImageMobile
                  name={computedDisplayName}
                  bucket={AVATAR_BUCKET}
                  avatarPath={profile.avatar_url ?? undefined}
                  size={120}
                />
              </div>

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
                  marginTop: '20px',
                  padding: '10px 24px',
                  borderRadius: '12px',
                  background: 'rgba(155, 135, 245, 0.15)',
                  border: '1px solid rgba(155, 135, 245, 0.3)',
                  color: '#9b87f5',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: uploadingAvatar ? 'default' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  transition: 'all 0.2s ease',
                  opacity: uploadingAvatar ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!uploadingAvatar) {
                    e.currentTarget.style.background =
                      'rgba(155, 135, 245, 0.2)';
                    e.currentTarget.style.borderColor =
                      'rgba(155, 135, 245, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    'rgba(155, 135, 245, 0.15)';
                  e.currentTarget.style.borderColor =
                    'rgba(155, 135, 245, 0.3)';
                }}
              >
                <LuPencil size={16} />
                {uploadingAvatar ? 'Uploading…' : 'Change photo'}
              </button>

              <p
                style={{
                  marginTop: '16px',
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
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '20px',
                padding: '24px',
              }}
            >
              <IonList
                lines="none"
                style={{
                  background: 'transparent',
                }}
              >
                {/* Display name */}
                <div style={{ marginBottom: 20 }}>
                  <IonLabel
                    style={{
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      color: '#9ca3af',
                      fontWeight: 600,
                      marginBottom: 8,
                      display: 'block',
                    }}
                  >
                    Display name
                  </IonLabel>
                  <IonItem
                    lines="none"
                    style={{
                      '--background': 'rgba(255,255,255,0.04)',
                      '--border-radius': '12px',
                      '--padding-start': '16px',
                      '--inner-padding-end': '16px',
                      '--min-height': '52px',
                    }}
                  >
                    <IonInput
                      value={displayName}
                      placeholder="How you appear to your band"
                      onIonChange={(e) => setDisplayName(e.detail.value ?? '')}
                      style={{
                        fontSize: 16,
                        '--placeholder-color': 'rgba(156,163,175,0.5)' as any,
                        '--color': '#e5e7eb',
                      }}
                    />
                  </IonItem>
                </div>

                {/* First name */}
                <div style={{ marginBottom: 20 }}>
                  <IonLabel
                    style={{
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      color: '#9ca3af',
                      fontWeight: 600,
                      marginBottom: 8,
                      display: 'block',
                    }}
                  >
                    First name
                  </IonLabel>
                  <IonItem
                    lines="none"
                    style={{
                      '--background': 'rgba(255,255,255,0.04)',
                      '--border-radius': '12px',
                      '--padding-start': '16px',
                      '--inner-padding-end': '16px',
                      '--min-height': '52px',
                    }}
                  >
                    <IonInput
                      value={firstName}
                      placeholder="First name"
                      onIonChange={(e) => setFirstName(e.detail.value ?? '')}
                      style={{
                        fontSize: 16,
                        '--placeholder-color': 'rgba(156,163,175,0.5)' as any,
                        '--color': '#e5e7eb',
                      }}
                    />
                  </IonItem>
                </div>

                {/* Last name */}
                <div style={{ marginBottom: 20 }}>
                  <IonLabel
                    style={{
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      color: '#9ca3af',
                      fontWeight: 600,
                      marginBottom: 8,
                      display: 'block',
                    }}
                  >
                    Last name
                  </IonLabel>
                  <IonItem
                    lines="none"
                    style={{
                      '--background': 'rgba(255,255,255,0.04)',
                      '--border-radius': '12px',
                      '--padding-start': '16px',
                      '--inner-padding-end': '16px',
                      '--min-height': '52px',
                    }}
                  >
                    <IonInput
                      value={lastName}
                      placeholder="Last name"
                      onIonChange={(e) => setLastName(e.detail.value ?? '')}
                      style={{
                        fontSize: 16,
                        '--placeholder-color': 'rgba(156,163,175,0.5)' as any,
                        '--color': '#e5e7eb',
                      }}
                    />
                  </IonItem>
                </div>

                {/* Location */}
                <div>
                  <IonLabel
                    style={{
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      color: '#9ca3af',
                      fontWeight: 600,
                      marginBottom: 8,
                      display: 'block',
                    }}
                  >
                    Location
                  </IonLabel>
                  <IonItem
                    lines="none"
                    style={{
                      '--background': 'rgba(255,255,255,0.04)',
                      '--border-radius': '12px',
                      '--padding-start': '16px',
                      '--inner-padding-end': '16px',
                      '--min-height': '52px',
                    }}
                  >
                    <LocationAutocomplete
                      value={location}
                      onChange={setLocation}
                      editable={true}
                    />
                  </IonItem>
                </div>
              </IonList>

              {success && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(155, 135, 245, 0.1)',
                    border: '1px solid rgba(155, 135, 245, 0.3)',
                  }}
                >
                  <IonText style={{ color: '#9b87f5' }}>
                    <p style={{ margin: 0, fontSize: 14 }}>{success}</p>
                  </IonText>
                </div>
              )}

              {error && (
                <div
                  style={{
                    marginTop: 16,
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  <IonText color="danger">
                    <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
                  </IonText>
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
                  padding: '14px',
                  borderRadius: '12px',
                  background: 'rgba(155, 135, 245, 0.15)',
                  border: '1px solid rgba(155, 135, 245, 0.3)',
                  color: '#9b87f5',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: savingProfile ? 'default' : 'pointer',
                  transition: 'all 0.2s ease',
                  opacity: savingProfile ? 0.5 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!savingProfile) {
                    e.currentTarget.style.background =
                      'rgba(155, 135, 245, 0.2)';
                    e.currentTarget.style.borderColor =
                      'rgba(155, 135, 245, 0.5)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    'rgba(155, 135, 245, 0.15)';
                  e.currentTarget.style.borderColor =
                    'rgba(155, 135, 245, 0.3)';
                }}
              >
                {savingProfile ? 'Saving…' : 'Save changes'}
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
        style={{
          '--background': 'rgba(34, 197, 94, 0.95)', // Amplee event green
          '--color': '#ECFDF5',
          '--border-radius': '999px',
          '--box-shadow': '0 18px 40px rgba(0,0,0,0.7)',
          '--padding-start': '16px',
          '--padding-end': '16px',
          '--min-width': '220px',
          textAlign: 'center',
          fontWeight: 600,
          fontSize: 14,
        }}
      />
    </IonPage>
  );
}
