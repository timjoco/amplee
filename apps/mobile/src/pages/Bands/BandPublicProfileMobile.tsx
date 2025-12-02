/* eslint-disable @typescript-eslint/no-explicit-any */
import { Browser } from '@capacitor/browser';
import { Capacitor } from '@capacitor/core';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSpinner,
  IonText,
  IonTextarea,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import { chevronBackOutline, globeOutline } from 'ionicons/icons';
import { useEffect, useState } from 'react';
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

  // content
  const [publicBio, setPublicBio] = useState('');
  const [genres, setGenres] = useState('');
  const [city, setCity] = useState('');
  const [stateVal, setStateVal] = useState('');

  // links
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

  // keep original JSON so we don't wipe unknown keys
  const [linksRaw, setLinksRaw] = useState<any>({});

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

        // auth
        const { data: auth } = await supabase.auth.getUser();
        if (!alive) return;
        const user = auth?.user;
        if (!user) {
          setError('You must be signed in to view this band.');
          return;
        }

        // membership
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

        // band profile
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
            is_public
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

        console.log('[BandPublicProfileMobile] band data:', {
          id: b.id,
          name: b.name,
          public_slug: b.public_slug,
          is_public: b.is_public,
        });

        setBandName(b.name);
        setPublicBio(b.public_bio ?? '');
        setCity(b.city ?? '');
        setStateVal(b.state ?? '');
        setPublicSlug(b.public_slug ?? null);

        const links: StreamingLinks = (b.streaming_links ||
          {}) as StreamingLinks;
        setLinksRaw(links);

        setWebsiteUrl(links.website ?? '');
        setSpotifyUrl(links.spotify ?? '');
        setAppleMusicUrl(links.apple_music ?? '');
        setSoundcloudUrl(links.soundcloud ?? '');
        setBandcampUrl(links.bandcamp ?? '');
        setYoutubeUrl(links.youtube ?? '');

        setInstagramUrl(links.instagram ?? '');
        setTiktokUrl(links.tiktok ?? '');
        setFacebookUrl(links.facebook ?? '');
        setXUrl(links.x ?? '');

        // genres via band_genres join
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

    try {
      setSaving(true);
      setError(null);

      // Generate slug if doesn't exist
      let slugToUse = publicSlug;
      if (!slugToUse) {
        const baseSlug = bandName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '');

        slugToUse = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
      }

      const updatedLinks: StreamingLinks = {
        ...linksRaw,
        website: websiteUrl || null,
        spotify: spotifyUrl || null,
        apple_music: appleMusicUrl || null,
        soundcloud: soundcloudUrl || null,
        bandcamp: bandcampUrl || null,
        youtube: youtubeUrl || null,
        instagram: instagramUrl || null,
        tiktok: tiktokUrl || null,
        facebook: facebookUrl || null,
        x: xUrl || null,
      };

      const { error: updateErr } = await supabase
        .from('bands')
        .update({
          public_bio: publicBio || null,
          city: city || null,
          state: stateVal || null,
          streaming_links: updatedLinks,
          public_slug: slugToUse,
          is_public: true,
        })
        .eq('id', bandId);

      if (updateErr) throw updateErr;

      setPublicSlug(slugToUse);

      // genres via RPC
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
          <button
            type="button"
            onClick={() => navigate(-1)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '10px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
            }}
          >
            <IonIcon
              icon={chevronBackOutline}
              style={{ fontSize: 20, color: '#9ca3af' }}
            />
            <span
              style={{
                fontSize: 14,
                color: '#e5e7eb',
                fontWeight: 500,
                letterSpacing: 0.1,
              }}
            >
              {bandName}
            </span>
          </button>

          <IonTitle
            style={{
              textAlign: 'center',
              fontSize: 16,
              fontWeight: 700,
              color: '#f9fafb',
              letterSpacing: 0.3,
            }}
          >
            Public Profile
          </IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY
        className="ion-padding"
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {loading ? (
          <div
            style={{
              paddingTop: 32,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <IonSpinner />
          </div>
        ) : error ? (
          <div style={{ paddingTop: 16 }}>
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        ) : (
          <div
            style={{
              maxWidth: 640,
              margin: '0 auto 40px',
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Public page URL preview */}
            {publicSlug && (
              <div
                style={{
                  background:
                    'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.05) 100%)',
                  borderRadius: 16,
                  border: '1px solid rgba(139,92,246,0.3)',
                  padding: 14,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <IonIcon
                  icon={globeOutline}
                  style={{ fontSize: 24, color: '#a78bfa', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 11,
                      color: '#9ca3af',
                      margin: 0,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontWeight: 600,
                    }}
                  >
                    Your public page
                  </p>
                  <p
                    style={{
                      fontSize: 14,
                      color: '#e5e7eb',
                      margin: '4px 0 0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    amplee.app/b/{publicSlug}
                  </p>
                </div>
              </div>
            )}

            {/* Bio + genres + location */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.7) 100%)',
                borderRadius: 20,
                border: '1px solid rgba(55,65,81,0.8)',
                padding: 14,
              }}
            >
              <IonText>
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#e5e7eb',
                    marginBottom: 8,
                  }}
                >
                  Bio &amp; Genres
                </h2>
              </IonText>
              <IonList lines="none">
                <IonItem>
                  <IonLabel position="stacked">Public bio</IonLabel>
                  <IonTextarea
                    value={publicBio}
                    rows={4}
                    autoGrow
                    onIonChange={(e) => setPublicBio(e.detail.value ?? '')}
                    placeholder="Tell people who you are, what you sound like, and what they can expect at a show."
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">
                    Genres (comma separated)
                  </IonLabel>
                  <IonInput
                    value={genres}
                    onIonChange={(e) => setGenres(e.detail.value ?? '')}
                    placeholder="Indie rock, Americana, Folk"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">City</IonLabel>
                  <IonInput
                    value={city}
                    onIonChange={(e) => setCity(e.detail.value ?? '')}
                    placeholder="Kansas City"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">State</IonLabel>
                  <IonInput
                    value={stateVal}
                    onIonChange={(e) => setStateVal(e.detail.value ?? '')}
                    placeholder="MO"
                  />
                </IonItem>
              </IonList>
            </div>

            {/* Music links */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.7) 100%)',
                borderRadius: 20,
                border: '1px solid rgba(55,65,81,0.8)',
                padding: 14,
              }}
            >
              <IonText>
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#e5e7eb',
                    marginBottom: 8,
                  }}
                >
                  Music Links
                </h2>
              </IonText>
              <IonList lines="none">
                <IonItem>
                  <IonLabel position="stacked">Spotify</IonLabel>
                  <IonInput
                    value={spotifyUrl}
                    onIonChange={(e) => setSpotifyUrl(e.detail.value ?? '')}
                    placeholder="https://open.spotify.com/artist/..."
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Apple Music</IonLabel>
                  <IonInput
                    value={appleMusicUrl}
                    onIonChange={(e) => setAppleMusicUrl(e.detail.value ?? '')}
                    placeholder="https://music.apple.com/..."
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">YouTube</IonLabel>
                  <IonInput
                    value={youtubeUrl}
                    onIonChange={(e) => setYoutubeUrl(e.detail.value ?? '')}
                    placeholder="https://youtube.com/..."
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">SoundCloud</IonLabel>
                  <IonInput
                    value={soundcloudUrl}
                    onIonChange={(e) => setSoundcloudUrl(e.detail.value ?? '')}
                    placeholder="https://soundcloud.com/..."
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Bandcamp</IonLabel>
                  <IonInput
                    value={bandcampUrl}
                    onIonChange={(e) => setBandcampUrl(e.detail.value ?? '')}
                    placeholder="https://yourband.bandcamp.com/"
                  />
                </IonItem>
              </IonList>
            </div>

            {/* Socials + website */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(15,23,42,0.85) 0%, rgba(15,23,42,0.7) 100%)',
                borderRadius: 20,
                border: '1px solid rgba(55,65,81,0.8)',
                padding: 14,
              }}
            >
              <IonText>
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#e5e7eb',
                    marginBottom: 8,
                  }}
                >
                  Socials &amp; Website
                </h2>
              </IonText>
              <IonList lines="none">
                <IonItem>
                  <IonLabel position="stacked">Website</IonLabel>
                  <IonInput
                    value={websiteUrl}
                    onIonChange={(e) => setWebsiteUrl(e.detail.value ?? '')}
                    placeholder="https://yourband.com"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Instagram</IonLabel>
                  <IonInput
                    value={instagramUrl}
                    onIonChange={(e) => setInstagramUrl(e.detail.value ?? '')}
                    placeholder="https://instagram.com/yourband"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">TikTok</IonLabel>
                  <IonInput
                    value={tiktokUrl}
                    onIonChange={(e) => setTiktokUrl(e.detail.value ?? '')}
                    placeholder="https://www.tiktok.com/@yourband"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">Facebook</IonLabel>
                  <IonInput
                    value={facebookUrl}
                    onIonChange={(e) => setFacebookUrl(e.detail.value ?? '')}
                    placeholder="https://facebook.com/yourband"
                  />
                </IonItem>
                <IonItem>
                  <IonLabel position="stacked">X / Twitter</IonLabel>
                  <IonInput
                    value={xUrl}
                    onIonChange={(e) => setXUrl(e.detail.value ?? '')}
                    placeholder="https://x.com/yourband"
                  />
                </IonItem>
              </IonList>
            </div>

            {/* Save + Visit public page */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginTop: 4,
              }}
            >
              {myRole === 'admin' ? (
                <IonButton
                  expand="block"
                  onClick={handleSave}
                  disabled={saving}
                >
                  {saving
                    ? 'Saving…'
                    : publicSlug
                    ? 'Save Public Profile'
                    : 'Create Public Page'}
                </IonButton>
              ) : (
                <IonText color="medium">
                  <p
                    style={{
                      fontSize: 12,
                      textAlign: 'center',
                      marginTop: 8,
                    }}
                  >
                    Only band admins can edit the public profile.
                  </p>
                </IonText>
              )}

              {publicSlug ? (
                <IonButton
                  expand="block"
                  fill="outline"
                  color="medium"
                  onClick={handleOpenPublicPage}
                >
                  <IonIcon icon={globeOutline} slot="start" />
                  Visit public page
                </IonButton>
              ) : (
                myRole === 'admin' && (
                  <p
                    style={{
                      fontSize: 12,
                      textAlign: 'center',
                      color: '#9ca3af',
                      marginTop: 4,
                    }}
                  >
                    Save to create your public page at amplee.app/b/your-band
                  </p>
                )
              )}
            </div>
          </div>
        )}

        <IonToast
          isOpen={toastOpen}
          onDidDismiss={() => setToastOpen(false)}
          message="Public profile updated"
          duration={1400}
          position="bottom"
          color="success"
        />
      </IonContent>
    </IonPage>
  );
}
