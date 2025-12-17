/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  chevronBackOutline,
  chevronForwardOutline,
  musicalNotesOutline,
  personOutline,
  searchOutline,
  shieldCheckmarkOutline,
} from 'ionicons/icons';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { supabase } from '../../../lib/supabase';

// ─────────────────────────────────────────────────────────────
// Theme Colors (Pink/Magenta for Library/Songs)
// ─────────────────────────────────────────────────────────────

const PINK = {
  primary: '#ec4899',
  primaryHover: '#db2777',
  light: '#f472b6',
  lighter: '#f9a8d4',
  dark: '#be185d',
  glow: 'rgba(236, 72, 153, 0.4)',
  subtle: 'rgba(236, 72, 153, 0.08)',
  border: 'rgba(236, 72, 153, 0.25)',
};

const BLUE = {
  light: '#60a5fa',
  subtle: 'rgba(59, 130, 246, 0.08)',
  border: 'rgba(59, 130, 246, 0.25)',
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

type SongRow = {
  id: string;
  band_id: string;
  title: string;
  default_key: string | null;
  default_bpm: number | null;
  origin: SongOrigin;
};

type SongListPageProps = {
  bandId: string;
  onBack: () => void;
  onOpenSong: (songId: string) => void;
  onCreateSong?: () => void;
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function SongListPage({
  bandId,
  onBack,
  onOpenSong,
  onCreateSong,
}: SongListPageProps) {
  const [loading, setLoading] = useState(true);
  const [songs, setSongs] = useState<SongRow[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<SongRow[]>([]);
  const [searchText, setSearchText] = useState('');
  const [bandName, setBandName] = useState('');

  // User permissions
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [myRole, setMyRole] = useState<string | null>(null);

  // Long-press haptic state
  const longPressTimeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const MOVE_THRESHOLD = 12;

  const isAdmin = useMemo(() => myRole === 'admin', [myRole]);

  // ─────────────────────────────────────────────────────────────
  // Haptic Handlers
  // ─────────────────────────────────────────────────────────────

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('[song list haptic error]', e);
    }
  }, []);

  const handlePressStart = useCallback(
    (
      id: string,
      e:
        | React.TouchEvent<HTMLButtonElement>
        | React.MouseEvent<HTMLButtonElement>
    ) => {
      if (longPressTimeoutRef.current != null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }

      let clientX = 0,
        clientY = 0;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      pressStartRef.current = { x: clientX, y: clientY };
      longPressTimeoutRef.current = window.setTimeout(() => {
        setPressedId(id);
        void triggerHaptic();
      }, 350);
    },
    [triggerHaptic]
  );

  const handlePressMove = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      if (!pressStartRef.current || longPressTimeoutRef.current == null) return;
      if (e.touches.length !== 1) return;

      const { x, y } = pressStartRef.current;
      const t = e.touches[0];
      if (
        Math.abs(t.clientX - x) > MOVE_THRESHOLD ||
        Math.abs(t.clientY - y) > MOVE_THRESHOLD
      ) {
        window.clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    },
    []
  );

  const handlePressEnd = useCallback(() => {
    if (longPressTimeoutRef.current != null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    pressStartRef.current = null;
    if (pressedId != null) {
      setTimeout(() => setPressedId(null), 130);
    }
  }, [pressedId]);

  // ─────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────

  // Get current user
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!alive) return;
      setMyUserId(data.user?.id ?? null);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Get band info, user role, and songs
  useEffect(() => {
    if (!bandId) return;

    let alive = true;

    const loadData = async () => {
      setLoading(true);

      // Get band name
      const { data: band } = await supabase
        .from('bands')
        .select('name')
        .eq('id', bandId)
        .maybeSingle();

      if (!alive) return;
      if (band) setBandName(band.name ?? '');

      // Get user's role
      if (myUserId) {
        const { data: membership } = await supabase
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', myUserId)
          .maybeSingle();

        if (!alive) return;
        setMyRole(membership?.role ?? null);
      }

      // Get songs
      const { data, error } = await supabase
        .from('songs')
        .select('id, band_id, title, default_key, default_bpm, origin')
        .eq('band_id', bandId)
        .order('title', { ascending: true });

      if (!alive) return;

      if (error) {
        console.error('[SongListPage] loadSongs error', error.message);
        setSongs([]);
        setFilteredSongs([]);
      } else {
        const rows = (data ?? []) as SongRow[];
        setSongs(rows);
        setFilteredSongs(rows);
      }
      setLoading(false);
    };

    void loadData();

    return () => {
      alive = false;
    };
  }, [bandId, myUserId]);

  // Filter songs by search
  useEffect(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) {
      setFilteredSongs(songs);
    } else {
      setFilteredSongs(
        songs.filter((song) => (song.title ?? '').toLowerCase().includes(q))
      );
    }
  }, [searchText, songs]);

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
              }}
            >
              <IonIcon icon={chevronBackOutline} style={{ fontSize: 20 }} />
            </button>

            {/* Title Section */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon
                  icon={musicalNotesOutline}
                  style={{ color: PINK.light, fontSize: 20 }}
                />
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#f9fafb',
                    margin: 0,
                    letterSpacing: '-0.5px',
                  }}
                >
                  Songs
                </h1>
              </div>
              {bandName && (
                <div
                  style={{
                    fontSize: 13,
                    color: '#6b7280',
                    marginTop: 2,
                    marginLeft: 28,
                  }}
                >
                  {bandName}
                </div>
              )}
            </div>

            {/* Role Badge */}
            {myUserId && myRole && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '6px 10px',
                  borderRadius: 10,
                  background: isAdmin
                    ? PINK.subtle
                    : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    isAdmin ? PINK.border : 'rgba(255, 255, 255, 0.08)'
                  }`,
                }}
              >
                <IonIcon
                  icon={isAdmin ? shieldCheckmarkOutline : personOutline}
                  style={{
                    fontSize: 14,
                    color: isAdmin ? PINK.light : '#6b7280',
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isAdmin ? PINK.light : '#6b7280',
                  }}
                >
                  {isAdmin ? 'Admin' : 'Member'}
                </span>
              </div>
            )}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
        }}
      >
        {loading ? (
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
                Loading songs...
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 16,
              maxWidth: 600,
              margin: '0 auto',
              paddingBottom: 80,
            }}
          >
            {/* Search Bar */}
            <div
              style={{
                position: 'relative',
                marginBottom: 16,
              }}
            >
              <IonIcon
                icon={searchOutline}
                style={{
                  position: 'absolute',
                  left: 14,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  fontSize: 18,
                  color: '#6b7280',
                  zIndex: 1,
                }}
              />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search songs..."
                style={{
                  width: '100%',
                  padding: '14px 16px 14px 44px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    searchText ? PINK.border : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  color: '#f9fafb',
                  fontSize: 15,
                  outline: 'none',
                }}
              />
            </div>

            {/* Section Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: PINK.primary,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  {searchText ? 'Search Results' : 'Your Library'}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  {filteredSongs.length}
                </span>
              </div>
            </div>

            {/* Non-admin notice */}
            {!isAdmin && myRole && !searchText && (
              <div
                style={{
                  ...glassCard,
                  padding: 12,
                  marginBottom: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <IonIcon
                  icon={shieldCheckmarkOutline}
                  style={{ color: '#6b7280', fontSize: 16 }}
                />
                <span style={{ color: '#6b7280', fontSize: 13 }}>
                  Only band admins can add or edit songs
                </span>
              </div>
            )}

            {/* Empty State */}
            {filteredSongs.length === 0 ? (
              <div
                style={{
                  ...glassCard,
                  border: `1px solid ${PINK.border}`,
                  padding: 32,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: PINK.subtle,
                    border: `1px solid ${PINK.border}`,
                    display: 'grid',
                    placeItems: 'center',
                    margin: '0 auto 16px',
                  }}
                >
                  <IonIcon
                    icon={musicalNotesOutline}
                    style={{ fontSize: 28, color: PINK.light }}
                  />
                </div>
                <h3
                  style={{
                    margin: 0,
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#e5e7eb',
                    marginBottom: 8,
                  }}
                >
                  {searchText ? 'No Songs Found' : 'No Songs Yet'}
                </h3>
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#6b7280',
                    lineHeight: 1.5,
                    marginBottom:
                      isAdmin && !searchText && onCreateSong ? 20 : 0,
                  }}
                >
                  {searchText
                    ? 'Try a different search term.'
                    : isAdmin
                    ? 'Add your first song to start building your library.'
                    : 'No songs have been added yet. Ask a band admin to add some.'}
                </p>

                {isAdmin && !searchText && onCreateSong && (
                  <button
                    onClick={onCreateSong}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 20px',
                      borderRadius: 12,
                      background: PINK.primary,
                      border: 'none',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      boxShadow: `0 4px 14px ${PINK.glow}`,
                    }}
                  >
                    <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
                    Add your first song
                  </button>
                )}
              </div>
            ) : (
              /* Song List */
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {filteredSongs.map((song) => {
                  const isPressed = pressedId === song.id;

                  return (
                    <button
                      key={song.id}
                      onClick={() => onOpenSong(song.id)}
                      onTouchStart={(ev) => handlePressStart(song.id, ev)}
                      onTouchMove={handlePressMove}
                      onTouchEnd={handlePressEnd}
                      onTouchCancel={handlePressEnd}
                      onMouseDown={(ev) => handlePressStart(song.id, ev)}
                      onMouseUp={handlePressEnd}
                      onMouseLeave={handlePressEnd}
                      style={{
                        ...glassCard,
                        width: '100%',
                        padding: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        textAlign: 'left',
                        color: 'inherit',
                        border: `1px solid ${PINK.border}`,
                        transform: isPressed ? 'scale(0.98)' : 'scale(1)',
                        opacity: isPressed ? 0.8 : 1,
                        transition: 'all 120ms ease-out',
                      }}
                    >
                      {/* Icon */}
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          background: PINK.subtle,
                          border: `1px solid ${PINK.border}`,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IonIcon
                          icon={musicalNotesOutline}
                          style={{ fontSize: 22, color: PINK.light }}
                        />
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 600,
                            fontSize: 16,
                            color: '#f9fafb',
                            letterSpacing: '-0.2px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            marginBottom: 6,
                          }}
                        >
                          {song.title}
                        </div>

                        {/* Meta row */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 6,
                            flexWrap: 'wrap',
                          }}
                        >
                          {song.default_key && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#9ca3af',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                padding: '2px 8px',
                                borderRadius: 6,
                              }}
                            >
                              {song.default_key}
                            </span>
                          )}

                          {song.default_bpm != null && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 600,
                                color: '#9ca3af',
                                background: 'rgba(255, 255, 255, 0.04)',
                                border: '1px solid rgba(255, 255, 255, 0.08)',
                                padding: '2px 8px',
                                borderRadius: 6,
                              }}
                            >
                              {song.default_bpm} BPM
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Origin pill + chevron */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexShrink: 0,
                        }}
                      >
                        {song.origin && (
                          <span
                            style={{
                              fontSize: 10,
                              fontWeight: 700,
                              padding: '4px 8px',
                              borderRadius: 6,
                              textTransform: 'uppercase',
                              letterSpacing: '0.5px',
                              background:
                                song.origin === 'cover'
                                  ? BLUE.subtle
                                  : PINK.subtle,
                              border: `1px solid ${
                                song.origin === 'cover'
                                  ? BLUE.border
                                  : PINK.border
                              }`,
                              color:
                                song.origin === 'cover'
                                  ? BLUE.light
                                  : PINK.light,
                            }}
                          >
                            {song.origin === 'cover' ? 'Cover' : 'Original'}
                          </span>
                        )}

                        <IonIcon
                          icon={chevronForwardOutline}
                          style={{
                            fontSize: 18,
                            color: '#4b5563',
                          }}
                        />
                      </div>
                    </button>
                  );
                })}

                {/* Add More Button (Admin Only) */}
                {isAdmin && onCreateSong && !searchText && songs.length > 0 && (
                  <button
                    onClick={onCreateSong}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: '12px 16px',
                      marginTop: 4,
                      borderRadius: 12,
                      background: 'transparent',
                      border: `1px dashed ${PINK.border}`,
                      color: PINK.light,
                      fontSize: 14,
                      fontWeight: 600,
                    }}
                  >
                    <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
                    Add another song
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
