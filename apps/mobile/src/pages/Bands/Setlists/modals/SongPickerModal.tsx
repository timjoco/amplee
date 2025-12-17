import { IonContent, IonIcon, IonModal, IonSpinner } from '@ionic/react';
import {
  checkmarkOutline,
  musicalNotesOutline,
  searchOutline,
} from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { PINK } from '../lib/styles';
import { SongOption } from '../types/setlistTypes';

export function SongPickerModal({
  isOpen,
  loadingSongs,
  songSearch,
  setSongSearch,
  filteredSongs,
  songsCount,
  onClose,
  onSelectSongs,
}: {
  isOpen: boolean;
  loadingSongs: boolean;
  songSearch: string;
  setSongSearch: (v: string) => void;
  filteredSongs: SongOption[];
  songsCount: number;
  onClose: () => void;
  onSelectSongs: (songs: SongOption[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Reset selection when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIds(new Set());
    }
  }, [isOpen]);

  const toggleSong = (songId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
      } else {
        next.add(songId);
      }
      return next;
    });
  };

  const handleConfirm = () => {
    const selected = filteredSongs.filter((s) => selectedIds.has(s.id));
    onSelectSongs(selected);
    onClose();
  };

  const selectedCount = selectedIds.size;

  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonContent
        style={{
          '--background': 'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
        }}
      >
        <div
          style={{
            padding: 16,
            paddingTop: 20,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                color: '#f9fafb',
              }}
            >
              Add Songs
            </h2>
            <button
              onClick={onClose}
              style={{
                padding: '8px 14px',
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#9ca3af',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
          </div>

          {/* Search */}
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
              }}
            />
            <input
              type="text"
              value={songSearch}
              onChange={(e) => setSongSearch(e.target.value)}
              placeholder="Search songs..."
              style={{
                width: '100%',
                padding: '14px 16px 14px 44px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${
                  songSearch ? PINK.border : 'rgba(255, 255, 255, 0.08)'
                }`,
                color: '#f9fafb',
                fontSize: 15,
                outline: 'none',
              }}
            />
          </div>

          {/* Content */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              marginBottom: selectedCount > 0 ? 80 : 0,
            }}
          >
            {loadingSongs ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 40,
                  gap: 10,
                }}
              >
                <IonSpinner
                  style={{ '--color': PINK.primary, width: 24, height: 24 }}
                />
                <span style={{ fontSize: 14, color: '#6b7280' }}>
                  Loading songs...
                </span>
              </div>
            ) : filteredSongs.length === 0 ? (
              <div
                style={{
                  padding: 40,
                  textAlign: 'center',
                }}
              >
                <IonIcon
                  icon={musicalNotesOutline}
                  style={{
                    fontSize: 40,
                    color: '#4b5563',
                    marginBottom: 12,
                  }}
                />
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                  {songsCount === 0
                    ? 'No songs in your library yet'
                    : 'No songs match your search'}
                </p>
              </div>
            ) : (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                  paddingBottom: 20,
                }}
              >
                {filteredSongs.map((song) => {
                  const isSelected = selectedIds.has(song.id);
                  const isOriginal = song.origin === 'original';
                  const isCover = song.origin === 'cover';

                  // Format duration
                  const durationLabel = song.duration
                    ? `${Math.floor(song.duration / 60)}:${String(
                        song.duration % 60
                      ).padStart(2, '0')}`
                    : null;

                  return (
                    <button
                      key={song.id}
                      onClick={() => toggleSong(song.id)}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: 12,
                        background: isSelected
                          ? 'rgba(236, 72, 153, 0.15)'
                          : PINK.subtle,
                        border: `1px solid ${
                          isSelected ? PINK.primary : PINK.border
                        }`,
                        textAlign: 'left',
                        transition: 'all 100ms ease-out',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      {/* Checkbox */}
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: isSelected
                            ? 'linear-gradient(135deg, #ec4899, #a855f7)'
                            : 'rgba(255, 255, 255, 0.06)',
                          border: isSelected
                            ? 'none'
                            : '1px solid rgba(255, 255, 255, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {isSelected && (
                          <IonIcon
                            icon={checkmarkOutline}
                            style={{ fontSize: 14, color: '#fff' }}
                          />
                        )}
                      </div>

                      {/* Song info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight: 600,
                              color: '#f9fafb',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {song.title}
                          </span>

                          {/* Origin badge - only show if origin is set */}
                          {song.origin && (
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 600,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                padding: '2px 6px',
                                borderRadius: 4,
                                flexShrink: 0,
                                background: isOriginal
                                  ? 'rgba(236, 72, 153, 0.15)'
                                  : 'rgba(59, 130, 246, 0.15)',
                                color: isOriginal ? '#f472b6' : '#60a5fa',
                                border: `1px solid ${
                                  isOriginal
                                    ? 'rgba(236, 72, 153, 0.3)'
                                    : 'rgba(59, 130, 246, 0.3)'
                                }`,
                              }}
                            >
                              {isOriginal ? 'Original' : 'Cover'}
                            </span>
                          )}
                        </div>

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            fontSize: 12,
                            color: '#6b7280',
                          }}
                        >
                          {/* Show original artist for covers */}
                          {isCover && song.original_artist && (
                            <>
                              <span style={{ color: '#9ca3af' }}>
                                {song.original_artist}
                              </span>
                              <span>•</span>
                            </>
                          )}
                          <span>Key: {song.default_key?.trim() || '—'}</span>
                          <span>•</span>
                          <span>BPM: {song.default_bpm ?? '—'}</span>
                          {durationLabel && (
                            <>
                              <span>•</span>
                              <span>{durationLabel}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Floating confirm button */}
          {selectedCount > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: 16,
                paddingBottom: 'calc(16px + env(safe-area-inset-bottom))',
                background:
                  'linear-gradient(to top, rgba(8, 8, 14, 1) 0%, rgba(8, 8, 14, 0.95) 80%, transparent 100%)',
              }}
            >
              <button
                onClick={handleConfirm}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #ec4899, #a855f7)',
                  border: 'none',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <span>
                  Add {selectedCount} Song{selectedCount !== 1 ? 's' : ''}
                </span>
              </button>
            </div>
          )}
        </div>
      </IonContent>
    </IonModal>
  );
}
