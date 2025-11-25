/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  calendarOutline,
  chevronForwardOutline,
  clipboardOutline,
  musicalNotesOutline,
  peopleOutline,
  timeOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BandSettingsSheetMobile from '../../components/Bands/BandSheetModal';
import AvatarImageMobile from '../../components/ui/AvatarImageMobile';
import { supabase } from '../../lib/supabase';

type MembershipRole = 'admin' | 'member';

export default function BandSheetMobileLight() {
  const params = useParams<{ bandId?: string; id?: string }>();
  const navigate = useNavigate();
  const bandId = params.bandId ?? params.id ?? null;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [bandName, setBandName] = React.useState<string>('Band');
  const [bandAvatarUrl, setBandAvatarUrl] = React.useState<string | null>(null);
  const [bandAvatarUpdatedAt, setBandAvatarUpdatedAt] = React.useState<
    string | null
  >(null);
  const [myRole, setMyRole] = React.useState<MembershipRole>('member');
  const [showBandSettings, setShowBandSettings] = React.useState(false);
  const [nextEvent, setNextEvent] = React.useState<{
    id: string;
    title: string;
    starts_at: string;
    location: string | null;
    type: string | null;
  } | null>(null);

  const timeUntilNextEvent = React.useMemo(() => {
    if (!nextEvent?.starts_at) return null;
    const now = new Date();
    const eventDate = new Date(nextEvent.starts_at);
    const diff = eventDate.getTime() - now.getTime();

    if (diff < 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m`;
    return 'Soon!';
  }, [nextEvent]);

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

        // Fetch next upcoming event
        const { data: events } = await supabase
          .from('events')
          .select('id, title, starts_at, location, type')
          .eq('band_id', bandId)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(1);

        if (events && events.length > 0) {
          setNextEvent(events[0]);
        }
      } catch (e: any) {
        console.error('BandSheetMobileLight load error', e);
        setError(e?.message || 'Failed to load band.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  // Real-time updates for events
  React.useEffect(() => {
    if (!bandId) return;

    const channel = supabase
      .channel(`band:${bandId}:events`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `band_id=eq.${bandId}`,
        },
        async () => {
          const { data: events } = await supabase
            .from('events')
            .select('id, title, starts_at, location, type')
            .eq('band_id', bandId)
            .gte('starts_at', new Date().toISOString())
            .order('starts_at', { ascending: true })
            .limit(1);

          if (events && events.length > 0) {
            setNextEvent(events[0]);
          } else {
            setNextEvent(null);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bandId]);

  // Update time until event every minute
  React.useEffect(() => {
    if (!nextEvent) return;

    const interval = setInterval(() => {
      setNextEvent((prev) => (prev ? { ...prev } : null));
    }, 60000);

    return () => clearInterval(interval);
  }, [nextEvent]);

  if (!bandId) {
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
            '--background': '#ffffff',
            borderBottom: '0.5px solid rgba(15, 23, 42, 0.08)',
          }}
        >
          <button
            type="button"
            onClick={() => setShowBandSettings(true)}
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              padding: '14px 18px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              cursor: 'pointer',
            }}
          >
            {/* BIG BAND AVATAR */}
            <AvatarImageMobile
              name={bandName}
              bucket="band-avatars"
              avatarPath={bandAvatarUrl || undefined}
              updatedAt={bandAvatarUpdatedAt || undefined}
              size={80}
            />

            {/* BAND NAME */}
            <div
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 26,
                    fontWeight: 800,
                    color: '#0f172a', // slate-900
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    letterSpacing: '-0.6px',
                    lineHeight: 1.1,
                  }}
                >
                  {bandName || 'Band'}
                </span>
              </div>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 13,
                  color: '#6b7280', // gray-500
                }}
              >
                Band
              </p>
            </div>

            {/* SMALL FORWARD CHEVRON */}
            <IonIcon
              icon={chevronForwardOutline}
              style={{
                fontSize: 20,
                color: '#9ca3af', // gray-400
                flexShrink: 0,
                marginLeft: 4,
              }}
            />
          </button>
        </IonToolbar>

        {/* Settings Modal */}
        <BandSettingsSheetMobile
          isOpen={showBandSettings}
          onDismiss={() => setShowBandSettings(false)}
          bandId={bandId as string}
          bandName={bandName}
          avatarPath={bandAvatarUrl || undefined}
          isAdmin={myRole === 'admin'}
        />
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background':
            'linear-gradient(180deg, #f9fafb 0%, #eef2ff 45%, #e5e7eb 100%)',
        }}
      >
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
          <div
            style={{
              padding: '20px 16px 40px',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            {/* Next Event Hero Card (if exists) */}
            {nextEvent && (
              <button
                type="button"
                onClick={() =>
                  navigate(`/bands/${bandId}/events/${nextEvent.id}`)
                }
                style={{
                  width: '100%',
                  background:
                    'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 40%, #e0f2fe 100%)',
                  border: '1px solid rgba(148, 163, 184, 0.5)',
                  borderRadius: 24,
                  padding: '20px',
                  marginBottom: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 14px 30px rgba(15, 23, 42, 0.12)',
                  position: 'relative',
                }}
              >
                {/* Chevron in top right */}
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{
                    position: 'absolute',
                    top: 20,
                    right: 20,
                    fontSize: 24,
                    color: 'rgba(15, 23, 42, 0.35)',
                    opacity: 0.8,
                  }}
                />

                {/* Header with time badge */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    paddingRight: 32,
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      background: '#dcfce7', // green-100
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #6ee7b7', // green-300
                    }}
                  >
                    <IonIcon
                      icon={calendarOutline}
                      style={{ fontSize: 26, color: '#16a34a' }} // green-600
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#166534', // green-700
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                        marginBottom: 2,
                      }}
                    >
                      Next Event
                    </div>
                    {timeUntilNextEvent && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: '#bbf7d0', // green-200
                        }}
                      >
                        <IonIcon
                          icon={timeOutline}
                          style={{ fontSize: 12, color: '#15803d' }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#14532d',
                          }}
                        >
                          {timeUntilNextEvent}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Event details */}
                <div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: '#0f172a',
                      marginBottom: 8,
                      letterSpacing: '-0.3px',
                    }}
                  >
                    {nextEvent.title}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: '#111827',
                      lineHeight: 1.5,
                    }}
                  >
                    {new Date(nextEvent.starts_at).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                    })}
                    {' • '}
                    {new Date(nextEvent.starts_at).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </div>
                  {nextEvent.location && (
                    <div
                      style={{
                        fontSize: 13,
                        color: '#4b5563',
                        marginTop: 4,
                      }}
                    >
                      📍 {nextEvent.location}
                    </div>
                  )}
                </div>
              </button>
            )}

            {/* Grid of Action Cards */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: 12,
                marginBottom: nextEvent ? 16 : 0,
              }}
            >
              {/* Events Card */}
              <button
                type="button"
                onClick={() => navigate(`/bands/${bandId}/events`)}
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(148, 163, 184, 0.5)',
                  borderRadius: 20,
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: 130,
                  position: 'relative',
                  boxShadow: '0 10px 20px rgba(15, 23, 42, 0.06)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: '#dcfce7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #6ee7b7',
                  }}
                >
                  <IonIcon
                    icon={calendarOutline}
                    style={{ fontSize: 22, color: '#16a34a' }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#0f172a',
                      marginBottom: 4,
                    }}
                  >
                    Events
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#4b5563',
                      opacity: 0.9,
                    }}
                  >
                    All shows & practices
                  </div>
                </div>
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 14,
                    fontSize: 18,
                    color: 'rgba(107, 114, 128, 0.8)',
                  }}
                />
              </button>

              {/* Proposals Card */}
              <button
                type="button"
                onClick={() => navigate(`/bands/${bandId}/proposals`)}
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(148, 163, 184, 0.5)',
                  borderRadius: 20,
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: 130,
                  position: 'relative',
                  boxShadow: '0 10px 20px rgba(15, 23, 42, 0.06)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: '#fef3c7', // amber-100
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #facc15', // amber-400
                  }}
                >
                  <IonIcon
                    icon={clipboardOutline}
                    style={{ fontSize: 22, color: '#d97706' }} // amber-600
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#0f172a',
                      marginBottom: 4,
                    }}
                  >
                    Proposals
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#4b5563',
                      opacity: 0.9,
                    }}
                  >
                    Review offers & gigs
                  </div>
                </div>
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 14,
                    fontSize: 18,
                    color: 'rgba(107, 114, 128, 0.8)',
                  }}
                />
              </button>

              {/* Library Card */}
              <button
                type="button"
                onClick={() => navigate(`/bands/${bandId}/library`)}
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(148, 163, 184, 0.5)',
                  borderRadius: 20,
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: 130,
                  position: 'relative',
                  boxShadow: '0 10px 20px rgba(15, 23, 42, 0.06)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: '#fdf2ff', // pink-50
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #f9a8d4', // pink-300
                  }}
                >
                  <IonIcon
                    icon={musicalNotesOutline}
                    style={{ fontSize: 22, color: '#db2777' }} // pink-600
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#0f172a',
                      marginBottom: 4,
                    }}
                  >
                    Library
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#4b5563',
                      opacity: 0.9,
                    }}
                  >
                    Setlists & repertoire
                  </div>
                </div>
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 14,
                    fontSize: 18,
                    color: 'rgba(107, 114, 128, 0.8)',
                  }}
                />
              </button>

              {/* Roster Card */}
              <button
                type="button"
                onClick={() => navigate(`/bands/${bandId}/roster`)}
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(148, 163, 184, 0.5)',
                  borderRadius: 20,
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: 130,
                  position: 'relative',
                  boxShadow: '0 10px 20px rgba(15, 23, 42, 0.06)',
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: '#e0f2fe', // sky-100
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid #7dd3fc', // sky-300
                  }}
                >
                  <IonIcon
                    icon={peopleOutline}
                    style={{ fontSize: 22, color: '#0284c7' }} // sky-600
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 700,
                      color: '#0f172a',
                      marginBottom: 4,
                    }}
                  >
                    Roster
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#4b5563',
                      opacity: 0.9,
                    }}
                  >
                    Coming soon
                  </div>
                </div>
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 14,
                    fontSize: 18,
                    color: 'rgba(107, 114, 128, 0.8)',
                  }}
                />
              </button>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
