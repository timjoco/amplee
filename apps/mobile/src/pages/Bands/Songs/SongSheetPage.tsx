/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton,
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
  createOutline,
  linkOutline,
  musicalNotesOutline,
  openOutline,
  personCircleOutline,
  sendOutline,
  sparklesOutline,
  speedometerOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { getAvatarUrl } from '../../../lib/cache/avatarUrlCache';
import { supabase } from '../../../lib/supabase';

type SongOrigin = 'original' | 'cover';

type SongRow = {
  id: string;
  band_id: string;
  title: string;
  default_key: string | null;
  default_bpm: number | null;
  duration: number | null; // in seconds
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

  // Add recording modal
  const [showAddRecording, setShowAddRecording] = useState(false);
  const [newRecordingLabel, setNewRecordingLabel] = useState('');
  const [newRecordingUrl, setNewRecordingUrl] = useState('');
  const [savingRecording, setSavingRecording] = useState(false);

  // New comment
  const [newComment, setNewComment] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const commentInputRef = useRef<HTMLTextAreaElement>(null);

  const detailsRef = useRef<HTMLDivElement | null>(null); // 👈 add this

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

  // Format duration from seconds to mm:ss
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Load song data
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
        // Fetch profiles for all comment authors
        const userIds = [...new Set(commentsData.map((c: any) => c.user_id))];
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, display_name, avatar_url')
          .in('id', userIds);

        // Build profiles map with resolved avatar URLs
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

  // Add recording
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

  // Delete recording
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

  // Add comment
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

      // Fetch the user's profile for display
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

  // Delete comment
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

  // Format relative time
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

  // Get icon for recording based on URL
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

  // Loading state
  if (loading) {
    return (
      <IonPage>
        <IonContent
          fullscreen
          style={{
            '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
              gap: 12,
            }}
          >
            <IonSpinner
              name="crescent"
              style={{ '--color': '#f472b6', width: 32, height: 32 }}
            />
            <span style={{ fontSize: 14, color: '#6b7280' }}>
              Loading song…
            </span>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  // Not found state
  if (!song) {
    return (
      <IonPage>
        <IonContent
          fullscreen
          style={{
            '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: '100vh',
              padding: 24,
              gap: 16,
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: 'rgba(244, 114, 182, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IonIcon
                icon={musicalNotesOutline}
                style={{ fontSize: 32, color: '#f472b6' }}
              />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
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
                border: '1px solid rgba(148, 163, 184, 0.3)',
                background: 'transparent',
                color: '#9ca3af',
                fontSize: 15,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Go back
            </button>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8, 8, 12, 0.98)',
            borderBottom: '0.5px solid rgba(255, 255, 255, 0.06)',
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
            <IonButton
              onClick={onBack}
              fill="clear"
              style={{
                minWidth: 0,
                padding: 6,
                margin: 0,
                '--padding-start': '0',
                '--padding-end': '0',
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#F9FAFB', fontSize: 24 }}
              />
            </IonButton>

            {/* Tappable header card */}
            <button
              type="button"
              onClick={() => {
                triggerHaptic();
                if (detailsRef.current) {
                  detailsRef.current.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start',
                  });
                }
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
                background:
                  pressedButton === 'header'
                    ? 'rgba(244, 114, 182, 0.16)'
                    : 'rgba(255, 255, 255, 0.04)',
                border:
                  pressedButton === 'header'
                    ? '1px solid rgba(244, 114, 182, 0.4)'
                    : '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 14,
                padding: '10px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                cursor: 'pointer',
                transition: 'all 100ms ease-out',
                transform:
                  pressedButton === 'header' ? 'scale(0.98)' : 'scale(1)',
              }}
            >
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#F9FAFB',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    display: 'block',
                    lineHeight: 1.2,
                  }}
                >
                  {song.title}
                </span>

                {/* origin + band */}
                <span
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    display: 'block',
                  }}
                >
                  {song.origin === 'cover' && song.original_artist
                    ? `Cover of ${song.original_artist}`
                    : song.origin === 'cover'
                    ? 'Cover'
                    : 'Original'}
                  {song.band_name && ` • ${song.band_name}`}
                </span>

                {/* Tap for details helper text */}
                <span
                  style={{
                    fontSize: 11,
                    color: pressedButton === 'header' ? '#f9a8d4' : '#4b5563',
                    marginTop: 2,
                  }}
                >
                  Tap for details
                </span>
              </div>
            </button>

            {onEdit && isAdmin && (
              <IonButton
                onClick={() => onEdit(song.id)}
                fill="clear"
                style={{
                  minWidth: 0,
                  padding: 6,
                  margin: 0,
                  '--padding-start': '0',
                  '--padding-end': '0',
                }}
              >
                <IonIcon
                  icon={createOutline}
                  style={{ color: '#f472b6', fontSize: 22 }}
                />
              </IonButton>
            )}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
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
          {/* Stats row */}
          <div
            style={{
              display: 'flex',
              gap: 10,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            {song.default_key && (
              <div
                style={{
                  flex: '1 1 calc(50% - 5px)',
                  minWidth: 120,
                  background: 'rgba(244, 114, 182, 0.08)',
                  border: '1px solid rgba(244, 114, 182, 0.2)',
                  borderRadius: 14,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <IonIcon
                  icon={musicalNotesOutline}
                  style={{ fontSize: 20, color: '#f472b6' }}
                />
                <div>
                  <div
                    style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}
                  >
                    KEY
                  </div>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, color: '#f472b6' }}
                  >
                    {song.default_key}
                  </div>
                </div>
              </div>
            )}

            {song.default_bpm && (
              <div
                style={{
                  flex: '1 1 calc(50% - 5px)',
                  minWidth: 120,
                  background: 'rgba(244, 114, 182, 0.08)',
                  border: '1px solid rgba(244, 114, 182, 0.2)',
                  borderRadius: 14,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <IonIcon
                  icon={speedometerOutline}
                  style={{ fontSize: 20, color: '#f472b6' }}
                />
                <div>
                  <div
                    style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}
                  >
                    BPM
                  </div>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, color: '#f472b6' }}
                  >
                    {song.default_bpm}
                  </div>
                </div>
              </div>
            )}

            {song.duration && (
              <div
                style={{
                  flex: '1 1 calc(50% - 5px)',
                  minWidth: 120,
                  background: 'rgba(244, 114, 182, 0.08)',
                  border: '1px solid rgba(244, 114, 182, 0.2)',
                  borderRadius: 14,
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <IonIcon
                  icon={timeOutline}
                  style={{ fontSize: 20, color: '#f472b6' }}
                />
                <div>
                  <div
                    style={{ fontSize: 11, color: '#6b7280', marginBottom: 2 }}
                  >
                    DURATION
                  </div>
                  <div
                    style={{ fontSize: 18, fontWeight: 700, color: '#f472b6' }}
                  >
                    {formatDuration(song.duration)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Band Notes Section (Comments) */}
          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
            }}
          >
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
                style={{ fontSize: 18, color: '#f472b6' }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Band Notes
              </span>
              {comments.length > 0 && (
                <span
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    marginLeft: 4,
                  }}
                >
                  ({comments.length})
                </span>
              )}
            </div>

            {/* Comments list */}
            {comments.length > 0 ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
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
                      borderRadius: 14,
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(71, 85, 105, 0.2)',
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
                          background: 'rgba(244, 114, 182, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IonIcon
                          icon={personCircleOutline}
                          style={{ fontSize: 24, color: '#f472b6' }}
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
                            color: '#F9FAFB',
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

                    {/* Delete button (own comments or admin) */}
                    {(comment.user_id === currentUserId || isAdmin) && (
                      <button
                        onClick={() => handleDeleteComment(comment.id)}
                        style={{
                          padding: 6,
                          borderRadius: 8,
                          background: 'transparent',
                          border: 'none',
                          color: '#4b5563',
                          cursor: 'pointer',
                          alignSelf: 'flex-start',
                          transition: 'color 100ms',
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

            {/* Add comment input */}
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
                placeholder="Add a note…"
                rows={2}
                style={{
                  flex: 1,
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(244, 114, 182, 0.3)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#F9FAFB',
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
                  borderRadius: 14,
                  border: 'none',
                  background:
                    newComment.trim() && !sendingComment
                      ? '#f472b6'
                      : 'rgba(244, 114, 182, 0.3)',
                  color:
                    newComment.trim() && !sendingComment ? '#000' : '#6b7280',
                  cursor:
                    newComment.trim() && !sendingComment
                      ? 'pointer'
                      : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  transition: 'all 100ms',
                }}
              >
                {sendingComment ? (
                  <IonSpinner
                    name="crescent"
                    style={{ width: 20, height: 20, '--color': '#f472b6' }}
                  />
                ) : (
                  <IonIcon icon={sendOutline} style={{ fontSize: 22 }} />
                )}
              </button>
            </div>
          </div>

          {/* Recordings Section */}
          <div
            style={{
              background:
                'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
              border: '1px solid rgba(71, 85, 105, 0.3)',
              borderRadius: 20,
              padding: 20,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
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
                  style={{ fontSize: 18, color: '#f472b6' }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                  }}
                >
                  Links
                </span>
              </div>

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
                  borderRadius: 20,
                  border: '1px solid rgba(244, 114, 182, 0.4)',
                  background: 'rgba(244, 114, 182, 0.15)',
                  color: '#f472b6',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 100ms ease-out',
                  transform:
                    pressedButton === 'addRecording'
                      ? 'scale(0.95)'
                      : 'scale(1)',
                }}
              >
                <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
                Add
              </button>
            </div>

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
                      background: 'rgba(15, 23, 42, 0.6)',
                      border: '1px solid rgba(71, 85, 105, 0.3)',
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
                          color: '#F9FAFB',
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
                        background: 'rgba(244, 114, 182, 0.15)',
                        color: '#f472b6',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textDecoration: 'none',
                      }}
                    >
                      <IonIcon icon={openOutline} style={{ fontSize: 18 }} />
                    </a>

                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteRecording(recording.id)}
                        style={{
                          padding: 8,
                          borderRadius: 8,
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none',
                          color: '#f87171',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
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
              '--background': 'rgba(8, 8, 12, 0.98)',
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
                  borderRadius: 24,
                  padding: 24,
                  background:
                    'linear-gradient(135deg, rgba(30, 41, 59, 0.6) 0%, rgba(15, 23, 42, 0.8) 100%)',
                  border: '1px solid rgba(244, 114, 182, 0.3)',
                  boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    marginBottom: 20,
                    fontSize: 22,
                    fontWeight: 800,
                    color: '#F9FAFB',
                  }}
                >
                  Add Link
                </h3>

                <div style={{ marginBottom: 16 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    Label
                  </label>
                  <input
                    value={newRecordingLabel}
                    onChange={(e) => setNewRecordingLabel(e.target.value)}
                    placeholder="e.g. Original Recording, Tutorial, Our Version"
                    style={{
                      width: '100%',
                      borderRadius: 12,
                      border: '1px solid rgba(244, 114, 182, 0.4)',
                      padding: '14px 16px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      color: '#F9FAFB',
                      fontSize: 16,
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ marginBottom: 24 }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
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
                      borderRadius: 12,
                      border: '1px solid rgba(244, 114, 182, 0.4)',
                      padding: '14px 16px',
                      background: 'rgba(15, 23, 42, 0.8)',
                      color: '#F9FAFB',
                      fontSize: 16,
                      outline: 'none',
                    }}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    gap: 12,
                  }}
                >
                  <button
                    type="button"
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
                      border: '1px solid rgba(148, 163, 184, 0.3)',
                      background: 'transparent',
                      color: '#9ca3af',
                      fontSize: 15,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
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
                      border: 'none',
                      background: '#f472b6',
                      color: '#000',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: 'pointer',
                      opacity:
                        savingRecording ||
                        !newRecordingLabel.trim() ||
                        !newRecordingUrl.trim()
                          ? 0.5
                          : 1,
                    }}
                  >
                    {savingRecording ? 'Adding…' : 'Add'}
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
