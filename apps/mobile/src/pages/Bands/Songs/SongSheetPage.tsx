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
  addOutline,
  chatbubblesOutline,
  chevronBackOutline,
  closeOutline,
  createOutline,
  linkOutline,
  musicalNotesOutline,
  openOutline,
  personCircleOutline,
  personOutline,
  sendOutline,
  shieldCheckmarkOutline,
  sparklesOutline,
  speedometerOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAvatarUrl } from '../../../lib/cache/avatarUrlCache';
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

const RED = {
  primary: '#ef4444',
  light: '#f87171',
  subtle: 'rgba(239, 68, 68, 0.08)',
  border: 'rgba(239, 68, 68, 0.25)',
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
  duration: number | null;
  notes: string | null;
  origin: SongOrigin;
  original_artist: string | null;
  band_name: string | null;
};

type RecordingLink = {
  id: string;
  song_id: string;
  label: string;
  url: string;
  created_at: string;
};

type SongComment = {
  id: string;
  song_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name: string;
  user_avatar: string | null;
};

type SongSheetPageProps = {
  songId: string;
  onBack: () => void;
  onEdit?: (songId: string) => void;
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function SongSheetPage({
  songId,
  onBack,
  onEdit,
}: SongSheetPageProps) {
  const [loading, setLoading] = useState(true);
  const [song, setSong] = useState<SongRow | null>(null);
  const [recordings, setRecordings] = useState<RecordingLink[]>([]);
  const [comments, setComments] = useState<SongComment[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [pressedButton, setPressedButton] = useState<string | null>(null);

  // Song details modal
  const [showSongDetails, setShowSongDetails] = useState(false);

  // Add recording modal
  const [showAddRecording, setShowAddRecording] = useState(false);
  const [newRecordingLabel, setNewRecordingLabel] = useState('');
  const [newRecordingUrl, setNewRecordingUrl] = useState('');
  const [savingRecording, setSavingRecording] = useState(false);

  // New comment
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

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

  const handleButtonPress = useCallback(
    (buttonId: string, action: () => void) => {
      setPressedButton(buttonId);
      triggerHaptic();
      setTimeout(() => {
        setPressedButton(null);
        action();
      }, 120);
    },
    [triggerHaptic]
  );

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const getRecordingIcon = (url: string) => {
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('spotify')) return '🎧';
    if (lowerUrl.includes('youtube') || lowerUrl.includes('youtu.be'))
      return '▶️';
    if (lowerUrl.includes('soundcloud')) return '☁️';
    if (lowerUrl.includes('apple') || lowerUrl.includes('music.apple'))
      return '🍎';
    if (lowerUrl.includes('bandcamp')) return '💿';
    if (lowerUrl.includes('drive.google')) return '📁';
    if (lowerUrl.includes('dropbox')) return '📦';
    return '🔗';
  };

  // ─────────────────────────────────────────────────────────────
  // Data Fetching
  // ─────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!songId) return;

    const loadData = async () => {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }

      // Load song
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select(
          `
          id,
          band_id,
          title,
          default_key,
          default_bpm,
          duration,
          notes,
          origin,
          original_artist,
          bands(name)
        `
        )
        .eq('id', songId)
        .maybeSingle();

      if (songError) {
        console.error('[SongSheetPage] loadSong error', songError.message);
        setSong(null);
      } else if (songData) {
        const anyData = songData as any;
        const bandName = anyData.bands?.name ?? null;
        setSong({
          id: anyData.id,
          band_id: anyData.band_id,
          title: anyData.title,
          default_key: anyData.default_key,
          default_bpm: anyData.default_bpm,
          duration: anyData.duration,
          notes: anyData.notes,
          origin: anyData.origin,
          original_artist: anyData.original_artist,
          band_name: bandName,
        });

        // Check if user is admin
        if (user && anyData.band_id) {
          const { data: memberData } = await supabase
            .from('band_members')
            .select('role')
            .eq('band_id', anyData.band_id)
            .eq('user_id', user.id)
            .maybeSingle();

          setIsAdmin(memberData?.role === 'admin');
        }
      }

      // Load recordings
      const { data: recordingsData, error: recordingsError } = await supabase
        .from('song_recordings')
        .select('*')
        .eq('song_id', songId)
        .order('created_at', { ascending: true });

      if (!recordingsError && recordingsData) {
        setRecordings(recordingsData as RecordingLink[]);
      }

      // Load comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('song_comments')
        .select('id, song_id, user_id, content, created_at')
        .eq('song_id', songId)
        .order('created_at', { ascending: true });

      if (!commentsError && commentsData) {
        const userIds = [...new Set(commentsData.map((c: any) => c.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        const profilesMap = new Map<
          string,
          { display_name: string; avatar_url: string | null }
        >();

        await Promise.all(
          (profilesData || []).map(async (p: any) => {
            const avatarUrl = await getAvatarUrl(
              'profile-avatars',
              p.avatar_url
            );
            profilesMap.set(p.id, {
              display_name: p.display_name,
              avatar_url: avatarUrl,
            });
          })
        );

        const formattedComments = commentsData.map((c: any) => {
          const profile = profilesMap.get(c.user_id);
          return {
            id: c.id,
            song_id: c.song_id,
            user_id: c.user_id,
            content: c.content,
            created_at: c.created_at,
            user_name: profile?.display_name || 'Unknown',
            user_avatar: profile?.avatar_url || null,
          };
        });
        setComments(formattedComments);
      }

      setLoading(false);
    };

    void loadData();
  }, [songId]);

  // ─────────────────────────────────────────────────────────────
  // Actions
  // ─────────────────────────────────────────────────────────────

  const handleAddRecording = async () => {
    if (!song || !newRecordingLabel.trim() || !newRecordingUrl.trim()) return;

    setSavingRecording(true);

    try {
      const { data, error } = await supabase
        .from('song_recordings')
        .insert({
          song_id: song.id,
          label: newRecordingLabel.trim(),
          url: newRecordingUrl.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error('[SongSheetPage] add recording error', error.message);
        return;
      }

      setRecordings((prev) => [...prev, data as RecordingLink]);
      setShowAddRecording(false);
      setNewRecordingLabel('');
      setNewRecordingUrl('');
    } finally {
      setSavingRecording(false);
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    triggerHaptic();

    const { error } = await supabase
      .from('song_recordings')
      .delete()
      .eq('id', recordingId);

    if (error) {
      console.error('[SongSheetPage] delete recording error', error.message);
      return;
    }

    setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
  };

  const handleAddComment = async () => {
    if (!song || !newComment.trim() || !currentUserId) return;

    setSendingComment(true);
    triggerHaptic();

    try {
      const { data, error } = await supabase
        .from('song_comments')
        .insert({
          song_id: song.id,
          user_id: currentUserId,
          content: newComment.trim(),
        })
        .select('id, song_id, user_id, content, created_at')
        .single();

      if (error) {
        console.error('[SongSheetPage] add comment error', error.message);
        return;
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', currentUserId)
        .single();

      const avatarUrl = await getAvatarUrl(
        'profile-avatars',
        profileData?.avatar_url
      );

      const formattedComment: SongComment = {
        id: data.id,
        song_id: data.song_id,
        user_id: data.user_id,
        content: data.content,
        created_at: data.created_at,
        user_name: profileData?.display_name || 'Unknown',
        user_avatar: avatarUrl,
      };

      setComments((prev) => [...prev, formattedComment]);
      setNewComment('');
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    triggerHaptic();

    const { error } = await supabase
      .from('song_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error('[SongSheetPage] delete comment error', error.message);
      return;
    }

    setComments((prev) => prev.filter((c) => c.id !== commentId));
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
  // Not Found State
  // ─────────────────────────────────────────────────────────────

  if (!song) {
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
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              height: '100%',
              padding: 24,
              gap: 16,
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
              }}
            >
              Song not found
            </h3>
            <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
              This song may have been deleted or moved.
            </p>
            <button
              onClick={onBack}
              style={{
                marginTop: 8,
                padding: '12px 24px',
                borderRadius: 12,
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e5e7eb',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              Go back
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // Main Render
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

            {/* Title Card */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                setShowSongDetails(true);
              }}
              onTouchStart={() => setPressedButton('header')}
              onTouchEnd={() => setPressedButton(null)}
              onTouchCancel={() => setPressedButton(null)}
              onMouseDown={() => setPressedButton('header')}
              onMouseUp={() => setPressedButton(null)}
              onMouseLeave={() => setPressedButton(null)}
              style={{
                flex: 1,
                minWidth: 0,
                ...glassCard,
                border:
                  pressedButton === 'header'
                    ? `1px solid ${PINK.border}`
                    : '1px solid rgba(255, 255, 255, 0.08)',
                background:
                  pressedButton === 'header'
                    ? PINK.subtle
                    : 'rgba(255, 255, 255, 0.04)',
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                textAlign: 'left',
                color: 'inherit',
                transition: 'all 100ms ease-out',
                transform:
                  pressedButton === 'header' ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#f9fafb',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    lineHeight: 1.2,
                  }}
                >
                  {song.title}
                </span>

                <span
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    display: 'block',
                    marginTop: 2,
                  }}
                >
                  {song.origin === 'cover' && song.original_artist
                    ? `Cover of ${song.original_artist}`
                    : song.origin === 'cover'
                    ? 'Cover'
                    : 'Original'}
                  {song.band_name && ` • ${song.band_name}`}
                </span>
              </div>

              {/* Info icon hint */}
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  background:
                    pressedButton === 'header'
                      ? PINK.subtle
                      : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    pressedButton === 'header'
                      ? PINK.border
                      : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <IonIcon
                  icon={musicalNotesOutline}
                  style={{
                    fontSize: 14,
                    color: pressedButton === 'header' ? PINK.light : '#6b7280',
                  }}
                />
              </div>
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
          {/* Band Notes Section */}
          <div
            style={{
              ...glassCard,
              border: `1px solid rgba(255, 255, 255, 0.08)`,
              padding: 20,
              marginBottom: 16,
            }}
          >
            {/* Section Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 16,
              }}
            >
              <IonIcon
                icon={chatbubblesOutline}
                style={{ fontSize: 18, color: PINK.light }}
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
                Band Notes
              </span>
              {comments.length > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    background: 'rgba(255, 255, 255, 0.04)',
                    padding: '2px 8px',
                    borderRadius: 6,
                  }}
                >
                  {comments.length}
                </span>
              )}
            </div>

            {/* Comments List */}
            {comments.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    style={{
                      display: 'flex',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    {/* Avatar */}
                    {comment.user_avatar ? (
                      <img
                        src={comment.user_avatar}
                        alt=""
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: PINK.subtle,
                          border: `1px solid ${PINK.border}`,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IonIcon
                          icon={personCircleOutline}
                          style={{ fontSize: 20, color: PINK.light }}
                        />
                      </div>
                    )}

                    {/* Content */}
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
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#f9fafb',
                          }}
                        >
                          {comment.user_name}
                        </span>
                        <span style={{ fontSize: 12, color: '#4b5563' }}>
                          {formatRelativeTime(comment.created_at)}
                        </span>
                      </div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 14,
                          color: '#d1d5db',
                          lineHeight: 1.5,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {comment.content}
                      </p>
                    </div>

                    {/* Delete (own comments or admin) */}
                    {(comment.user_id === currentUserId || isAdmin) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{
                          padding: 6,
                          borderRadius: 8,
                          background: 'transparent',
                          border: 'none',
                          color: '#4b5563',
                          alignSelf: 'flex-start',
                        }}
                      >
                        <IonIcon icon={trashOutline} style={{ fontSize: 16 }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                  marginBottom: 16,
                }}
              >
                <IonIcon
                  icon={chatbubblesOutline}
                  style={{
                    fontSize: 36,
                    color: '#374151',
                    marginBottom: 10,
                  }}
                />
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                  No notes yet
                </p>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: 12,
                    color: '#4b5563',
                  }}
                >
                  Leave a note about arrangements, cues, or tips
                </p>
              </div>
            )}

            {/* Add Comment Input */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                alignItems: 'flex-end',
              }}
            >
              <textarea
                ref={commentInputRef}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a note..."
                rows={2}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    newComment ? PINK.border : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  color: '#f9fafb',
                  fontSize: 15,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleAddComment}
                disabled={!newComment.trim() || sendingComment}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  border: 'none',
                  background:
                    newComment.trim() && !sendingComment
                      ? PINK.primary
                      : 'rgba(255, 255, 255, 0.04)',
                  color:
                    newComment.trim() && !sendingComment ? '#fff' : '#4b5563',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  boxShadow:
                    newComment.trim() && !sendingComment
                      ? `0 4px 12px ${PINK.glow}`
                      : 'none',
                }}
              >
                {sendingComment ? (
                  <IonSpinner
                    style={{ '--color': PINK.light, width: 20, height: 20 }}
                  />
                ) : (
                  <IonIcon icon={sendOutline} style={{ fontSize: 20 }} />
                )}
              </button>
            </div>
          </div>

          {/* Recordings/Links Section */}
          <div
            style={{
              ...glassCard,
              border: `1px solid ${PINK.border}`,
              padding: 20,
            }}
          >
            {/* Section Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: recordings.length > 0 ? 16 : 0,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <IonIcon
                  icon={linkOutline}
                  style={{ fontSize: 18, color: PINK.light }}
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
                  Links
                </span>
              </div>

              {/* Add Link Button (Admin or anyone - depends on your preference) */}
              <button
                onClick={() =>
                  handleButtonPress('addRecording', () =>
                    setShowAddRecording(true)
                  )
                }
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 14px',
                  borderRadius: 10,
                  background: PINK.subtle,
                  border: `1px solid ${PINK.border}`,
                  color: PINK.light,
                  fontSize: 13,
                  fontWeight: 600,
                  transform:
                    pressedButton === 'addRecording'
                      ? 'scale(0.95)'
                      : 'scale(1)',
                  transition: 'all 100ms ease-out',
                }}
              >
                <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
                Add
              </button>
            </div>

            {/* Links List */}
            {recordings.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                }}
              >
                {recordings.map((recording) => (
                  <div
                    key={recording.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid rgba(255, 255, 255, 0.06)',
                    }}
                  >
                    <span style={{ fontSize: 24 }}>
                      {getRecordingIcon(recording.url)}
                    </span>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 600,
                          color: '#f9fafb',
                          marginBottom: 2,
                        }}
                      >
                        {recording.label}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#6b7280',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {recording.url}
                      </div>
                    </div>

                    <a
                      href={recording.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{
                        padding: 8,
                        borderRadius: 8,
                        background: PINK.subtle,
                        border: `1px solid ${PINK.border}`,
                        color: PINK.light,
                        display: 'grid',
                        placeItems: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      <IonIcon icon={openOutline} style={{ fontSize: 16 }} />
                    </a>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteRecording(recording.id)}
                        style={{
                          padding: 8,
                          borderRadius: 8,
                          background: RED.subtle,
                          border: `1px solid ${RED.border}`,
                          color: RED.light,
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <IonIcon icon={trashOutline} style={{ fontSize: 16 }} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div
                style={{
                  padding: '24px 16px',
                  textAlign: 'center',
                }}
              >
                <IonIcon
                  icon={sparklesOutline}
                  style={{
                    fontSize: 36,
                    color: '#374151',
                    marginBottom: 10,
                  }}
                />
                <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                  No links added yet
                </p>
                <p
                  style={{
                    margin: '6px 0 0',
                    fontSize: 12,
                    color: '#4b5563',
                  }}
                >
                  Add links to Spotify, YouTube, SoundCloud, etc.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Song Details Modal */}
        <IonModal
          isOpen={showSongDetails}
          onDidDismiss={() => setShowSongDetails(false)}
          initialBreakpoint={0.65}
          breakpoints={[0, 0.5, 0.65, 0.9]}
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
                  alignItems: 'flex-start',
                  gap: 14,
                  marginBottom: 24,
                  paddingBottom: 20,
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                }}
              >
                {/* Song Icon */}
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: PINK.subtle,
                    border: `1px solid ${PINK.border}`,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IonIcon
                    icon={musicalNotesOutline}
                    style={{ fontSize: 26, color: PINK.light }}
                  />
                </div>

                {/* Title & Type */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#f9fafb',
                      lineHeight: 1.2,
                    }}
                  >
                    {song.title}
                  </h2>

                  {/* Origin Badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      marginTop: 8,
                      padding: '4px 10px',
                      borderRadius: 8,
                      background:
                        song.origin === 'cover'
                          ? 'rgba(59, 130, 246, 0.08)'
                          : PINK.subtle,
                      border: `1px solid ${
                        song.origin === 'cover'
                          ? 'rgba(59, 130, 246, 0.25)'
                          : PINK.border
                      }`,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: song.origin === 'cover' ? '#60a5fa' : PINK.light,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      {song.origin === 'cover' ? 'Cover' : 'Original'}
                    </span>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  onClick={() => setShowSongDetails(false)}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    display: 'grid',
                    placeItems: 'center',
                    color: '#9ca3af',
                    flexShrink: 0,
                  }}
                >
                  <IonIcon icon={closeOutline} style={{ fontSize: 20 }} />
                </button>
              </div>

              {/* Details Grid */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {/* Original Artist (for covers) */}
                {song.origin === 'cover' && song.original_artist && (
                  <div
                    style={{
                      ...glassCard,
                      border: `1px solid rgba(59, 130, 246, 0.25)`,
                      padding: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(59, 130, 246, 0.08)',
                        border: '1px solid rgba(59, 130, 246, 0.25)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IonIcon
                        icon={personOutline}
                        style={{ fontSize: 20, color: '#60a5fa' }}
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#6b7280',
                          marginBottom: 4,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Original Artist
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: '#f9fafb',
                        }}
                      >
                        {song.original_artist}
                      </div>
                    </div>
                  </div>
                )}

                {/* Band */}
                {song.band_name && (
                  <div
                    style={{
                      ...glassCard,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: 16,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                    }}
                  >
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IonIcon
                        icon={shieldCheckmarkOutline}
                        style={{ fontSize: 20, color: '#9ca3af' }}
                      />
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#6b7280',
                          marginBottom: 4,
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Band
                      </div>
                      <div
                        style={{
                          fontSize: 16,
                          fontWeight: 600,
                          color: '#f9fafb',
                        }}
                      >
                        {song.band_name}
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats Row */}
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    flexWrap: 'wrap',
                  }}
                >
                  {/* Key */}
                  {song.default_key && (
                    <div
                      style={{
                        flex: '1 1 calc(50% - 5px)',
                        minWidth: 120,
                        ...glassCard,
                        border: `1px solid ${PINK.border}`,
                        padding: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: PINK.subtle,
                          border: `1px solid ${PINK.border}`,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IonIcon
                          icon={musicalNotesOutline}
                          style={{ fontSize: 18, color: PINK.light }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#6b7280',
                            marginBottom: 2,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Key
                        </div>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: PINK.light,
                          }}
                        >
                          {song.default_key}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* BPM */}
                  {song.default_bpm && (
                    <div
                      style={{
                        flex: '1 1 calc(50% - 5px)',
                        minWidth: 120,
                        ...glassCard,
                        border: `1px solid ${PINK.border}`,
                        padding: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: PINK.subtle,
                          border: `1px solid ${PINK.border}`,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IonIcon
                          icon={speedometerOutline}
                          style={{ fontSize: 18, color: PINK.light }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#6b7280',
                            marginBottom: 2,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          BPM
                        </div>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: PINK.light,
                          }}
                        >
                          {song.default_bpm}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  {song.duration && (
                    <div
                      style={{
                        flex: '1 1 calc(50% - 5px)',
                        minWidth: 120,
                        ...glassCard,
                        border: `1px solid ${PINK.border}`,
                        padding: 16,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          background: PINK.subtle,
                          border: `1px solid ${PINK.border}`,
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IonIcon
                          icon={timeOutline}
                          style={{ fontSize: 18, color: PINK.light }}
                        />
                      </div>
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#6b7280',
                            marginBottom: 2,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                          }}
                        >
                          Duration
                        </div>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 700,
                            color: PINK.light,
                          }}
                        >
                          {formatDuration(song.duration)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Notes (if any) */}
                {song.notes && (
                  <div
                    style={{
                      ...glassCard,
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      padding: 16,
                    }}
                  >
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
                      Notes
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 14,
                        color: '#d1d5db',
                        lineHeight: 1.6,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {song.notes}
                    </p>
                  </div>
                )}

                {/* Edit Button (Admin Only) */}
                {onEdit && isAdmin && (
                  <button
                    onClick={() => {
                      setShowSongDetails(false);
                      onEdit(song.id);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      padding: '14px 20px',
                      marginTop: 8,
                      borderRadius: 12,
                      background: PINK.primary,
                      border: 'none',
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 600,
                      boxShadow: `0 4px 14px ${PINK.glow}`,
                    }}
                  >
                    <IonIcon icon={createOutline} style={{ fontSize: 18 }} />
                    Edit Song Details
                  </button>
                )}
              </div>
            </div>
          </IonContent>
        </IonModal>

        {/* Add Recording Modal */}
        <IonModal
          isOpen={showAddRecording}
          onDidDismiss={() => {
            if (!savingRecording) {
              setShowAddRecording(false);
              setNewRecordingLabel('');
              setNewRecordingUrl('');
            }
          }}
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
                  border: `1px solid ${PINK.border}`,
                  padding: 24,
                  boxShadow: `0 25px 50px rgba(0, 0, 0, 0.5), 0 0 40px ${PINK.glow}`,
                }}
              >
                {/* Header */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        background: PINK.subtle,
                        border: `1px solid ${PINK.border}`,
                        display: 'grid',
                        placeItems: 'center',
                      }}
                    >
                      <IonIcon
                        icon={linkOutline}
                        style={{ fontSize: 20, color: PINK.light }}
                      />
                    </div>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: '#f9fafb',
                      }}
                    >
                      Add Link
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowAddRecording(false);
                      setNewRecordingLabel('');
                      setNewRecordingUrl('');
                    }}
                    disabled={savingRecording}
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

                {/* Label Input */}
                <div style={{ marginBottom: 16 }}>
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
                    Label
                  </label>
                  <input
                    value={newRecordingLabel}
                    onChange={(e) => setNewRecordingLabel(e.target.value)}
                    placeholder="e.g. Original Recording, Tutorial"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${
                        newRecordingLabel
                          ? PINK.border
                          : 'rgba(255, 255, 255, 0.08)'
                      }`,
                      color: '#f9fafb',
                      fontSize: 15,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* URL Input */}
                <div style={{ marginBottom: 24 }}>
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
                    URL
                  </label>
                  <input
                    value={newRecordingUrl}
                    onChange={(e) => setNewRecordingUrl(e.target.value)}
                    placeholder="https://..."
                    type="url"
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: `1px solid ${
                        newRecordingUrl
                          ? PINK.border
                          : 'rgba(255, 255, 255, 0.08)'
                      }`,
                      color: '#f9fafb',
                      fontSize: 15,
                      outline: 'none',
                    }}
                  />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 10 }}>
                  <button
                    disabled={savingRecording}
                    onClick={() => {
                      setShowAddRecording(false);
                      setNewRecordingLabel('');
                      setNewRecordingUrl('');
                    }}
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
                    disabled={
                      savingRecording ||
                      !newRecordingLabel.trim() ||
                      !newRecordingUrl.trim()
                    }
                    onClick={handleAddRecording}
                    style={{
                      flex: 1,
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: PINK.primary,
                      border: 'none',
                      color: '#fff',
                      fontSize: 15,
                      fontWeight: 600,
                      opacity:
                        savingRecording ||
                        !newRecordingLabel.trim() ||
                        !newRecordingUrl.trim()
                          ? 0.5
                          : 1,
                      boxShadow: `0 4px 12px ${PINK.glow}`,
                    }}
                  >
                    {savingRecording ? 'Adding...' : 'Add'}
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
