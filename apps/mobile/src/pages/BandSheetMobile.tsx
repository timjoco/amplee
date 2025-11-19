/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonLabel,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { chevronForwardOutline } from 'ionicons/icons';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BandOverviewMobile from '../components/Bands/BandOverviewMobile';
import BandSettingsSheetMobile from '../components/Bands/BandSheetModal';
import EventInboxListMobile from '../components/Events/EventsInboxListMobile';
import AvatarImageMobile from '../components/ui/AvatarImageMobile';
import { supabase } from '../lib/supabase';

type MembershipRole = 'admin' | 'member';

type TabKey = 'overview' | 'events' | 'proposals' | 'roster';

export default function BandSheetMobile() {
  const params = useParams<{ bandId?: string; id?: string }>();
  const navigate = useNavigate();

  const AVATAR_SIZE = 70;

  const bandId = params.bandId ?? params.id ?? null;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [bandName, setBandName] = React.useState<string>('Band');
  const [bandAvatarUrl, setBandAvatarUrl] = React.useState<string | null>(null);
  const [bandAvatarUpdatedAt, setBandAvatarUpdatedAt] = React.useState<
    string | null
  >(null);
  const [myRole, setMyRole] = React.useState<MembershipRole>('member');
  const [tab, setTab] = React.useState<TabKey>('overview');

  const [showBandSettings, setShowBandSettings] = React.useState(false);

  React.useEffect(() => {
    if (!bandId) {
      navigate('/home', { replace: true });
    }
  }, [bandId, navigate]);

  React.useEffect(() => {
    if (!bandId) return;

    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
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

        // band record (include updated_at for avatar cache-busting)
        const { data: band, error: bandErr } = await supabase
          .from('bands')
          .select('id, name, avatar_url, updated_at')
          .eq('id', bandId)
          .maybeSingle();

        if (bandErr) throw bandErr;
        if (!band) {
          setError('Band not found.');
          return;
        }

        setBandName(band.name);
        setBandAvatarUrl(band.avatar_url ?? null);
        setBandAvatarUpdatedAt(band.updated_at ?? null);
      } catch (e: any) {
        console.error('BandSheetMobile load error', e);
        setError(e?.message || 'Failed to load band.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  React.useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ tab?: TabKey }>;
      if (ce.detail?.tab) {
        setTab(ce.detail.tab);
      }
    };

    window.addEventListener('amplee:band-tab', handler as EventListener);
    return () => {
      window.removeEventListener('amplee:band-tab', handler as EventListener);
    };
  }, []);

  if (!bandId) {
    // short-circuit while redirect happens
    return (
      <IonPage>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Band</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent className="ion-padding">
          <IonSpinner />
        </IonContent>
      </IonPage>
    );
  }

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
              width: '100%',
              paddingInline: 21,
              paddingBlock: 6,
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowBandSettings(true);
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px',
                borderRadius: 20,
                background: 'rgba(14, 15, 16, 0.98)',
                border: '.5px solid #41235eff',
                boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {/* LEFT: avatar */}
              <div
                style={{
                  flex: '0 0 auto',
                  marginRight: 10,
                }}
              >
                <AvatarImageMobile
                  name={bandName}
                  bucket="band-avatars"
                  avatarPath={bandAvatarUrl || undefined}
                  updatedAt={bandAvatarUpdatedAt || undefined}
                  size={AVATAR_SIZE}
                />
              </div>

              {/* CENTER: band name + chevron */}
              <div
                style={{
                  flex: '1 1 auto',
                  display: 'flex',
                  justifyContent: 'center',
                  pointerEvents: 'none',
                }}
              >
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    maxWidth: '100%',
                  }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: '#F9FAFB',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '100%',
                    }}
                  >
                    {bandName}
                  </span>
                  <IonIcon
                    icon={chevronForwardOutline}
                    style={{ fontSize: 20, color: '#ffffffff', flexShrink: 0 }}
                  />
                </div>
              </div>

              {/* RIGHT: spacer to keep name centered */}
              <div
                style={{
                  flex: '0 0 auto',
                  width: AVATAR_SIZE,
                  marginLeft: 10,
                  visibility: 'hidden',
                }}
              />
            </button>

            {/* Band settings modal */}
            <BandSettingsSheetMobile
              isOpen={showBandSettings}
              onDismiss={() => setShowBandSettings(false)}
              bandId={bandId as string}
              bandName={bandName}
              avatarPath={bandAvatarUrl || undefined}
              isAdmin={myRole === 'admin'}
            />
          </div>
        </IonToolbar>

        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <IonSegment
            value={tab}
            onIonChange={(e) => setTab(e.detail.value as TabKey)}
            className="event-tabs"
          >
            <IonSegmentButton value="overview">
              <IonLabel>Overview</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="events">
              <IonLabel>Events</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="proposals">
              <IonLabel>Proposals</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="roster">
              <IonLabel>Roster</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen>
        {loading ? (
          <div
            style={{
              padding: 24,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <IonSpinner />
          </div>
        ) : error ? (
          <div style={{ padding: 16 }}>
            <IonText color="danger">
              <p>{error}</p>
            </IonText>
          </div>
        ) : (
          <>
            {tab === 'overview' && <BandOverviewMobile bandId={bandId} />}
            {tab === 'events' && (
              <div style={{ padding: '8px 16px 0' }}>
                <IonText color="light">
                  <h2
                    style={{
                      margin: '0 0 10px',
                      fontWeight: 700,
                      fontSize: 16,
                      letterSpacing: 0.2,
                    }}
                  >
                    {/* All your band’s events */}
                  </h2>
                </IonText>

                <EventInboxListMobile
                  showAvatars
                  bandId={bandId}
                  onLoaded={() => {}}
                />
              </div>
            )}

            {tab === 'proposals' && (
              <div style={{ padding: 16 }}>
                <IonText color="medium">
                  <p>Proposed gigs view coming to mobile.</p>
                </IonText>
              </div>
            )}
            {tab === 'roster' && (
              <div style={{ padding: 16 }}>
                <IonText color="medium">
                  <p>Roster view coming to mobile.</p>
                </IonText>
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
}
