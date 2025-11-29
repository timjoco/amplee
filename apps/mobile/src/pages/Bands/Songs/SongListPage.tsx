/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonButtons,
  IonCard,
  IonCardContent,
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
import React, { useEffect, useState } from 'react';
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
            Song library
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
                fontSize: 16, // prevent mobile zoom
              } as React.CSSProperties
            }
          />

          {loading ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 200,
              }}
            >
              <IonSpinner color="light" />
            </div>
          ) : filteredSongs.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 300,
                textAlign: 'center',
                padding: 24,
              }}
            >
              <IonIcon
                icon={musicalNotesOutline}
                style={{
                  fontSize: 64,
                  color: '#27272f',
                  marginBottom: 16,
                }}
              />
              <IonText color="medium">
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 500,
                    marginBottom: 8,
                    color: '#e5e7eb',
                  }}
                >
                  {searchText ? 'No songs found' : 'Your library is empty'}
                </h2>
                <p style={{ fontSize: 14, color: '#9ca3af' }}>
                  {searchText
                    ? 'Try a different search term.'
                    : 'Add your first song to get started.'}
                </p>
              </IonText>
              {!searchText && onCreateSong && (
                <IonButton
                  onClick={onCreateSong}
                  style={
                    {
                      marginTop: 16,
                      '--background': 'rgba(244, 114, 182, 0.95)',
                      '--background-activated': 'rgba(244, 114, 182, 1)',
                      '--color': '#000000',
                      '--border-radius': '999px',
                    } as React.CSSProperties
                  }
                >
                  <IonIcon icon={addOutline} slot="start" />
                  Add your first song
                </IonButton>
              )}
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
                gap: 16,
              }}
            >
              {filteredSongs.map((song) => (
                <IonCard
                  key={song.id}
                  button
                  onClick={() => onOpenSong(song.id)}
                  style={{
                    margin: 0,
                    background:
                      'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                    border: '1px solid rgba(148,163,184,0.35)',
                    borderRadius: 16,
                    boxShadow: '0 12px 28px rgba(0,0,0,0.75)',
                    cursor: 'pointer',
                    overflow: 'hidden',
                    transition:
                      'transform 140ms ease-out, box-shadow 140ms ease-out',
                  }}
                  className="song-card"
                >
                  <IonCardContent style={{ padding: 16 }}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'auto 1fr auto', // col1 avatar, col2 text, col3 pill+chevron
                        alignItems: 'center',
                        columnGap: 12,
                      }}
                    >
                      {/* Column 1: Avatar */}
                      <div
                        style={{
                          width: 42,
                          height: 42,
                          borderRadius: 12,
                          background:
                            'radial-gradient(circle at 30% 20%, rgba(244,114,182,0.7), rgba(76,29,149,0.5))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow:
                            '0 0 0 1px rgba(15,23,42,0.9), 0 10px 25px rgba(0,0,0,0.9)',
                        }}
                      >
                        <IonIcon
                          icon={musicalNotesOutline}
                          style={{
                            fontSize: 20,
                            color: '#fdf2ff',
                          }}
                        />
                      </div>

                      {/* Column 2: Title + meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Title */}
                        <h3
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: '#f9fafb',
                            marginBottom: 6,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {song.title}
                        </h3>

                        {/* Meta row (key + BPM) */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                            minWidth: 0,
                          }}
                        >
                          {song.default_key && (
                            <span
                              style={{
                                fontSize: 11,
                                color: '#e5e7eb',
                                background: 'rgba(15,23,42,0.98)',
                                padding: '3px 10px',
                                borderRadius: 999,
                                fontWeight: 500,
                                border: '1px solid rgba(148,163,184,0.45)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              Key: {song.default_key}
                            </span>
                          )}

                          {song.default_bpm != null && (
                            <span
                              style={{
                                fontSize: 11,
                                color: '#e5e7eb',
                                background: 'rgba(15,23,42,0.98)',
                                padding: '3px 10px',
                                borderRadius: 999,
                                fontWeight: 500,
                                border: '1px solid rgba(148,163,184,0.45)',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {song.default_bpm} BPM
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Column 3: Origin pill + chevron */}
                      {/* Column 3: Origin pill + chevron in one line */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          gap: 6,
                          minWidth: 0,
                        }}
                      >
                        {song.origin && (
                          <span
                            style={{
                              fontSize: 10,
                              color:
                                song.origin === 'cover' ? '#bfdbfe' : '#f9a8d4',
                              background:
                                song.origin === 'cover'
                                  ? 'rgba(37, 99, 235, 0.16)'
                                  : 'rgba(244, 114, 182, 0.16)',
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontWeight: 600,
                              border:
                                song.origin === 'cover'
                                  ? '1px solid rgba(59,130,246,0.45)'
                                  : '1px solid rgba(244,114,182,0.5)',
                              textTransform: 'uppercase',
                              letterSpacing: 0.35,
                              whiteSpace: 'nowrap',
                              textAlign: 'center',
                            }}
                          >
                            {song.origin === 'cover' ? 'Cover' : 'Original'}
                          </span>
                        )}

                        <IonIcon
                          icon={chevronForwardOutline}
                          style={{
                            fontSize: 18,
                            color: 'rgba(148,163,184,0.9)',
                            flexShrink: 0,
                          }}
                        />
                      </div>
                    </div>
                  </IonCardContent>
                </IonCard>
              ))}
            </div>
          )}
        </div>

        <style>
          {`
            .song-card:active {
              transform: scale(0.98);
              box-shadow: 0 8px 18px rgba(0,0,0,0.9) !important;
            }
          `}
        </style>
      </IonContent>
    </IonPage>
  );
}
