/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
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
  globeOutline,
  musicalNotesOutline,
  peopleOutline,
  timeOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import BandAvailabilityWidget from '../../components/Bands/BandAvailabilityWidget';
import BandSettingsSheetMobile from '../../components/Bands/BandSheetModal';
import AvatarImageMobile from '../../components/ui/AvatarImageMobile';
import { supabase } from '../../lib/supabase';

type MembershipRole = 'admin' | 'member';

export default function BandSheetMobile() {
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

  const [pressedButton, setPressedButton] = React.useState<string | null>(null);

  const [eventsCount, setEventsCount] = React.useState(0);
  const [proposalsCount, setProposalsCount] = React.useState(0);

  const [rosterMembers, setRosterMembers] = React.useState<any[]>([]);

  const isAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  const triggerHaptic = React.useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('[haptic error]', e);
    }
  }, []);

  const handleButtonPress = React.useCallback(
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

        // Fetch roster members (availability removed - now using calendar system)
        const { data: members } = await supabase
          .from('band_members')
          .select(
            `
          user_id,
          profile:profiles!inner(
            id,
            display_name,
            first_name,
            last_name
          )
        `
          )
          .eq('band_id', bandId)
          .order('created_at', { ascending: true });

        if (!alive) return;

        if (members) {
          const formattedMembers = members.map((m: any) => {
            const fullName = [m.profile?.first_name, m.profile?.last_name]
              .filter(Boolean)
              .join(' ');

            return {
              id: m.id,
              display_name: m.profile.display_name,
              full_name: fullName,
              // Availability removed - now using calendar-based system
            };
          });
          setRosterMembers(formattedMembers);
        }

        // Fetch next upcoming event (ONLY events I'm invited to)
        const { data: events, error: nextErr } = await supabase
          .from('events_with_my_attendance')
          .select('id, title, starts_at, location, type')
          .eq('band_id', bandId)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(1);

        if (nextErr) throw nextErr;

        if (events && events.length > 0) setNextEvent(events[0] as any);
        else setNextEvent(null);

        // total events count (all shows/practices for this band)
        const { count: eventsCountExact, error: eventsCountErr } =
          await supabase
            .from('events')
            .select('id', { head: true, count: 'exact' })
            .eq('band_id', bandId)
            .is('archived_at', null);

        if (!alive) return;

        if (eventsCountErr) {
          console.error('[BandSheetMobile] events count error', eventsCountErr);
        } else {
          setEventsCount(eventsCountExact ?? 0);
        }

        // proposals count for this band
        const { count: proposalsCountExact, error: proposalsCountErr } =
          await supabase
            .from('gig_proposals')
            .select('id', { head: true, count: 'exact' })
            .eq('band_id', bandId);

        if (!alive) return;

        if (proposalsCountErr) {
          console.error(
            '[BandSheetMobile] proposals count error',
            proposalsCountErr
          );
        } else {
          setProposalsCount(proposalsCountExact ?? 0);
        }
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
    if (!bandId) return;

    const refreshNextEvent = async () => {
      const { data: events, error: nextErr } = await supabase
        .from('events_with_my_attendance')
        .select('id, title, starts_at, location, type')
        .eq('band_id', bandId)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(1);

      if (nextErr) {
        console.warn('[BandSheetMobile] next event refresh error', nextErr);
        return;
      }

      setNextEvent(events && events.length > 0 ? (events[0] as any) : null);

      // optional: refresh visible events count from the gated view
      const { count: eventsCountExact, error: countErr } = await supabase
        .from('events_with_my_attendance')
        .select('id', { head: true, count: 'exact' })
        .eq('band_id', bandId);

      if (countErr) {
        console.warn('[BandSheetMobile] events count refresh error', countErr);
      } else {
        setEventsCount(eventsCountExact ?? 0);
      }
    };

    // 1) events changes (title/time/location/etc)
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
        () => {
          void refreshNextEvent();
        }
      )
      .subscribe();

    // 2) invite/roster changes (who can see what)
    const channel2 = supabase
      .channel(`band:${bandId}:event_members`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_members' },
        () => {
          void refreshNextEvent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(channel2);
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
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
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
                    color: '#F9FAFB',
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
                  color: '#9ca3af',
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
                color: '#9ca3af',
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
        // 👇 key part: give the content extra bottom padding so it scrolls above the native nav + Amplee nav
        style={
          {
            '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
            // enough room for Android system nav + your custom bottom nav
            '--padding-bottom': isAndroid
              ? 'calc(env(safe-area-inset-bottom) + 110px)'
              : 'calc(env(safe-area-inset-bottom) + 72px)',
          } as React.CSSProperties
        }
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
              padding: '20px 16px 24px', // was 40px, we shifted that into --padding-bottom
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            {/* Next Event Hero Card (if exists) */}
            {nextEvent && (
              <button
                type="button"
                onClick={() =>
                  handleButtonPress('nextEvent', () =>
                    navigate(`/bands/${bandId}/events/${nextEvent.id}`)
                  )
                }
                style={{
                  width: '100%',
                  background:
                    'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  borderRadius: 24,
                  padding: '20px',
                  marginBottom: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16,
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                  position: 'relative',
                  transform:
                    pressedButton === 'nextEvent' ? 'scale(0.97)' : 'scale(1)',
                  transition:
                    'transform 120ms ease-out, box-shadow 120ms ease-out',
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
                    color: 'rgba(148, 163, 184, 0.6)',
                    opacity: 0.7,
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
                      background: 'rgba(52, 211, 153, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                    }}
                  >
                    <IonIcon
                      icon={calendarOutline}
                      style={{ fontSize: 26, color: '#34d399' }}
                    />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#BBF7D0',
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
                          background: 'rgba(15, 118, 110, 0.4)',
                        }}
                      >
                        <IonIcon
                          icon={timeOutline}
                          style={{ fontSize: 12, color: '#A7F3D0' }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#ECFDF5',
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
                      color: '#F9FAFB',
                      marginBottom: 8,
                      letterSpacing: '-0.3px',
                    }}
                  >
                    {nextEvent.title}
                  </div>
                  <div
                    style={{
                      fontSize: 14,
                      color: '#E5E7EB',
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
                        color: 'rgba(203, 213, 225, 0.9)',
                        marginTop: 4,
                      }}
                    >
                      📍 {nextEvent.location}
                    </div>
                  )}
                </div>
              </button>
            )}

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              {/* ROW 1: Availability & Events */}

              {/* EVENTS CARD */}
              {eventsCount > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    handleButtonPress('events', () =>
                      navigate(`/bands/${bandId}/events`)
                    )
                  }
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
                    border: '1px solid rgba(71, 85, 105, 0.3)',
                    borderRadius: 20,
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    minHeight: 130,
                    transform:
                      pressedButton === 'events' ? 'scale(0.97)' : 'scale(1)',
                    transition:
                      'transform 120ms ease-out, box-shadow 120ms ease-out',
                  }}
                >
                  <IonIcon
                    icon={chevronForwardOutline}
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 14,
                      fontSize: 18,
                      color: 'rgba(148, 163, 184, 0.6)',
                      opacity: 0.7,
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <IonIcon
                      icon={calendarOutline}
                      style={{ fontSize: 20, color: '#34d399' }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 700,
                      }}
                    >
                      Events
                    </span>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: '#34d399',
                        lineHeight: 1,
                        marginBottom: 2,
                      }}
                    >
                      {eventsCount}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {eventsCount === 1 ? 'event' : 'events'}
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleButtonPress('events', () =>
                      navigate(`/bands/${bandId}/events`)
                    )
                  }
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
                    border: '1px solid rgba(71, 85, 105, 0.3)',
                    borderRadius: 20,
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    cursor: 'pointer',
                    textAlign: 'left',
                    minHeight: 130,
                    position: 'relative',
                    transform:
                      pressedButton === 'events' ? 'scale(0.97)' : 'scale(1)',
                    transition:
                      'transform 120ms ease-out, box-shadow 120ms ease-out',
                  }}
                >
                  <IonIcon
                    icon={chevronForwardOutline}
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 14,
                      fontSize: 18,
                      color: 'rgba(148, 163, 184, 0.6)',
                      opacity: 0.7,
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <IonIcon
                      icon={calendarOutline}
                      style={{ fontSize: 20, color: '#34d399' }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 700,
                      }}
                    >
                      Events
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: 'rgba(203, 213, 225, 0.8)',
                      opacity: 0.9,
                    }}
                  >
                    Shows & practices
                  </div>
                </button>
              )}

              {/* ROW 2: Proposals & Library */}

              {/* PROPOSALS CARD */}
              {proposalsCount > 0 ? (
                <button
                  type="button"
                  onClick={() =>
                    handleButtonPress('proposals', () =>
                      navigate(`/bands/${bandId}/proposals`)
                    )
                  }
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
                    border: '1px solid rgba(71, 85, 105, 0.3)',
                    borderRadius: 20,
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    cursor: 'pointer',
                    textAlign: 'left',
                    position: 'relative',
                    minHeight: 130,
                    transform:
                      pressedButton === 'proposals'
                        ? 'scale(0.97)'
                        : 'scale(1)',
                    transition:
                      'transform 120ms ease-out, box-shadow 120ms ease-out',
                  }}
                >
                  <IonIcon
                    icon={chevronForwardOutline}
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 14,
                      fontSize: 18,
                      color: 'rgba(148, 163, 184, 0.6)',
                      opacity: 0.7,
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <IonIcon
                      icon={clipboardOutline}
                      style={{ fontSize: 20, color: '#f59e0b' }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 700,
                      }}
                    >
                      Proposals
                    </span>
                  </div>

                  <div style={{ marginTop: 'auto' }}>
                    <div
                      style={{
                        fontSize: 28,
                        fontWeight: 700,
                        color: '#f59e0b',
                        lineHeight: 1,
                        marginBottom: 2,
                      }}
                    >
                      {proposalsCount}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af' }}>
                      {proposalsCount === 1 ? 'proposal' : 'proposals'}
                    </div>
                  </div>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    handleButtonPress('proposals', () =>
                      navigate(`/bands/${bandId}/proposals`)
                    )
                  }
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
                    border: '1px solid rgba(71, 85, 105, 0.3)',
                    borderRadius: 20,
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                    cursor: 'pointer',
                    textAlign: 'left',
                    minHeight: 130,
                    position: 'relative',
                    transform:
                      pressedButton === 'proposals'
                        ? 'scale(0.97)'
                        : 'scale(1)',
                    transition:
                      'transform 120ms ease-out, box-shadow 120ms ease-out',
                  }}
                >
                  <IonIcon
                    icon={chevronForwardOutline}
                    style={{
                      position: 'absolute',
                      top: 16,
                      right: 14,
                      fontSize: 18,
                      color: 'rgba(148, 163, 184, 0.6)',
                      opacity: 0.7,
                    }}
                  />
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <IonIcon
                      icon={clipboardOutline}
                      style={{ fontSize: 20, color: '#f59e0b' }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        color: '#9ca3af',
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        fontWeight: 700,
                      }}
                    >
                      Proposals
                    </span>
                  </div>

                  <div
                    style={{
                      fontSize: 12,
                      color: 'rgba(203, 213, 225, 0.8)',
                      opacity: 0.9,
                    }}
                  >
                    Vote on gigs
                  </div>
                </button>
              )}

              {/* AVAILABILITY CARD */}
              <BandAvailabilityWidget
                bandId={bandId}
                members={rosterMembers.map((m) => ({
                  id: m.profile?.id,
                  name: m.display_name || m.full_name,
                  role: null,
                }))}
                pressedButton={pressedButton}
                handleButtonPress={handleButtonPress}
              />

              {/* Library Card */}
              <button
                type="button"
                onClick={() =>
                  handleButtonPress('library', () =>
                    navigate(`/bands/${bandId}/library`)
                  )
                }
                style={{
                  background:
                    'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  borderRadius: 20,
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: 130,
                  position: 'relative',
                  transform:
                    pressedButton === 'library' ? 'scale(0.97)' : 'scale(1)',
                  transition:
                    'transform 120ms ease-out, box-shadow 120ms ease-out',
                }}
              >
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 14,
                    fontSize: 18,
                    color: 'rgba(148, 163, 184, 0.6)',
                    opacity: 0.7,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <IonIcon
                    icon={musicalNotesOutline}
                    style={{ fontSize: 20, color: '#f472b6' }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontWeight: 700,
                    }}
                  >
                    Library
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(203, 213, 225, 0.8)',
                    opacity: 0.9,
                  }}
                >
                  Songs & Setlists
                </div>
              </button>

              {/* ROW 3: Roster & Public Profile */}

              {/* Roster Card */}
              <button
                type="button"
                onClick={() =>
                  handleButtonPress('roster', () =>
                    navigate(`/bands/${bandId}/roster`)
                  )
                }
                style={{
                  background:
                    'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  borderRadius: 20,
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: 130,
                  position: 'relative',
                  transform:
                    pressedButton === 'roster' ? 'scale(0.97)' : 'scale(1)',
                  transition:
                    'transform 120ms ease-out, box-shadow 120ms ease-out',
                }}
              >
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 14,
                    fontSize: 18,
                    color: 'rgba(148, 163, 184, 0.6)',
                    opacity: 0.7,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <IonIcon
                    icon={peopleOutline}
                    style={{ fontSize: 20, color: '#38bdf8' }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontWeight: 700,
                    }}
                  >
                    Roster
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(203, 213, 225, 0.8)',
                    opacity: 0.9,
                  }}
                >
                  Band members
                </div>
              </button>

              {/* Public Page Card */}
              <button
                type="button"
                onClick={() =>
                  handleButtonPress('publicPage', () =>
                    navigate(`/bands/${bandId}/public`)
                  )
                }
                style={{
                  background:
                    'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
                  border: '1px solid rgba(71, 85, 105, 0.3)',
                  borderRadius: 20,
                  padding: '16px 14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 10,
                  cursor: 'pointer',
                  textAlign: 'left',
                  minHeight: 130,
                  position: 'relative',
                  transform:
                    pressedButton === 'publicPage' ? 'scale(0.97)' : 'scale(1)',
                  transition:
                    'transform 120ms ease-out, box-shadow 120ms ease-out',
                }}
              >
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 14,
                    fontSize: 18,
                    color: 'rgba(148, 163, 184, 0.6)',
                    opacity: 0.7,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                  }}
                >
                  <IonIcon
                    icon={globeOutline}
                    style={{ fontSize: 20, color: '#a78bfa' }}
                  />
                  <span
                    style={{
                      fontSize: 11,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      fontWeight: 700,
                    }}
                  >
                    Public Profile
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(203, 213, 225, 0.8)',
                    opacity: 0.9,
                  }}
                >
                  Bio, socials & links
                </div>
              </button>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
