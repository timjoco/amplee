/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import {
  checkmarkOutline,
  chevronBackOutline,
  chevronDownOutline,
  closeOutline,
  musicalNotesOutline,
  personOutline,
  speedometerOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Theme Colors (Pink/Magenta for Library/Songs)
// ─────────────────────────────────────────────────────────────

const PINK = {
  primary: '#ec4899',
  light: '#f472b6',
  lighter: '#f9a8d4',
  glow: 'rgba(236, 72, 153, 0.4)',
  subtle: 'rgba(236, 72, 153, 0.08)',
  border: 'rgba(236, 72, 153, 0.25)',
};

const RED = {
  primary: '#ef4444',
  light: '#f87171',
  subtle: 'rgba(239, 68, 68, 0.08)',
  border: 'rgba(239, 68, 68, 0.25)',
  glow: 'rgba(239, 68, 68, 0.4)',
};

const GREEN = {
  primary: '#22c55e',
  light: '#4ade80',
  subtle: 'rgba(34, 197, 94, 0.08)',
  border: 'rgba(34, 197, 94, 0.25)',
  glow: 'rgba(34, 197, 94, 0.4)',
};

// ─────────────────────────────────────────────────────────────
// Shared Styles
// ─────────────────────────────────────────────────────────────

const glassCard = {
  background: 'rgba(255, 255, 255, 0.02)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 16,
};

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type SongOrigin = 'original' | 'cover';

type SongFormData = {
  title: string;
  default_key: string;
  default_bpm: string;
  duration: string;
  origin: SongOrigin;
  original_artist: string;
};

type SongEditPageProps = {
  bandId: string;
  songId?: string; // If provided, we're editing; otherwise creating
  onBack: () => void;
  onSaved?: (songId: string) => void;
  onDeleted?: () => void;
};

// ─────────────────────────────────────────────────────────────
// Musical Keys
// ─────────────────────────────────────────────────────────────

const MUSICAL_KEYS = [
  'C',
  'C#',
  'Db',
  'D',
  'D#',
  'Eb',
  'E',
  'F',
  'F#',
  'Gb',
  'G',
  'G#',
  'Ab',
  'A',
  'A#',
  'Bb',
  'B',
  'Cm',
  'C#m',
  'Dbm',
  'Dm',
  'D#m',
  'Ebm',
  'Em',
  'Fm',
  'F#m',
  'Gbm',
  'Gm',
  'G#m',
  'Abm',
  'Am',
  'A#m',
  'Bbm',
  'Bm',
];

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function SongEditPage({
  bandId,
  songId,
  onBack,
  onSaved,
  onDeleted,
}: SongEditPageProps) {
  const isEditing = Boolean(songId);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<SongFormData>({
    title: '',
    default_key: '',
    default_bpm: '',
    duration: '',
    origin: 'original',
    original_artist: '',
  });

  // Delete confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Key picker
  const [showKeyPicker, setShowKeyPicker] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('[haptic error]', e);
    }
  }, []);

  const updateField = <K extends keyof SongFormData>(
    field: K,
    value: SongFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(null);
  };

  // Parse duration string (mm:ss) to seconds
  const parseDuration = (str: string): number | null => {
    if (!str.trim()) return null;

    // Handle just seconds
    if (!str.includes(':')) {
      const secs = parseInt(str, 10);
      return isNaN(secs) ? null : secs;
    }

    const parts = str.split(':');
    if (parts.length !== 2) return null;

    const mins = parseInt(parts[0], 10);
    const secs = parseInt(parts[1], 10);

    if (isNaN(mins) || isNaN(secs)) return null;
    return mins * 60 + secs;
  };

  // Format seconds to mm:ss
  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ─────────────────────────────────────────────────────────────
  // Load existing song
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!songId) return;

    let alive = true;

    const loadSong = async () => {
      setLoading(true);
      setError(null);

      const { data, error: loadError } = await supabase
        .from('songs')
        .select('*')
        .eq('id', songId)
        .maybeSingle();

      if (!alive) return;

      if (loadError) {
        console.error('[SongEditPage] load error', loadError);
        setError('Failed to load song');
        setLoading(false);
        return;
      }

      if (!data) {
        setError('Song not found');
        setLoading(false);
        return;
      }

      setFormData({
        title: data.title || '',
        default_key: data.default_key || '',
        default_bpm: data.default_bpm?.toString() || '',
        duration: data.duration ? formatDuration(data.duration) : '',
        origin: data.origin || 'original',
        original_artist: data.original_artist || '',
      });

      setLoading(false);
    };

    void loadSong();

    return () => {
      alive = false;
    };
  }, [songId]);

  // ─────────────────────────────────────────────────────────────
  // Save
  // ─────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Song title is required');
      return;
    }

    setSaving(true);
    setError(null);
    triggerHaptic();

    try {
      const bpm = formData.default_bpm.trim()
        ? parseInt(formData.default_bpm, 10)
        : null;
      const duration = parseDuration(formData.duration);

      const payload = {
        band_id: bandId,
        title: formData.title.trim(),
        default_key: formData.default_key || null,
        default_bpm: isNaN(bpm as number) ? null : bpm,
        duration,
        origin: formData.origin,
        original_artist:
          formData.origin === 'cover'
            ? formData.original_artist.trim() || null
            : null,
      };

      if (isEditing && songId) {
        // Update
        const { error: updateError } = await supabase
          .from('songs')
          .update(payload)
          .eq('id', songId);

        if (updateError) throw updateError;

        onSaved?.(songId);
      } else {
        // Create
        const { data, error: createError } = await supabase
          .from('songs')
          .insert(payload)
          .select('id')
          .single();

        if (createError) throw createError;

        onSaved?.(data.id);
      }

      onBack();
    } catch (e: any) {
      console.error('[SongEditPage] save error', e);
      setError(e?.message || 'Failed to save song');
    } finally {
      setSaving(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Delete
  // ─────────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!songId) return;

    setDeleting(true);
    triggerHaptic();

    try {
      const { error: deleteError } = await supabase
        .from('songs')
        .delete()
        .eq('id', songId);

      if (deleteError) throw deleteError;

      onDeleted?.();
      onBack();
    } catch (e: any) {
      console.error('[SongEditPage] delete error', e);
      setError(e?.message || 'Failed to delete song');
      setShowDeleteConfirm(false);
    } finally {
      setDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Loading State
  // ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <IonPage>
        <IonContent
          fullscreen
          style={{
            '--background': 'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
          }}
        >
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
              gap: 12,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <IonSpinner
                style={{
                  '--color': PINK.primary,
                  width: 32,
                  height: 32,
                }}
              />
              <div
                style={{
                  color: '#6b7280',
                  fontSize: 13,
                  marginTop: 12,
                }}
              >
                Loading song...
              </div>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <IonPage>
      <IonHeader translucent className="ion-no-border">
        <IonToolbar
          style={{
            '--background': 'rgba(8, 8, 14, 0.95)',
            '--border-width': 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              gap: 12,
            }}
          >
            {/* Back Button */}
            <button
              onClick={onBack}
              disabled={saving}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                placeItems: 'center',
                color: '#9ca3af',
                flexShrink: 0,
                opacity: saving ? 0.5 : 1,
              }}
            >
              <IonIcon icon={chevronBackOutline} style={{ fontSize: 20 }} />
            </button>

            {/* Title */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon
                  icon={musicalNotesOutline}
                  style={{ color: PINK.light, fontSize: 20 }}
                />
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#f9fafb',
                    margin: 0,
                    letterSpacing: '-0.5px',
                  }}
                >
                  {isEditing ? 'Edit Song' : 'New Song'}
                </h1>
              </div>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={saving || !formData.title.trim()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 16px',
                borderRadius: 10,
                background:
                  saving || !formData.title.trim()
                    ? 'rgba(255, 255, 255, 0.04)'
                    : GREEN.primary,
                border: 'none',
                color: saving || !formData.title.trim() ? '#6b7280' : '#fff',
                fontSize: 14,
                fontWeight: 600,
                boxShadow:
                  saving || !formData.title.trim()
                    ? 'none'
                    : `0 4px 12px ${GREEN.glow}`,
              }}
            >
              {saving ? (
                <IonSpinner
                  style={{ '--color': '#fff', width: 16, height: 16 }}
                />
              ) : (
                <IonIcon icon={checkmarkOutline} style={{ fontSize: 18 }} />
              )}
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
        }}
      >
        <div
          style={{
            padding: 16,
            paddingBottom: 100,
            maxWidth: 600,
            margin: '0 auto',
          }}
        >
          {/* Error Banner */}
          {error && (
            <div
              style={{
                ...glassCard,
                background: RED.subtle,
                border: `1px solid ${RED.border}`,
                padding: 14,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <IonIcon
                icon={closeOutline}
                style={{ color: RED.light, fontSize: 18 }}
              />
              <span style={{ color: RED.light, fontSize: 14, flex: 1 }}>
                {error}
              </span>
              <button
                onClick={() => setError(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#9ca3af',
                  padding: 4,
                }}
              >
                <IonIcon icon={closeOutline} style={{ fontSize: 16 }} />
              </button>
            </div>
          )}

          {/* Title Input */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Song Title <span style={{ color: PINK.light }}>*</span>
            </label>
            <input
              value={formData.title}
              onChange={(e) => updateField('title', e.target.value)}
              placeholder="Enter song title"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${
                  formData.title ? PINK.border : 'rgba(255, 255, 255, 0.08)'
                }`,
                color: '#f9fafb',
                fontSize: 16,
                outline: 'none',
              }}
            />
          </div>

          {/* Origin Toggle */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'block',
                marginBottom: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Type
            </label>
            <div
              style={{
                display: 'flex',
                gap: 10,
              }}
            >
              <button
                onClick={() => updateField('origin', 'original')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background:
                    formData.origin === 'original'
                      ? PINK.subtle
                      : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${
                    formData.origin === 'original'
                      ? PINK.border
                      : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  color:
                    formData.origin === 'original' ? PINK.light : '#9ca3af',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Original
              </button>
              <button
                onClick={() => updateField('origin', 'cover')}
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: 12,
                  background:
                    formData.origin === 'cover'
                      ? 'rgba(59, 130, 246, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)',
                  border: `1px solid ${
                    formData.origin === 'cover'
                      ? 'rgba(59, 130, 246, 0.25)'
                      : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  color: formData.origin === 'cover' ? '#60a5fa' : '#9ca3af',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Cover
              </button>
            </div>
          </div>

          {/* Original Artist (for covers) */}
          {formData.origin === 'cover' && (
            <div style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <IonIcon icon={personOutline} style={{ fontSize: 14 }} />
                Original Artist
              </label>
              <input
                value={formData.original_artist}
                onChange={(e) => updateField('original_artist', e.target.value)}
                placeholder="Who originally performed this song?"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    formData.original_artist
                      ? 'rgba(59, 130, 246, 0.25)'
                      : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  color: '#f9fafb',
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>
          )}

          {/* Key & BPM Row */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 20,
            }}
          >
            {/* Key */}
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <IonIcon icon={musicalNotesOutline} style={{ fontSize: 14 }} />
                Key
              </label>
              <button
                onClick={() => setShowKeyPicker(true)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    formData.default_key
                      ? PINK.border
                      : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  color: formData.default_key ? '#f9fafb' : '#6b7280',
                  fontSize: 15,
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span>{formData.default_key || 'Select key'}</span>
                <IonIcon
                  icon={chevronDownOutline}
                  style={{ fontSize: 16, color: '#6b7280' }}
                />
              </button>
            </div>

            {/* BPM */}
            <div style={{ flex: 1 }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                <IonIcon icon={speedometerOutline} style={{ fontSize: 14 }} />
                BPM
              </label>
              <input
                type="number"
                inputMode="numeric"
                value={formData.default_bpm}
                onChange={(e) => updateField('default_bpm', e.target.value)}
                placeholder="120"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    formData.default_bpm
                      ? PINK.border
                      : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  color: '#f9fafb',
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          {/* Duration */}
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginBottom: 8,
                fontSize: 12,
                fontWeight: 600,
                color: '#9ca3af',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              <IonIcon icon={timeOutline} style={{ fontSize: 14 }} />
              Duration
            </label>
            <input
              value={formData.duration}
              onChange={(e) => updateField('duration', e.target.value)}
              placeholder="3:45"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${
                  formData.duration ? PINK.border : 'rgba(255, 255, 255, 0.08)'
                }`,
                color: '#f9fafb',
                fontSize: 15,
                outline: 'none',
              }}
            />
            <p
              style={{
                margin: '6px 0 0',
                fontSize: 12,
                color: '#4b5563',
              }}
            >
              Format: minutes:seconds (e.g. 3:45)
            </p>
          </div>

          {/* Delete Button (Edit mode only) */}
          {isEditing && (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: '14px 20px',
                borderRadius: 12,
                background: RED.subtle,
                border: `1px solid ${RED.border}`,
                color: RED.light,
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              <IonIcon icon={trashOutline} style={{ fontSize: 18 }} />
              Delete Song
            </button>
          )}
        </div>

        {/* Key Picker Modal */}
        <IonModal
          isOpen={showKeyPicker}
          onDidDismiss={() => setShowKeyPicker(false)}
          initialBreakpoint={0.6}
          breakpoints={[0, 0.6, 0.9]}
        >
          <IonContent
            style={{
              '--background':
                'linear-gradient(180deg, #0c0a14 0%, #08080e 100%)',
            }}
          >
            <div style={{ padding: 20 }}>
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 20,
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#f9fafb',
                  }}
                >
                  Select Key
                </h3>
                <button
                  onClick={() => setShowKeyPicker(false)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#9ca3af',
                  }}
                >
                  <IonIcon icon={closeOutline} style={{ fontSize: 18 }} />
                </button>
              </div>

              {/* Clear option */}
              <button
                onClick={() => {
                  updateField('default_key', '');
                  setShowKeyPicker(false);
                }}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  marginBottom: 12,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  color: '#9ca3af',
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: 'center',
                }}
              >
                No key specified
              </button>

              {/* Major Keys */}
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#6b7280',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Major
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  {MUSICAL_KEYS.filter((k) => !k.includes('m')).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        updateField('default_key', key);
                        setShowKeyPicker(false);
                        triggerHaptic();
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background:
                          formData.default_key === key
                            ? PINK.subtle
                            : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${
                          formData.default_key === key
                            ? PINK.border
                            : 'rgba(255, 255, 255, 0.08)'
                        }`,
                        color:
                          formData.default_key === key ? PINK.light : '#e5e7eb',
                        fontSize: 14,
                        fontWeight: 600,
                        minWidth: 48,
                      }}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minor Keys */}
              <div>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 600,
                    color: '#6b7280',
                    marginBottom: 8,
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Minor
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 8,
                  }}
                >
                  {MUSICAL_KEYS.filter((k) => k.includes('m')).map((key) => (
                    <button
                      key={key}
                      onClick={() => {
                        updateField('default_key', key);
                        setShowKeyPicker(false);
                        triggerHaptic();
                      }}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 10,
                        background:
                          formData.default_key === key
                            ? PINK.subtle
                            : 'rgba(255, 255, 255, 0.02)',
                        border: `1px solid ${
                          formData.default_key === key
                            ? PINK.border
                            : 'rgba(255, 255, 255, 0.08)'
                        }`,
                        color:
                          formData.default_key === key ? PINK.light : '#e5e7eb',
                        fontSize: 14,
                        fontWeight: 600,
                        minWidth: 48,
                      }}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Delete Confirmation Modal */}
        <IonModal
          isOpen={showDeleteConfirm}
          onDidDismiss={() => !deleting && setShowDeleteConfirm(false)}
        >
          <IonContent
            style={{
              '--background': 'rgba(8, 8, 14, 0.98)',
            }}
          >
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 24,
              }}
            >
              <div
                style={{
                  width: '100%',
                  maxWidth: 380,
                  ...glassCard,
                  border: `1px solid ${RED.border}`,
                  padding: 24,
                  boxShadow: `0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px ${RED.glow}`,
                }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 14,
                    background: RED.subtle,
                    border: `1px solid ${RED.border}`,
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <IonIcon
                    icon={trashOutline}
                    style={{ fontSize: 26, color: RED.light }}
                  />
                </div>

                <h3
                  style={{
                    margin: 0,
                    marginBottom: 8,
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#f9fafb',
                    textAlign: 'center',
                  }}
                >
                  Delete Song?
                </h3>
                <p
                  style={{
                    margin: 0,
                    marginBottom: 24,
                    fontSize: 14,
                    color: '#6b7280',
                    lineHeight: 1.5,
                    textAlign: 'center',
                  }}
                >
                  This will permanently delete "{formData.title}" and all its
                  recordings and notes. This can't be undone.
                </p>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    disabled={deleting}
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#e5e7eb',
                      fontSize: 15,
                      fontWeight: 600,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    disabled={deleting}
                    onClick={handleDelete}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: RED.primary,
                      border: 'none',
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 600,
                      opacity: deleting ? 0.7 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                    }}
                  >
                    {deleting ? (
                      <>
                        <IonSpinner
                          style={{ '--color': '#fff', width: 16, height: 16 }}
                        />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </IonContent>
        </IonModal>
      </IonContent>
    </IonPage>
  );
}
