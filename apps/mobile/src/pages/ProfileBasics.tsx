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
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { chevronBack } from 'ionicons/icons';
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

  // Keep local query in sync when value changes externally
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
            borderRadius: 10,
            background: 'rgba(5,6,14,0.98)',
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
                padding: '8px 12px',
                background: 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: 14,
                cursor: 'pointer',
              }}
            >
              {s}
            </button>
          ))}
          {loading && (
            <div
              style={{
                padding: '6px 12px',
                fontSize: 12,
                opacity: 0.8,
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

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Load profile
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
      <IonHeader>
        <IonToolbar>
          <IonButton
            slot="start"
            fill="clear"
            onClick={() => nav(-1)}
            color="#a855f7"
          >
            <IonIcon icon={chevronBack} />
          </IonButton>
          <IonTitle>Edit Profile</IonTitle>
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
              gap: 8,
              paddingTop: 24,
            }}
          >
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        )}

        {!loading && profile && (
          <>
            {/* Avatar + change button */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 12,
                marginTop: 16,
                marginBottom: 24,
              }}
            >
              <AvatarImageMobile
                name={computedDisplayName}
                bucket={AVATAR_BUCKET}
                avatarPath={profile.avatar_url ?? undefined}
                size={110}
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFileChange}
              />

              <IonButton
                size="small"
                onClick={onPickFile}
                disabled={uploadingAvatar}
              >
                <LuPencil size={18} style={{ marginRight: 6 }} />
                {uploadingAvatar ? 'Uploading…' : 'Change photo'}
              </IonButton>
            </div>

            <IonText
              color="medium"
              style={{
                display: 'block',
                textAlign: 'center',
                paddingBottom: 16,
                paddingTop: 4,
              }}
            >
              <p
                style={{
                  marginTop: 0,
                  marginBottom: 0,
                  fontSize: 14,
                  lineHeight: '18px',
                }}
              >
                Update how you appear across Amplee.
              </p>
            </IonText>

            {/* Name + location fields (protected per-field) */}
            <IonList
              inset
              lines="none"
              style={{
                marginTop: 8,
              }}
            >
              {/* Display name */}
              <IonItem
                lines="none"
                style={{
                  '--background': 'rgba(14,15,23,0.98)',
                  '--border-radius': '14px',
                  '--padding-start': '12px',
                  '--inner-padding-end': '12px',
                }}
              >
                <div style={{ width: '100%' }}>
                  <IonLabel
                    position="stacked"
                    style={{
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      color: 'rgba(255,255,255,0.6)',
                      marginBottom: 4,
                    }}
                  >
                    Display name
                  </IonLabel>
                  <IonInput
                    value={displayName}
                    placeholder="How you appear to your band"
                    onIonChange={(e) => setDisplayName(e.detail.value ?? '')}
                    style={{
                      fontSize: 16,
                      '--placeholder-color': 'rgba(255,255,255,0.35)',
                    }}
                  />
                </div>
              </IonItem>

              {/* 🔹 Black sliver divider */}
              <div
                style={{
                  height: 4,
                  background: 'rgba(0,0,0,0.9)',
                  borderRadius: 999,
                  margin: '8px 6px',
                }}
              />

              {/* First name */}
              <IonItem
                lines="none"
                style={{
                  '--background': 'rgba(14,15,23,0.98)',
                  '--border-radius': '14px',
                  '--padding-start': '12px',
                  '--inner-padding-end': '12px',
                }}
              >
                <div style={{ width: '100%' }}>
                  <IonLabel
                    position="stacked"
                    style={{
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      color: 'rgba(255,255,255,0.6)',
                      marginBottom: 4,
                    }}
                  >
                    First name
                  </IonLabel>
                  <IonInput
                    value={firstName}
                    placeholder="First name"
                    onIonChange={(e) => setFirstName(e.detail.value ?? '')}
                    style={{
                      fontSize: 16,
                      '--placeholder-color': 'rgba(255,255,255,0.35)',
                    }}
                  />
                </div>
              </IonItem>

              {/* 🔹 Divider */}
              <div
                style={{
                  height: 4,
                  background: 'rgba(0,0,0,0.9)',
                  borderRadius: 999,
                  margin: '8px 6px',
                }}
              />

              {/* Last name */}
              <IonItem
                lines="none"
                style={{
                  '--background': 'rgba(14,15,23,0.98)',
                  '--border-radius': '14px',
                  '--padding-start': '12px',
                  '--inner-padding-end': '12px',
                }}
              >
                <div style={{ width: '100%' }}>
                  <IonLabel
                    position="stacked"
                    style={{
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      color: 'rgba(255,255,255,0.6)',
                      marginBottom: 4,
                    }}
                  >
                    Last name
                  </IonLabel>
                  <IonInput
                    value={lastName}
                    placeholder="Last name"
                    onIonChange={(e) => setLastName(e.detail.value ?? '')}
                    style={{
                      fontSize: 16,
                      '--placeholder-color': 'rgba(255,255,255,0.35)',
                    }}
                  />
                </div>
              </IonItem>

              {/* 🔹 Divider */}
              <div
                style={{
                  height: 4,
                  background: 'rgba(0,0,0,0.9)',
                  borderRadius: 999,
                  margin: '8px 6px',
                }}
              />

              {/* Location */}
              <IonItem
                lines="none"
                style={{
                  '--background': 'rgba(14,15,23,0.98)',
                  '--border-radius': '14px',
                  '--padding-start': '12px',
                  '--inner-padding-end': '12px',
                }}
              >
                <div style={{ width: '100%' }}>
                  <IonLabel
                    position="stacked"
                    style={{
                      fontSize: 12,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                      color: 'rgba(255,255,255,0.6)',
                      marginBottom: 4,
                    }}
                  >
                    Location
                  </IonLabel>
                  <LocationAutocomplete
                    value={location}
                    onChange={setLocation}
                    editable={true}
                  />
                </div>
              </IonItem>
            </IonList>
            {success && (
              <IonText color="success">
                <p style={{ marginTop: 12 }}>{success}</p>
              </IonText>
            )}

            {/* Save changes as list-sized row */}
            <IonList inset>
              <IonItem
                button
                detail={false}
                lines="none"
                onClick={() => {
                  if (!savingProfile) onSaveProfile();
                }}
                style={{
                  opacity: savingProfile ? 0.6 : 1,
                }}
              >
                <IonLabel className="ion-text-center">
                  <IonText color="primary">
                    <strong>
                      {savingProfile ? 'Saving…' : 'Save changes'}
                    </strong>
                  </IonText>
                </IonLabel>
              </IonItem>
            </IonList>
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
