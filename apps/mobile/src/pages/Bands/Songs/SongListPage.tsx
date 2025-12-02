/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSearchbar,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  chevronBackOutline,
  chevronForwardOutline,
  musicalNotesOutline,
} from 'ionicons/icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';

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

// this is the song library
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

  // Long-press haptic state
  const longPressTimeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const [pressedId, setPressedId] = useState<string | null>(null);
  const MOVE_THRESHOLD = 12;

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
      e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
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

  const handlePressMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
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
  }, []);

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

  useEffect(() => {
    if (!bandId) return;

    const loadSongs = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('songs')
        .select('id, band_id, title, default_key, default_bpm, origin')
        .eq('band_id', bandId)
        .order('title', { ascending: true });

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

    void loadSongs();
  }, [bandId]);

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

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <IonButtons slot="start">
            <IonButton
              onClick={onBack}
              style={{ '--color': '#e8e4ecff' } as any}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ fontSize: 20, color: '#ffffffff', marginRight: 2 }}
              />
            </IonButton>
          </IonButtons>
          <IonTitle
            style={{
              color: '#e8e4ecff',
              fontWeight: 700,
              fontSize: 18,
              letterSpacing: 0.25,
            }}
          >
            Songs
          </IonTitle>
          <IonButtons slot="end">
            {onCreateSong && (
              <IonButton
                onClick={onCreateSong}
                style={{ '--color': '#e8e4ecff' } as any}
              >
                <IonIcon icon={addOutline} />
              </IonButton>
            )}
          </IonButtons>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': '#050509',
        }}
      >
        <div style={{ padding: '16px 16px 80px 16px' }}>
          {/* Search Bar */}
          <IonSearchbar
            value={searchText}
            onIonInput={(e) => setSearchText(e.detail.value ?? '')}
            placeholder="Search songs..."
            style={
              {
                '--background': 'rgba(15,23,42,0.98)',
                '--color': '#ffffff',
                '--placeholder-color': 'rgba(148,163,184,0.9)',
                '--icon-color': 'rgba(148,163,184,0.9)',
                '--clear-button-color': 'rgba(148,163,184,0.9)',
                '--border-radius': '12px',
                padding: '0 0 12px 0',
                fontSize: 16,
              } as React.CSSProperties
            }
          />

          {/* Loading State */}
          {loading ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '40px 16px',
              }}
            >
              <IonSpinner
                name="dots"
                style={{ '--color': 'rgba(244, 114, 182, 0.8)' } as any}
              />
              <IonText
                style={{ color: 'rgba(156, 163, 175, 0.9)', fontSize: 14 }}
              >
                Loading songs…
              </IonText>
            </div>
          ) : filteredSongs.length === 0 ? (
            /* Empty State */
            <div
              style={{
                padding: '16px',
                maxWidth: '600px',
                margin: '0 auto',
              }}
            >
              <div
                style={{
                  background: 'transparent',
                  border: '1px solid rgba(244, 114, 182, 0.2)',
                  borderRadius: 20,
                  padding: '32px 24px',
                  textAlign: 'center',
                  marginTop: 24,
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 16,
                    background: 'rgba(244, 114, 182, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 20px',
                    border: '1px solid rgba(244, 114, 182, 0.2)',
                  }}
                >
                  <IonIcon
                    icon={musicalNotesOutline}
                    style={{ fontSize: 32, color: 'rgba(244, 114, 182, 0.9)' }}
                  />
                </div>
                <IonText color="light">
                  <h2
                    style={{
                      margin: '0 0 8px',
                      fontSize: 18,
                      fontWeight: 700,
                      color: 'rgba(241, 245, 249, 0.95)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {searchText ? 'No Songs Found' : 'No Songs Yet'}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      color: 'rgba(148, 163, 184, 0.9)',
                      fontSize: 14,
                      lineHeight: 1.5,
                    }}
                  >
                    {searchText
                      ? 'Try a different search term.'
                      : 'Add your first song to start building your library.'}
                  </p>
                </IonText>

                {!searchText && onCreateSong && (
                  <button
                    type="button"
                    onClick={onCreateSong}
                    style={{
                      marginTop: 24,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 20px',
                      borderRadius: 12,
                      border: '1px solid rgba(244, 114, 182, 0.25)',
                      background: 'rgba(244, 114, 182, 0.1)',
                      color: 'rgba(244, 114, 182, 0.95)',
                      fontSize: 14.5,
                      fontWeight: 700,
                      cursor: 'pointer',
                      transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        'rgba(244, 114, 182, 0.15)';
                      e.currentTarget.style.borderColor =
                        'rgba(244, 114, 182, 0.4)';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        'rgba(244, 114, 182, 0.1)';
                      e.currentTarget.style.borderColor =
                        'rgba(244, 114, 182, 0.25)';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
                    Add your first song
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Song List */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              {filteredSongs.map((song) => {
                const isPressed = pressedId === song.id;

                return (
                  <div
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
                      background: 'transparent',
                      border: '1px solid rgba(244, 114, 182, 0.2)',
                      borderRadius: 16,
                      padding: 14,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      cursor: 'pointer',
                      transform: isPressed ? 'scale(0.99)' : 'scale(1)',
                      opacity: isPressed ? 0.7 : 1,
                      transition: 'all 120ms ease-out',
                    }}
                  >
                    {/* Avatar */}
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(244, 114, 182, 0.1)',
                        border: '1px solid rgba(244, 114, 182, 0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IonIcon
                        icon={musicalNotesOutline}
                        style={{
                          fontSize: 20,
                          color: 'rgba(244, 114, 182, 0.9)',
                        }}
                      />
                    </div>

                    {/* Title + meta */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 6,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: 15,
                            color: 'rgba(241, 245, 249, 0.95)',
                            letterSpacing: '-0.01em',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {song.title}
                        </span>
                      </div>

                      {/* Meta row (key + BPM) */}
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
                              color: 'rgba(148, 163, 184, 0.9)',
                              background: 'rgba(148, 163, 184, 0.1)',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              padding: '2px 8px',
                              borderRadius: 6,
                              whiteSpace: 'nowrap',
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
                              color: 'rgba(148, 163, 184, 0.9)',
                              background: 'rgba(148, 163, 184, 0.1)',
                              border: '1px solid rgba(148, 163, 184, 0.2)',
                              padding: '2px 8px',
                              borderRadius: 6,
                              whiteSpace: 'nowrap',
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
                            padding: '3px 8px',
                            borderRadius: 6,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            whiteSpace: 'nowrap',
                            background:
                              song.origin === 'cover'
                                ? 'rgba(59, 130, 246, 0.1)'
                                : 'rgba(244, 114, 182, 0.1)',
                            border:
                              song.origin === 'cover'
                                ? '1px solid rgba(59, 130, 246, 0.3)'
                                : '1px solid rgba(244, 114, 182, 0.3)',
                            color:
                              song.origin === 'cover'
                                ? 'rgba(96, 165, 250, 0.95)'
                                : 'rgba(244, 114, 182, 0.95)',
                          }}
                        >
                          {song.origin === 'cover' ? 'Cover' : 'Original'}
                        </span>
                      )}

                      <IonIcon
                        icon={chevronForwardOutline}
                        style={{
                          fontSize: 18,
                          color: 'rgba(148, 163, 184, 0.6)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
}
