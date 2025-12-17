import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSearchbar,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { closeOutline, musicalNotes } from 'ionicons/icons';
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Song = {
  id: string;
  title: string;
  original_artist: string | null;
  origin: 'original' | 'cover';
  default_key: string | null;
  default_bpm: number | null;
};

type SongPickerModalProps = {
  isOpen: boolean;
  bandId: string | undefined;
  onClose: () => void;
  onSelect: (song: Song) => void;
};

export function EventChatSongPickerModal({
  isOpen,
  bandId,
  onClose,
  onSelect,
}: SongPickerModalProps) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch songs when modal opens
  useEffect(() => {
    if (!isOpen || !bandId) {
      return;
    }

    let alive = true;

    const fetchSongs = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from('songs')
        .select('id, title, original_artist, origin, default_key, default_bpm')
        .eq('band_id', bandId)
        .order('title', { ascending: true });

      if (!alive) return;

      if (error) {
        console.error('[song picker fetch error]', error);
        setLoading(false);
        return;
      }

      setSongs(data ?? []);
      setFilteredSongs(data ?? []);
      setLoading(false);
    };

    void fetchSongs();

    return () => {
      alive = false;
    };
  }, [isOpen, bandId]);

  // Filter songs based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSongs(songs);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = songs.filter(
      (song) =>
        song.title.toLowerCase().includes(query) ||
        song.original_artist?.toLowerCase().includes(query)
    );
    setFilteredSongs(filtered);
  }, [searchQuery, songs]);

  const handleSelect = useCallback(
    (song: Song) => {
      onSelect(song);
      setSearchQuery('');
    },
    [onSelect]
  );

  const handleClose = useCallback(() => {
    setSearchQuery('');
    onClose();
  }, [onClose]);

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleClose}
      breakpoints={[0, 0.5, 0.75, 1]}
      initialBreakpoint={0.75}
      style={{
        '--background': '#0a0a0f',
      }}
    >
      <IonHeader>
        <IonToolbar
          style={{
            '--background': 'rgba(15, 15, 25, 0.98)',
            '--border-color': 'rgba(236, 72, 153, 0.2)',
          }}
        >
          <IonButtons slot="start">
            <IonButton onClick={handleClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          </IonButtons>
          <IonTitle
            style={{
              fontSize: 17,
              fontWeight: 700,
            }}
          >
            Tag a Song
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        style={{
          '--background': '#0a0a0f',
        }}
      >
        <div style={{ padding: '12px 16px 8px' }}>
          <IonSearchbar
            value={searchQuery}
            onIonInput={(e) => setSearchQuery(e.detail.value ?? '')}
            placeholder="Search songs..."
            debounce={150}
            style={{
              '--background': 'rgba(236, 72, 153, 0.08)',
              '--border-radius': '12px',
              '--box-shadow': 'none',
              '--placeholder-color': 'rgba(156, 163, 175, 0.8)',
              '--icon-color': '#EC4899',
            }}
          />
        </div>

        {loading ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 32,
              gap: 12,
            }}
          >
            <IonSpinner name="dots" color="primary" />
            <IonText color="medium">Loading songs...</IonText>
          </div>
        ) : filteredSongs.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '48px 24px',
              textAlign: 'center',
            }}
          >
            <IonIcon
              icon={musicalNotes}
              style={{
                fontSize: 48,
                color: 'rgba(236, 72, 153, 0.4)',
                marginBottom: 16,
              }}
            />
            <IonText color="medium">
              {songs.length === 0
                ? 'No songs in your library yet'
                : 'No songs match your search'}
            </IonText>
          </div>
        ) : (
          <IonList
            lines="none"
            style={{
              background: 'transparent',
              padding: '0 8px',
            }}
          >
            {filteredSongs.map((song) => (
              <IonItem
                key={song.id}
                button
                onClick={() => handleSelect(song)}
                style={{
                  '--background': 'transparent',
                  '--background-activated': 'rgba(236, 72, 153, 0.15)',
                  '--background-hover': 'rgba(236, 72, 153, 0.08)',
                  '--padding-start': '12px',
                  '--inner-padding-end': '12px',
                  '--min-height': '56px',
                  borderRadius: 12,
                  marginBottom: 4,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: 'rgba(236, 72, 153, 0.12)',
                    border: '1px solid rgba(236, 72, 153, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                    flexShrink: 0,
                  }}
                >
                  <IonIcon
                    icon={musicalNotes}
                    style={{
                      fontSize: 18,
                      color: '#EC4899',
                    }}
                  />
                </div>

                <IonLabel>
                  <h2
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#e5e7eb',
                      marginBottom: 2,
                    }}
                  >
                    {song.title}
                  </h2>
                  <p
                    style={{
                      fontSize: 13,
                      color: 'rgba(156, 163, 175, 0.9)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {song.origin === 'cover' && song.original_artist ? (
                      <span>{song.original_artist}</span>
                    ) : (
                      <span
                        style={{
                          color: 'rgba(236, 72, 153, 0.8)',
                          fontWeight: 500,
                        }}
                      >
                        Original
                      </span>
                    )}
                    {song.default_key && (
                      <>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span>{song.default_key}</span>
                      </>
                    )}
                    {song.default_bpm && (
                      <>
                        <span style={{ opacity: 0.4 }}>•</span>
                        <span>{song.default_bpm} BPM</span>
                      </>
                    )}
                  </p>
                </IonLabel>
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonModal>
  );
}
