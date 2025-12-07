/* eslint-disable @typescript-eslint/no-explicit-any */
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
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
  checkmarkCircleOutline,
  chevronBackOutline,
  globeOutline,
  linkOutline,
  musicalNotesOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type MembershipRole = 'admin' | 'member';

type BandProfileRow = {
  id: string;
  name: string;
  public_bio: string | null;
  city: string | null;
  state: string | null;
  streaming_links: any | null;
  public_slug: string | null;
  is_public: boolean;
  public_avatar_enabled: boolean;
};

const glassCardStyle = {
  background: 'rgba(30, 31, 34, 0.6)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  borderRadius: 20,
  border: '1px solid rgba(255, 255, 255, 0.06)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
};

const inputContainerStyle = {
  background: 'rgba(15, 23, 42, 0.5)',
  borderRadius: 12,
  border: '1px solid rgba(71, 85, 105, 0.4)',
  padding: '12px 14px',
  marginBottom: 10,
  transition: 'all 0.2s ease',
};

const inputLabelStyle = {
  fontSize: 10,
  fontWeight: 700,
  color: '#94a3b8',
  textTransform: 'uppercase' as const,
  letterSpacing: 0.8,
  marginBottom: 6,
  display: 'block',
};

const inputStyle = {
  width: '100%',
  background: 'transparent',
  border: 'none',
  outline: 'none',
  fontSize: 15,
  color: '#e2e8f0',
  fontWeight: 500,
};

const textareaStyle = {
  ...inputStyle,
  resize: 'none' as const,
  minHeight: 100,
  lineHeight: 1.6,
};

