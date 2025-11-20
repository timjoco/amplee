/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  calendarOutline,
  chevronForwardOutline,
  clipboardOutline,
  gridOutline,
  musicalNotesOutline,
  peopleOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BandOverviewMobile from '../components/Bands/BandOverviewMobile';
import BandProposalsTabMobile from '../components/Bands/BandProposalsTabMobile';
import BandSettingsSheetMobile from '../components/Bands/BandSheetModal';
import EventsInboxListMobile from '../components/Events/EventsInboxListMobile';
import AvatarImageMobile from '../components/ui/AvatarImageMobile';
import { supabase } from '../lib/supabase';

type MembershipRole = 'admin' | 'member';

type TabKey = 'overview' | 'events' | 'proposals' | 'roster' | 'library';

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

  const isAdmin = myRole === 'admin';

  const iconColor = (key: TabKey) =>
    tab === key ? TAB_META[key].accent : 'rgba(148,163,184,0.9)';

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
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)', // 5 tabs
              gridAutoRows: 'auto',
              rowGap: 4,
              padding: '0 8px',
              maxWidth: 520,
              margin: '0 auto',
            }}
          >
            {/* Row 1: segment spans all 5 columns */}
            <div style={{ gridColumn: '1 / -1' }}>
              <IonSegment
                value={tab}
                onIonChange={(e) => setTab(e.detail.value as TabKey)}
                className="event-tabs"
              >
                <IonSegmentButton
                  value="overview"
                  style={{
                    '--padding-start': '0px',
                    '--padding-end': '0px',
                  }}
                >
                  <IonIcon
                    icon={gridOutline}
                    style={{
                      fontSize: 'clamp(18px, 4vw, 22px)',
                      color: iconColor('overview'),
                    }}
                  />
                </IonSegmentButton>

                <IonSegmentButton
                  value="events"
                  style={{
                    '--padding-start': '0px',
                    '--padding-end': '0px',
                  }}
                >
                  <IonIcon
                    icon={calendarOutline}
                    style={{
                      fontSize: 'clamp(18px, 4vw, 22px)',
                      color: iconColor('events'),
                    }}
                  />
                </IonSegmentButton>

                <IonSegmentButton
                  value="proposals"
                  style={{
                    '--padding-start': '0px',
                    '--padding-end': '0px',
                  }}
                >
                  <IonIcon
                    icon={clipboardOutline}
                    style={{
                      fontSize: 'clamp(18px, 4vw, 22px)',
                      color: iconColor('proposals'),
                    }}
                  />
                </IonSegmentButton>

                <IonSegmentButton
                  value="roster"
                  style={{
                    '--padding-start': '0px',
                    '--padding-end': '0px',
                  }}
                >
                  <IonIcon
                    icon={peopleOutline}
                    style={{
                      fontSize: 'clamp(18px, 4vw, 22px)',
                      color: iconColor('roster'),
                    }}
                  />
                </IonSegmentButton>

                <IonSegmentButton
                  value="library"
                  style={{
                    '--padding-start': '0px',
                    '--padding-end': '0px',
                  }}
                >
                  <IonIcon
                    icon={musicalNotesOutline}
                    style={{
                      fontSize: 'clamp(18px, 4vw, 22px)',
                      color: iconColor('library'),
                    }}
                  />
                </IonSegmentButton>
              </IonSegment>
            </div>

            {/* Row 2: header sits in the column for the active tab */}
            {(() => {
              const meta = TAB_META[tab] ?? TAB_META.overview;
              return (
                <div
                  style={{
                    gridColumn: meta.col,
                    textAlign: 'center',
                    paddingTop: 8,
                    paddingBottom: 6,
                  }}
                >
                  <IonText color="light">
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 'clamp(11px, 3vw, 13px)',
                        letterSpacing: 0.4,
                        textTransform: 'uppercase',
                        color: meta.accent,
                      }}
                    >
                      {meta.label}
                    </p>
                  </IonText>
                </div>
              );
            })()}
          </div>
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
                {tab === 'events' && (
                  <div style={{ padding: '8px 16px 0' }}>
                    <EventsInboxListMobile
                      bandId={bandId}
                      showAvatars
                      enableCreateForBand
                      isAdmin={isAdmin}
                    />
                  </div>
                )}
              </div>
            )}

            {tab === 'proposals' && (
              <BandProposalsTabMobile bandId={bandId} isAdmin={isAdmin} />
            )}

            {tab === 'roster' && (
              <div style={{ padding: 16 }}>
                <IonText color="medium">
                  <p>Roster view coming to mobile.</p>
                </IonText>
              </div>
            )}

            {tab === 'library' && (
              <div style={{ padding: 16 }}>
                <IonText color="medium">
                  <p>Library coming soon.</p>
                </IonText>
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
}

const TAB_META: Record<string, { label: string; accent: string; col: number }> =
  {
    overview: {
      label: 'Overview',
      accent: 'rgba(139, 92, 246, 0.96)',
      col: 1,
    },
    events: {
      label: 'Events',
      accent: 'rgba(52, 211, 153, 0.95)',
      col: 2,
    },
    proposals: {
      label: 'Proposals',
      accent: 'rgba(245, 158, 11, 0.95)',
      col: 3,
    },
    roster: {
      label: 'Roster',
      accent: 'rgba(56, 189, 248, 0.96)',
      col: 4,
    },
    library: {
      label: 'Library',
      accent: 'rgba(244, 114, 182, 0.95)',
      col: 5,
    },
  };
