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
  logoFacebook,
  logoInstagram,
  logoTiktok,
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

type StreamingLinks = {
  website?: string | null;
  spotify?: string | null;
  apple_music?: string | null;
  soundcloud?: string | null;
  bandcamp?: string | null;
  youtube?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  facebook?: string | null;
  x?: string | null;
};

const glassCardStyle = {
  background:
    'linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(15,23,42,0.4) 100%)',
  backdropFilter: 'blur(20px)',
  WebkitBackdropFilter: 'blur(20px)',
  borderRadius: 24,
  border: '1px solid rgba(139,92,246,0.15)',
  boxShadow: '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
};

const inputContainerStyle = {
  background: 'rgba(15,23,42,0.5)',
  borderRadius: 14,
  border: '1px solid rgba(71,85,105,0.4)',
  padding: '12px 16px',
  marginBottom: 12,
  transition: 'all 0.2s ease',
};

const inputLabelStyle = {
  fontSize: 11,
  fontWeight: 600,
  color: '#9ca3af',
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
  color: '#f3f4f6',
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
  const [toastOpen, setToastOpen] = useState(false);
  const [myRole, setMyRole] = useState<MembershipRole>('member');

  const [bandName, setBandName] = useState('Band');
  const [publicSlug, setPublicSlug] = useState<string | null>(null);

  const [publicBio, setPublicBio] = useState('');
  const [genres, setGenres] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');

  const [websiteUrl, setWebsiteUrl] = useState('');
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [appleMusicUrl, setAppleMusicUrl] = useState('');
  const [soundcloudUrl, setSoundcloudUrl] = useState('');
  const [bandcampUrl, setBandcampUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');

  const [instagramUrl, setInstagramUrl] = useState('');
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [xUrl, setXUrl] = useState('');

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

        const links = b.streaming_links;

        // Handle array format (new)
        if (Array.isArray(links)) {
          const findLink = (type: string) =>
            links.find((l: any) => l.type?.toLowerCase() === type)?.url || '';

          setSpotifyUrl(findLink('spotify'));
          setAppleMusicUrl(findLink('apple') || findLink('applemusic'));
          setYoutubeUrl(findLink('youtube'));
          setSoundcloudUrl(findLink('soundcloud'));
          setBandcampUrl(findLink('bandcamp'));
          setWebsiteUrl(findLink('website') || findLink('site'));
          setInstagramUrl(findLink('instagram'));
          setTiktokUrl(findLink('tiktok'));
          setFacebookUrl(findLink('facebook'));
          setXUrl(findLink('twitter') || findLink('x'));
        } else if (links && typeof links === 'object') {
          // Handle old flat object format
          const l = links as StreamingLinks;
          setWebsiteUrl(l.website ?? '');
          setSpotifyUrl(l.spotify ?? '');
          setAppleMusicUrl(l.apple_music ?? '');
          setSoundcloudUrl(l.soundcloud ?? '');
          setBandcampUrl(l.bandcamp ?? '');
          setYoutubeUrl(l.youtube ?? '');
          setInstagramUrl(l.instagram ?? '');
          setTiktokUrl(l.tiktok ?? '');
          setFacebookUrl(l.facebook ?? '');
          setXUrl(l.x ?? '');
        }

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

  const handleSave = async () => {
    if (!bandId) return;
    if (myRole !== 'admin') {
      setError('Only band admins can edit the public profile.');
      return;
    }

    triggerHaptic();

    try {
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

      // Transform links into array format for the public page
      const linksArray = [
        { url: spotifyUrl, type: 'spotify', label: 'Spotify' },
        { url: appleMusicUrl, type: 'apple', label: 'Apple Music' },
        { url: youtubeUrl, type: 'youtube', label: 'YouTube' },
        { url: soundcloudUrl, type: 'soundcloud', label: 'SoundCloud' },
        { url: bandcampUrl, type: 'bandcamp', label: 'Bandcamp' },
        { url: websiteUrl, type: 'website', label: 'Website' },
        { url: instagramUrl, type: 'instagram', label: 'Instagram' },
        { url: tiktokUrl, type: 'tiktok', label: 'TikTok' },
        { url: facebookUrl, type: 'facebook', label: 'Facebook' },
        { url: xUrl, type: 'twitter', label: 'X' },
      ].filter((link) => link.url && link.url.trim().length > 0);

      const { error: updateErr } = await supabase
        .from('bands')
        .update({
          public_bio: publicBio || null,
          city: city || null,
          state: stateVal || null,
          streaming_links: linksArray,
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

      setToastOpen(true);
    } catch (e: any) {
      console.error('[BandPublicProfileMobile] save error', e);
      setError(e?.message || 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <IonPage>
      <IonHeader translucent>
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
                style={{ color: '#9ca3af', fontSize: 22 }}
              />
            </button>

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#F9FAFB',
                  margin: 0,
                  letterSpacing: '-0.8px',
                  lineHeight: 1.15,
                }}
              >
                Public Profile
              </h1>
              {bandName && (
                <div
                  style={{
                    fontSize: 13,
                    color: '#9ca3af',
                    marginTop: 4,
                  }}
                >
                  {bandName}
                </div>
              )}
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
                'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
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
                'radial-gradient(circle, rgba(236,72,153,0.1) 0%, transparent 70%)',
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
            <p style={{ color: '#9ca3af', fontSize: 14 }}>Loading profile...</p>
          </div>
        ) : error ? (
          <div style={{ padding: 24 }}>
            <div
              style={{
                ...glassCardStyle,
                padding: 20,
                borderColor: 'rgba(239,68,68,0.3)',
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
              gap: 20,
            }}
          >
            {/* Public page URL card */}
            {publicSlug ? (
              <button
                type="button"
                onClick={handleOpenPublicPage}
                style={{
                  background:
                    'linear-gradient(135deg, rgba(139,92,246,0.2) 0%, rgba(236,72,153,0.15) 100%)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  borderRadius: 20,
                  border: '1px solid rgba(139,92,246,0.3)',
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow:
                    '0 8px 32px rgba(139,92,246,0.15), inset 0 1px 0 rgba(255,255,255,0.1)',
                  transition: 'all 0.2s ease',
                  width: '100%',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background:
                      'linear-gradient(135deg, #8b5cf6 0%, #a855f7 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(139,92,246,0.4)',
                    flexShrink: 0,
                  }}
                >
                  <IonIcon
                    icon={globeOutline}
                    style={{ fontSize: 24, color: '#fff' }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 11,
                      color: '#c4b5fd',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      fontWeight: 700,
                    }}
                  >
                    Your public page
                  </p>
                  <p
                    style={{
                      fontSize: 15,
                      color: '#f3f4f6',
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
                  style={{ fontSize: 22, color: '#34d399', flexShrink: 0 }}
                />
              </button>
            ) : (
              <div
                style={{
                  ...glassCardStyle,
                  padding: '18px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  borderColor: 'rgba(251,191,36,0.2)',
                  background:
                    'linear-gradient(135deg, rgba(251,191,36,0.1) 0%, rgba(251,191,36,0.05) 100%)',
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 14,
                    background: 'rgba(251,191,36,0.15)',
                    border: '1px solid rgba(251,191,36,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IonIcon
                    icon={globeOutline}
                    style={{ fontSize: 24, color: '#fbbf24' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#fbbf24',
                      margin: 0,
                      fontWeight: 600,
                    }}
                  >
                    No public page yet
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: '#9ca3af',
                      margin: '4px 0 0',
                    }}
                  >
                    Save your profile to create one
                  </p>
                </div>
              </div>
            )}

            {/* Bio & Genres Section */}
            <div style={{ ...glassCardStyle, padding: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(139,92,246,0.15)',
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
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#f3f4f6',
                    margin: 0,
                    letterSpacing: -0.2,
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
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ ...inputContainerStyle, flex: 1 }}>
                  <label style={inputLabelStyle}>City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Kansas City"
                    style={inputStyle}
                  />
                </div>
                <div style={{ ...inputContainerStyle, width: 100 }}>
                  <label style={inputLabelStyle}>State</label>
                  <input
                    type="text"
                    value={stateVal}
                    onChange={(e) => setStateVal(e.target.value)}
                    placeholder="MO"
                    style={inputStyle}
                  />
                </div>
              </div>
            </div>

            {/* Music Links Section */}
            <div style={{ ...glassCardStyle, padding: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(52,211,153,0.15)',
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
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#f3f4f6',
                    margin: 0,
                    letterSpacing: -0.2,
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
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>YouTube</label>
                <input
                  type="url"
                  value={youtubeUrl}
                  onChange={(e) => setYoutubeUrl(e.target.value)}
                  placeholder="https://youtube.com/..."
                  style={inputStyle}
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
                />
              </div>

              <div style={{ ...inputContainerStyle, marginBottom: 0 }}>
                <label style={inputLabelStyle}>Bandcamp</label>
                <input
                  type="url"
                  value={bandcampUrl}
                  onChange={(e) => setBandcampUrl(e.target.value)}
                  placeholder="https://yourband.bandcamp.com/"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Socials Section */}
            <div style={{ ...glassCardStyle, padding: 20 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 18,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    background: 'rgba(244,114,182,0.15)',
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
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#f3f4f6',
                    margin: 0,
                    letterSpacing: -0.2,
                  }}
                >
                  Socials & Website
                </h2>
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>Website</label>
                <input
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://yourband.com"
                  style={inputStyle}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>
                  <IonIcon
                    icon={logoInstagram}
                    style={{
                      fontSize: 14,
                      marginRight: 6,
                      verticalAlign: 'middle',
                    }}
                  />
                  Instagram
                </label>
                <input
                  type="url"
                  value={instagramUrl}
                  onChange={(e) => setInstagramUrl(e.target.value)}
                  placeholder="https://instagram.com/yourband"
                  style={inputStyle}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>
                  <IonIcon
                    icon={logoTiktok}
                    style={{
                      fontSize: 14,
                      marginRight: 6,
                      verticalAlign: 'middle',
                    }}
                  />
                  TikTok
                </label>
                <input
                  type="url"
                  value={tiktokUrl}
                  onChange={(e) => setTiktokUrl(e.target.value)}
                  placeholder="https://www.tiktok.com/@yourband"
                  style={inputStyle}
                />
              </div>

              <div style={inputContainerStyle}>
                <label style={inputLabelStyle}>
                  <IonIcon
                    icon={logoFacebook}
                    style={{
                      fontSize: 14,
                      marginRight: 6,
                      verticalAlign: 'middle',
                    }}
                  />
                  Facebook
                </label>
                <input
                  type="url"
                  value={facebookUrl}
                  onChange={(e) => setFacebookUrl(e.target.value)}
                  placeholder="https://facebook.com/yourband"
                  style={inputStyle}
                />
              </div>

              <div style={{ ...inputContainerStyle, marginBottom: 0 }}>
                <label style={inputLabelStyle}>X / Twitter</label>
                <input
                  type="url"
                  value={xUrl}
                  onChange={(e) => setXUrl(e.target.value)}
                  placeholder="https://x.com/yourband"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Save Button */}
            {myRole === 'admin' ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                style={{
                  width: '100%',
                  padding: '18px 24px',
                  borderRadius: 16,
                  border: 'none',
                  background: saving
                    ? 'rgba(139,92,246,0.3)'
                    : 'linear-gradient(135deg, #8b5cf6 0%, #a855f7 50%, #ec4899 100%)',
                  color: '#fff',
                  fontSize: 16,
                  fontWeight: 700,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  boxShadow: saving
                    ? 'none'
                    : '0 8px 32px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                {saving ? (
                  <>
                    <IonSpinner
                      style={{
                        '--color': '#fff',
                        width: 20,
                        height: 20,
                      }}
                    />
                    Saving...
                  </>
                ) : publicSlug ? (
                  'Save Public Profile'
                ) : (
                  'Create Public Page'
                )}
              </button>
            ) : (
              <div
                style={{
                  ...glassCardStyle,
                  padding: 16,
                  textAlign: 'center',
                }}
              >
                <p style={{ color: '#9ca3af', fontSize: 13, margin: 0 }}>
                  Only band admins can edit the public profile.
                </p>
              </div>
            )}

            {/* Visit public page button */}
            {publicSlug && (
              <button
                type="button"
                onClick={handleOpenPublicPage}
                style={{
                  width: '100%',
                  padding: '16px 24px',
                  borderRadius: 16,
                  border: '1px solid rgba(139,92,246,0.3)',
                  background: 'rgba(139,92,246,0.1)',
                  color: '#a78bfa',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease',
                }}
              >
                <IonIcon icon={globeOutline} style={{ fontSize: 20 }} />
                Visit Public Page
              </button>
            )}
          </div>
        )}

        <IonToast
          isOpen={toastOpen}
          onDidDismiss={() => setToastOpen(false)}
          message="Public profile updated ✨"
          duration={1800}
          position="bottom"
          style={{
            '--background': 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            '--color': '#f3f4f6',
            '--border-radius': '16px',
            '--box-shadow': '0 8px 32px rgba(0,0,0,0.4)',
          }}
        />
      </IonContent>
    </IonPage>
  );
}