export default function BandPublicProfileMobile() {
  const params = useParams<{ bandId?: string; id?: string }>();
  const navigate = useNavigate();
  const bandId = params.bandId ?? params.id ?? null;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [myRole, setMyRole] = useState<MembershipRole>('member');

  const [bandName, setBandName] = useState('Band');
  const [publicSlug, setPublicSlug] = useState<string | null>(null);

  const [publicBio, setPublicBio] = useState('');
  const [genres, setGenres] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');

  // Music links
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [appleMusicUrl, setAppleMusicUrl] = useState('');
  const [bandcampUrl, setBandcampUrl] = useState('');
  const [tidalUrl, setTidalUrl] = useState('');
  const [soundcloudUrl, setSoundcloudUrl] = useState('');
  const [youtubeMusicUrl, setYoutubeMusicUrl] = useState('');

  // Social links
  const [facebookUrl, setFacebookUrl] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [xUrl, setXUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.warn('[haptic error]', e);
    }
  }, []);

  useEffect(() => {
    if (!bandId) {
      navigate('/home', { replace: true });
    }
  }, [bandId, navigate]);

  useEffect(() => {
    if (!bandId) return;

    let alive = true;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const { data: auth } = await supabase.auth.getUser();
        if (!alive) return;
        const user = auth?.user;
        if (!user) {
          setError('You must be signed in to view this band.');
          return;
        }

        const { data: mem, error: memErr } = await supabase
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (memErr) throw memErr;
        if (!mem) {
          setError('You do not have access to this band.');
          return;
        }
        setMyRole((mem.role as MembershipRole) ?? 'member');

        const { data: band, error: bandErr } = await supabase
          .from('bands')
          .select(
            `
            id,
            name,
            public_bio,
            city,
            state,
            streaming_links,
            public_slug,
            is_public,
            public_avatar_enabled
          `
          )
          .eq('id', bandId)
          .maybeSingle();

        if (bandErr) throw bandErr;
        if (!band) {
          setError('Band not found.');
          return;
        }
        if (!alive) return;

        const b = band as BandProfileRow;

        setBandName(b.name);
        setPublicBio(b.public_bio ?? '');
        setCity(b.city ?? '');
        setStateVal(b.state ?? '');
        setPublicSlug(b.public_slug ?? null);

        // Parse links array
        const links = Array.isArray(b.streaming_links) ? b.streaming_links : [];

        const findLink = (type: string) => {
          const link = links.find(
            (l: any) => l.type?.toLowerCase() === type.toLowerCase()
          );
          return link?.url || '';
        };

        // Set music links
        setSpotifyUrl(findLink('spotify'));
        setAppleMusicUrl(findLink('apple') || findLink('applemusic'));
        setBandcampUrl(findLink('bandcamp'));
        setTidalUrl(findLink('tidal'));
        setSoundcloudUrl(findLink('soundcloud'));
        setYoutubeMusicUrl(findLink('youtube') || findLink('youtubemusic'));

        // Set social links
        setFacebookUrl(findLink('facebook'));
        setInstagramUrl(findLink('instagram'));
        setTiktokUrl(findLink('tiktok'));
        setXUrl(findLink('twitter') || findLink('x'));
        setYoutubeUrl(findLink('youtube'));
        setWebsiteUrl(findLink('website') || findLink('site'));

        const { data: bandGenres, error: bandGenresErr } = await supabase
          .from('band_genres')
          .select('genres(name)')
          .eq('band_id', bandId);

        if (bandGenresErr) throw bandGenresErr;

        const genreNames =
          bandGenres
            ?.map((row: any) => row.genres?.name as string | undefined)
            .filter(Boolean) ?? [];

        setGenres(genreNames.join(', '));
      } catch (e: any) {
        console.error('[BandPublicProfileMobile] load error', e);
        if (alive) setError(e?.message || 'Failed to load band profile.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  const handleSave = async () => {
    if (!bandId || myRole !== 'admin') return;

    try {
      triggerHaptic();
      setSaving(true);
      setError(null);

      let slugToUse = publicSlug;
      if (!slugToUse) {
        const baseSlug = bandName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        slugToUse = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
      }

      // Build links array
      const allLinks = [
        { url: spotifyUrl, type: 'spotify', label: 'Spotify' },
        { url: appleMusicUrl, type: 'apple', label: 'Apple Music' },
        { url: bandcampUrl, type: 'bandcamp', label: 'Bandcamp' },
        { url: tidalUrl, type: 'tidal', label: 'Tidal' },
        { url: soundcloudUrl, type: 'soundcloud', label: 'SoundCloud' },
        { url: youtubeMusicUrl, type: 'youtube', label: 'YouTube Music' },
        { url: facebookUrl, type: 'facebook', label: 'Facebook' },
        { url: instagramUrl, type: 'instagram', label: 'Instagram' },
        { url: tiktokUrl, type: 'tiktok', label: 'TikTok' },
        { url: xUrl, type: 'twitter', label: 'X' },
        { url: youtubeUrl, type: 'youtube', label: 'YouTube' },
        { url: websiteUrl, type: 'website', label: 'Website' },
      ].filter((link) => link.url && link.url.trim().length > 0);

      const { error: updateErr } = await supabase
        .from('bands')
        .update({
          public_bio: publicBio || null,
          city: city || null,
          state: stateVal || null,
          streaming_links: allLinks,
          public_slug: slugToUse,
          is_public: true,
          public_avatar_enabled: true,
        })
        .eq('id', bandId);

      if (updateErr) throw updateErr;

      setPublicSlug(slugToUse);

      const genreNames =
        genres.trim().length > 0
          ? genres
              .split(',')
              .map((g) => g.trim())
              .filter(Boolean)
          : [];

      const { error: genresErr } = await supabase.rpc('set_band_genres', {
        p_band_id: bandId,
        p_genres: genreNames,
      });

      if (genresErr) throw genresErr;

      setToastMessage('Profile saved ✨');
      setToastOpen(true);
    } catch (e: any) {
      console.error('[BandPublicProfileMobile] save error', e);
      setError(e?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPublicPage = async () => {
    if (!publicSlug) return;
    triggerHaptic();

    const url = `https://amplee.app/b/${publicSlug}`;

    try {
      if (Capacitor.getPlatform() === 'web') {
        window.open(url, '_blank', 'noopener,noreferrer');
      } else {
        await Browser.open({ url });
      }
    } catch (e) {
      console.warn('[BandPublicProfileMobile] open public page error', e);
    }
  };

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
              justifyContent: 'space-between',
              padding: '16px',
              gap: 12,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                flex: 1,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  triggerHaptic();
                  navigate(`/bands/${bandId}`);
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 6,
                  margin: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                <IonIcon
                  icon={chevronBackOutline}
                  style={{ color: '#94a3b8', fontSize: 22 }}
                />
              </button>

              <div style={{ flex: 1 }}>
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    color: '#e2e8f0',
                    margin: 0,
                    letterSpacing: -0.5,
                  }}
                >
                  Public Profile
                </h1>
                {bandName && (
                  <div
                    style={{
                      fontSize: 12,
                      color: '#64748b',
                      marginTop: 2,
                    }}
                  >
                    {bandName}
                  </div>
                )}
              </div>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY
        style={{
          '--background': '#050509',
        }}
      >
        {/* Background gradient orbs */}
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            pointerEvents: 'none',
            overflow: 'hidden',
            zIndex: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: '-20%',
              left: '-30%',
              width: '80%',
              height: '60%',
              background:
                'radial-gradient(circle, rgba(139, 92, 246, 0.12) 0%, transparent 70%)',
              filter: 'blur(60px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '10%',
              right: '-20%',
              width: '60%',
              height: '50%',
              background:
                'radial-gradient(circle, rgba(236, 72, 153, 0.08) 0%, transparent 70%)',
              filter: 'blur(80px)',
            }}
          />
        </div>

        {loading ? (
          <div
            style={{
              paddingTop: 80,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <IonSpinner
              style={{
                '--color': '#a78bfa',
                width: 32,
                height: 32,
              }}
            />
            <p style={{ color: '#94a3b8', fontSize: 14 }}>Loading profile...</p>
          </div>
        ) : error ? (
          <div style={{ padding: 24 }}>
            <div
              style={{
                ...glassCardStyle,
                padding: 20,
                borderColor: 'rgba(239, 68, 68, 0.3)',
              }}
            >
              <IonText color="danger">
                <p style={{ margin: 0, fontSize: 14 }}>{error}</p>
              </IonText>
            </div>
          </div>
        ) : (
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '20px 16px 100px',
              maxWidth: 640,
              margin: '0 auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Public page URL card */}
            {publicSlug ? (
              <button
                type="button"
                onClick={handleOpenPublicPage}
                style={{
                  background:
                    'linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(236, 72, 153, 0.1) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: 16,
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.12)',
                  transition: 'all 0.2s ease',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background:
                      'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.3)',
                    flexShrink: 0,
                  }}
                >
                  <IonIcon
                    icon={globeOutline}
                    style={{ fontSize: 22, color: '#fff' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 10,
                      color: '#c4b5fd',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      fontWeight: 700,
                    }}
                  >
                    Your public page
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#e2e8f0',
                      margin: '4px 0 0',
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    amplee.app/b/{publicSlug}
                  </p>
                </div>
                <IonIcon
                  icon={checkmarkCircleOutline}
                  style={{ fontSize: 20, color: '#34d399', flexShrink: 0 }}
                />
              </button>
            ) : (
              <div
                style={{
                  ...glassCardStyle,
                  padding: '16px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  borderColor: 'rgba(251, 191, 36, 0.2)',
                  background: 'rgba(251, 191, 36, 0.05)',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'rgba(251, 191, 36, 0.15)',
                    border: '1px solid rgba(251, 191, 36, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IonIcon
                    icon={globeOutline}
                    style={{ fontSize: 22, color: '#fbbf24' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 13,
                      color: '#fde68a',
                      margin: 0,
                      fontWeight: 600,
                    }}
                  >
                    No public page yet
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: '#94a3b8',
                      margin: '4px 0 0',
                    }}
                  >
                    Fill in your info and save
                  </p>
                </div>
              </div>
            )}

            {/* Non-admin notice */}
            {myRole !== 'admin' && (
              <div
                style={{
                  ...glassCardStyle,
                  padding: 14,
                  textAlign: 'center',
                  borderColor: 'rgba(251, 191, 36, 0.2)',
                }}
              >
                <p style={{ color: '#94a3b8', fontSize: 12, margin: 0 }}>
                  Only band admins can edit the public profile
                </p>
              </div>
            )}

            {/* Bio & Identity Section */}
            <div style={{ ...glassCardStyle, padding: 18 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(139, 92, 246, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IonIcon
                    icon={musicalNotesOutline}
                    style={{ fontSize: 18, color: '#a78bfa' }}
                  />
                </div>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#e2e8f0',
                    margin: 0,
                    letterSpacing: -0.3,
                  }}
                >
                  Bio & Identity
                </h2>
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>Public Bio</label>
                <textarea
                  value={publicBio}
                  onChange={(e) => setPublicBio(e.target.value)}
                  placeholder="Tell people who you are, what you sound like..."
                  style={textareaStyle}
                  rows={4}
                  disabled={myRole !== 'admin'}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>Genres</label>
                <input
                  type="text"
                  value={genres}
                  onChange={(e) => setGenres(e.target.value)}
                  placeholder="Indie rock, Americana, Folk"
                  style={inputStyle}
                  disabled={myRole !== 'admin'}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ ...inputContainerStyle, flex: 1 }}>
                  <label style={inputLabelStyle}>City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Kansas City"
                    style={inputStyle}
                    disabled={myRole !== 'admin'}
                  />
                </div>
                <div style={{ ...inputContainerStyle, width: 90 }}>
                  <label style={inputLabelStyle}>State</label>
                  <input
                    type="text"
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    placeholder="MO"
                    style={inputStyle}
                    disabled={myRole !== 'admin'}
                  />
                </div>
              </div>
            </div>

            {/* Music Links Section */}
            <div style={{ ...glassCardStyle, padding: 18 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(52, 211, 153, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IonIcon
                    icon={musicalNotesOutline}
                    style={{ fontSize: 18, color: '#34d399' }}
                  />
                </div>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#e2e8f0',
                    margin: 0,
                    letterSpacing: -0.3,
                  }}
                >
                  Music Links
                </h2>
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>Spotify</label>
                <input
                  type="url"
                  value={spotifyUrl}
                  onChange={(e) => setSpotifyUrl(e.target.value)}
                  placeholder="https://open.spotify.com/artist/..."
                  style={inputStyle}
                  disabled={myRole !== 'admin'}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>Apple Music</label>
                <input
                  type="url"
                  value={appleMusicUrl}
                  onChange={(e) => setAppleMusicUrl(e.target.value)}
                  placeholder="https://music.apple.com/..."
                  style={inputStyle}
                  disabled={myRole !== 'admin'}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>Bandcamp</label>
                <input
                  type="url"
                  value={bandcampUrl}
                  onChange={(e) => setBandcampUrl(e.target.value)}
                  placeholder="https://yourband.bandcamp.com"
                  style={inputStyle}
                  disabled={myRole !== 'admin'}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>Tidal</label>
                <input
                  type="url"
                  value={tidalUrl}
                  onChange={(e) => setTidalUrl(e.target.value)}
                  placeholder="https://tidal.com/..."
                  style={inputStyle}
                  disabled={myRole !== 'admin'}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>SoundCloud</label>
                <input
                  type="url"
                  value={soundcloudUrl}
                  onChange={(e) => setSoundcloudUrl(e.target.value)}
                  placeholder="https://soundcloud.com/..."
                  style={inputStyle}
                  disabled={myRole !== 'admin'}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>YouTube Music</label>
                <input
                  type="url"
                  value={youtubeMusicUrl}
                  onChange={(e) => setYoutubeMusicUrl(e.target.value)}
                  placeholder="https://music.youtube.com/..."
                  style={inputStyle}
                  disabled={myRole !== 'admin'}
                />
              </div>
            </div>

            {/* Social Links Section */}
            <div style={{ ...glassCardStyle, padding: 18 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(244, 114, 182, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IonIcon
                    icon={linkOutline}
                    style={{ fontSize: 18, color: '#f472b6' }}
                  />
                </div>
                <h2
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: '#e2e8f0',
                    margin: 0,
                    letterSpacing: -0.3,
                  }}
                >
                  Socials & Website
                </h2>
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>Instagram</label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/..."
                  style={inputStyle}
                  disabled={myRole !== 'admin'}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>TikTok</label>
                <input
                  type="url"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://tiktok.com/@..."
                  style={inputStyle}
                  disabled={myRole !== 'admin'}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>Facebook</label>
                <input
                  type="url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/..."
                  style={inputStyle}
                  disabled={myRole !== 'admin'}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>X (Twitter)</label>
                <input
                  type="url"
                  value={xUrl}
                  onChange={(e) => setXUrl(e.target.value)}
                  placeholder="https://x.com/..."
                  style={inputStyle}
                  disabled={myRole !== 'admin'}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>YouTube</label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/@..."
                  style={inputStyle}
                  disabled={myRole !== 'admin'}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>Website</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourband.com"
                  style={inputStyle}
                  disabled={myRole !== 'admin'}
                />
              </div>
            </div>

            {/* Save button */}
            {myRole === 'admin' && (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  borderRadius: 14,
                  border: 'none',
                  background: saving
                    ? 'rgba(139, 92, 246, 0.5)'
                    : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  boxShadow: '0 4px 16px rgba(139, 92, 246, 0.3)',
                  transition: 'all 0.2s ease',
                }}
              >
                {saving ? (
                  <>
                    <IonSpinner
                      style={{ '--color': '#fff', width: 18, height: 18 }}
                    />
                    Saving...
                  </>
                ) : (
                  'Save Profile'
                )}
              </button>
            )}

            {/* Visit public page button */}
            {publicSlug && (
              <button
                type="button"
                onClick={handleOpenPublicPage}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  borderRadius: 14,
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  background: 'rgba(139, 92, 246, 0.1)',
                  color: '#a78bfa',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                }}
              >
                <IonIcon icon={globeOutline} style={{ fontSize: 18 }} />
                Visit Public Page
              </button>
            )}
          </div>
        )}

        <IonToast
          isOpen={toastOpen}
          onDidDismiss={() => setToastOpen(false)}
          message={toastMessage}
          duration={2000}
          position="bottom"
          style={{
            '--background': 'rgba(30, 31, 34, 0.95)',
            '--color': '#e2e8f0',
            '--border-radius': '14px',
            '--box-shadow': '0 8px 32px rgba(0, 0, 0, 0.4)',
          }}
        />
      </IonContent>
    </IonPage>
  );
}
