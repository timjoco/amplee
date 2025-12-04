/* eslint-disable @typescript-eslint/no-explicit-any */
import {
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
import {
  checkmarkCircle,
  chevronBackOutline,
  locationOutline,
  personOutline,
} from 'ionicons/icons';
import { LuPencil } from 'react-icons/lu';

import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import AvatarImageMobile from '../components/ui/AvatarImageMobile';

import { supabase } from '../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type ProfileRow = {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  location: string | null;
  avatar_url: string | null;
};

const AVATAR_BUCKET = 'profile-avatars';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// Location Autocomplete Component
// ─────────────────────────────────────────────────────────────

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value ?? '';
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
      <input
        type="text"
        value={query}
        placeholder="City, State"
        readOnly={!editable}
        onChange={handleChange}
        onFocus={() => {
          if (editable && suggestions.length > 0) setOpen(true);
        }}
        onBlur={() => {
          setTimeout(() => setOpen(false), 120);
        }}
        style={{
          width: '100%',
          padding: '14px 16px',
          fontSize: 15,
          color: '#e5e7eb',
          background: 'rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: 12,
          outline: 'none',
          fontFamily: 'inherit',
          transition: 'border-color 0.2s ease',
        }}
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

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function ProfileBasics() {
  const nav = useNavigate();
  const [loading, setLoading] = React.useState(true);
  const [savingProfile, setSavingProfile] = React.useState(false);
  const [saveSuccess, setSaveSuccess] = React.useState(false);
  const [uploadingAvatar, setUploadingAvatar] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [profile, setProfile] = React.useState<ProfileRow | null>(null);
  const [displayName, setDisplayName] = React.useState('');
  const [firstName, setFirstName] = React.useState('');
  const [lastName, setLastName] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [authUser, setAuthUser] = React.useState<any | null>(null);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // ─────────────────────────────────────────────────────────────
  // Load profile on mount
  // ─────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────
  // Computed display name
  // ─────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────
  // Save profile handler
  // ─────────────────────────────────────────────────────────────

  const onSaveProfile = async () => {
    if (!profile) return;
    setSavingProfile(true);
    setError(null);
    setSaveSuccess(false);

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

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
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

  // ─────────────────────────────────────────────────────────────
  // Avatar upload handlers
  // ─────────────────────────────────────────────────────────────

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

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <IonPage>
      {/* ─── Header ─── */}
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
        }}
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
            {/* ─── Avatar Card ─── */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '28px 24px',
                marginTop: 16,
                textAlign: 'center',
              }}
            >
              {/* Avatar with glow */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  marginBottom: 16,
                  position: 'relative',
                }}
              >
                {/* Glow effect */}
                <div
                  style={{
                    position: 'absolute',
                    width: 130,
                    height: 130,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                />
                {/* Avatar ring */}
                <div
                  style={{
                    position: 'relative',
                    padding: 3,
                    borderRadius: '50%',
                    background:
                      'linear-gradient(135deg, rgba(139, 92, 246, 0.5) 0%, rgba(168, 85, 247, 0.3) 100%)',
                  }}
                >
                  <AvatarImageMobile
                    name={computedDisplayName}
                    bucket={AVATAR_BUCKET}
                    avatarPath={profile.avatar_url ?? undefined}
                    size={110}
                  />
                </div>
              </div>

              {/* Display name */}
              <p
                style={{
                  margin: '0 0 16px',
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#f9fafb',
                  letterSpacing: '-0.3px',
                }}
              >
                {computedDisplayName}
              </p>

              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={onFileChange}
              />

              {/* Change photo button */}
              <button
                type="button"
                onClick={onPickFile}
                disabled={uploadingAvatar}
                style={{
                  padding: '10px 20px',
                  borderRadius: 10,
                  background: uploadingAvatar
                    ? 'rgba(139, 92, 246, 0.2)'
                    : 'rgba(139, 92, 246, 0.15)',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  color: '#c4b5fd',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                  opacity: uploadingAvatar ? 0.7 : 1,
                }}
              >
                {uploadingAvatar ? (
                  <>
                    <IonSpinner
                      name="crescent"
                      style={{ width: 14, height: 14 }}
                    />
                    Uploading…
                  </>
                ) : (
                  <>
                    <LuPencil size={14} />
                    Change photo
                  </>
                )}
              </button>

              <p
                style={{
                  marginTop: 14,
                  marginBottom: 0,
                  fontSize: 11,
                  color: 'rgba(255, 255, 255, 0.35)',
                }}
              >
                This is how you appear across Amplee
              </p>
            </div>

            {/* ─── Personal Info Card ─── */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '20px 24px',
                marginTop: 12,
              }}
            >
              {/* Section header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 11,
                  fontWeight: 600,
                  color: 'rgba(255, 255, 255, 0.5)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  marginBottom: 16,
                }}
              >
                <IonIcon icon={personOutline} style={{ fontSize: 14 }} />
                <span>Personal Info</span>
              </div>

              {/* Display name */}
              <div style={{ marginBottom: 14 }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 6,
                  }}
                >
                  Display name
                </label>
                <input
                  type="text"
                  value={displayName}
                  placeholder="How you appear to your band"
                  onChange={(e) => setDisplayName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    fontSize: 15,
                    color: '#e5e7eb',
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 12,
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s ease',
                  }}
                />
              </div>

              {/* First & Last name row */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 6,
                    }}
                  >
                    First name
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    placeholder="First"
                    onChange={(e) => setFirstName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: 15,
                      color: '#e5e7eb',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 12,
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s ease',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: 11,
                      fontWeight: 600,
                      color: 'rgba(255, 255, 255, 0.5)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      marginBottom: 6,
                    }}
                  >
                    Last name
                  </label>
                  <input
                    type="text"
                    value={lastName}
                    placeholder="Last"
                    onChange={(e) => setLastName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      fontSize: 15,
                      color: '#e5e7eb',
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 12,
                      outline: 'none',
                      fontFamily: 'inherit',
                      transition: 'border-color 0.2s ease',
                    }}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 11,
                    fontWeight: 600,
                    color: 'rgba(255, 255, 255, 0.5)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    marginBottom: 6,
                  }}
                >
                  <IonIcon icon={locationOutline} style={{ fontSize: 12 }} />
                  Location
                </label>
                <LocationAutocomplete
                  value={location}
                  onChange={setLocation}
                  editable={true}
                />
              </div>
            </div>

            {/* ─── Error Message ─── */}
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

            {/* ─── Save Button ─── */}
            <button
              type="button"
              onClick={onSaveProfile}
              disabled={savingProfile}
              style={{
                width: '100%',
                marginTop: 20,
                padding: '14px 20px',
                borderRadius: 12,
                border: 'none',
                fontSize: 15,
                fontWeight: 700,
                cursor: savingProfile ? 'default' : 'pointer',
                transition: 'all 0.3s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: saveSuccess
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : savingProfile
                  ? 'rgba(139, 92, 246, 0.4)'
                  : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
                color: '#fff',
                boxShadow: saveSuccess
                  ? '0 4px 20px rgba(16, 185, 129, 0.4)'
                  : savingProfile
                  ? 'none'
                  : '0 4px 20px rgba(139, 92, 246, 0.4)',
              }}
            >
              {savingProfile ? (
                <>
                  <IonSpinner
                    style={{
                      '--color': '#fff',
                      width: 18,
                      height: 18,
                    }}
                  />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <IonIcon icon={checkmarkCircle} style={{ fontSize: 20 }} />
                  <span>Saved!</span>
                </>
              ) : (
                <span>Save changes</span>
              )}
            </button>
          </div>
        )}
      </IonContent>

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
    </IonPage>
  );
}
