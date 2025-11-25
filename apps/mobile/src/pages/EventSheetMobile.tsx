/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonText,
  IonToolbar,
} from '@ionic/react';
import {
  calendarOutline,
  chatbubblesOutline,
  checkmarkCircle,
  chevronBackOutline,
  chevronForwardOutline,
  closeCircle,
  documentTextOutline,
  flashOutline,
  folderOpenOutline,
  helpCircle,
  locationOutline,
  musicalNotesOutline,
  peopleOutline,
  timeOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import EventSheetModal from '../components/Events/EventSheetModal';
import { supabase } from '../lib/supabase';
import { exportEventToCalendar } from '../utils/exportEventToCalendar';

type EventType = 'show' | 'practice';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: EventType | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  is_cancelled: boolean;
  is_booked: boolean;
  is_public: boolean;
  setlist_template_id?: string | null;
};

type AttendanceStats = {
  accepted: number;
  total: number;
};

export default function EventSheetMobile() {
  const nav = useNavigate();
  const routerLocation = useLocation();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [savingPublic, setSavingPublic] = useState(false);

  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    accepted: 0,
    total: 0,
  });

  const [unreadMessages, setUnreadMessages] = useState(0);
  const [setlistCount, setSetlistCount] = useState(0);

  const [pressedButton, setPressedButton] = useState<string | null>(null);

  const pageRef = useRef<HTMLElement | null>(null);

  const cameFromSettings = (routerLocation.state as any)?.fromSettings;
  const hasStart = !!event?.starts_at;

  const { bandId, eventId } = useParams<{
    bandId: string;
    eventId: string;
  }>();

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

  const startsAtLabel = useMemo(() => {
    if (!event || !event.starts_at) return '';
    try {
      const d = new Date(event.starts_at);
      return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'America/Chicago',
        hour12: true,
      }).format(d);
    } catch {
      return event.starts_at;
    }
  }, [event]);

  const timeUntilEvent = useMemo(() => {
    if (!event?.starts_at) return null;
    const now = new Date();
    const eventDate = new Date(event.starts_at);
    const diff = eventDate.getTime() - now.getTime();

    if (diff < 0) return 'Event passed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Soon!';
  }, [event]);

  const handleExportGoogle = useCallback(async () => {
    if (!event || !event.starts_at) return;

    try {
      await exportEventToCalendar(
        {
          title: event.title || 'Event',
          startsAt: event.starts_at,
          location: event.location || undefined,
          notes: undefined,
          durationMinutes: 120,
        },
        'google'
      );
    } catch (err) {
      console.error('Failed to export to Google Calendar', err);
    }
  }, [event]);

  const status = useMemo(() => {
    if (!event) return null;
    if (event.is_cancelled) {
      return {
        label: 'Cancelled',
        bg: 'rgba(127, 29, 29, 0.2)',
        border: 'rgba(248, 113, 113, 0.4)',
        color: '#fca5a5',
        icon: closeCircle,
      };
    }
    if (event.is_booked) {
      return {
        label: 'Booked',
        bg: 'rgba(52, 211, 153, 0.15)',
        border: 'rgba(52, 211, 153, 0.4)',
        color: '#6ee7b7',
        icon: checkmarkCircle,
      };
    }
    return {
      label: 'Pending',
      bg: 'rgba(251, 191, 36, 0.15)',
      border: 'rgba(251, 191, 36, 0.4)',
      color: '#fde68a',
      icon: helpCircle,
    };
  }, [event]);

  const handleTogglePublic = async () => {
    if (!event || !isAdmin || savingPublic) return;

    const next = !event.is_public;
    setSavingPublic(true);

    try {
      const { error } = await supabase
        .from('events')
        .update({ is_public: next })
        .eq('id', event.id);

      if (error) {
        console.error('[event public toggle] error', error.message);
        return;
      }

      setEvent((prev) => (prev ? { ...prev, is_public: next } : prev));
    } finally {
      setSavingPublic(false);
    }
  };

  const handleBack = () => {
    if (cameFromSettings && bandId) {
      nav(`/bands/${bandId}`);
    } else {
      nav(-1);
    }
  };

  // Fetch event data
  useEffect(() => {
    let alive = true;
    if (!eventId) return;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('events_with_my_attendance')
        .select(
          'id, band_id, title, type, starts_at, ends_at, location, is_booked, is_cancelled, is_public'
        )
        .eq('id', eventId)
        .maybeSingle();

      if (!alive) return;

      if (!error && data) {
        const e = data as any;
        setEvent({
          id: String(e.id),
          band_id: String(e.band_id),
          title: String(e.title ?? ''),
          type: e.type === 'practice' ? 'practice' : 'show',
          starts_at: e.starts_at ?? null,
          ends_at: e.ends_at ?? null,
          location: e.location ?? null,
          is_booked: Boolean(e.is_booked),
          is_cancelled: Boolean(e.is_cancelled),
          is_public: Boolean(e.is_public),
        });
      } else {
        setEvent(null);
      }
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [eventId]);

  // Fetch attendance stats (accepted / total)
  useEffect(() => {
    if (!eventId) return;

    (async () => {
      const { data, error } = await supabase
        .from('event_attendance')
        .select('status')
        .eq('event_id', eventId);

      if (error) {
        console.error('[event attendance stats] error', error.message);
        return;
      }

      if (data) {
        const accepted = data.filter((a) => a.status === 'accepted').length;
        const total = data.length;

        setAttendanceStats({ accepted, total });
      }
    })();
  }, [eventId]);

  // Fetch setlist count
  useEffect(() => {
    if (!eventId) return;

    (async () => {
      const { count, error } = await supabase
        .from('event_setlist_items')
        .select('id', { count: 'exact', head: true })
        .eq('event_id', eventId);

      if (error) {
        console.error('[event setlist count] error', error.message);
        return;
      }

      setSetlistCount(count ?? 0);
    })();
  }, [eventId]);

  // Real-time updates for booked/cancelled + attendance stats
  useEffect(() => {
    if (!eventId) return;

    const ch = supabase
      .channel(`event:${eventId}:attendance-header`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_attendance',
          filter: `event_id=eq.${eventId}`,
        },
        async () => {
          // Refresh event booked/cancelled
          const { data, error } = await supabase
            .from('events_with_my_attendance')
            .select(
              'id, band_id, title, type, starts_at, location, is_booked, is_cancelled'
            )
            .eq('id', eventId)
            .maybeSingle();

          if (!error && data) {
            setEvent((prev) =>
              prev
                ? {
                    ...prev,
                    is_booked: Boolean(data.is_booked),
                    is_cancelled: Boolean(data.is_cancelled),
                  }
                : prev
            );
          }

          // Refresh attendance stats
          const { data: attendanceData, error: attErr } = await supabase
            .from('event_attendance')
            .select('status')
            .eq('event_id', eventId);

          if (attErr) {
            console.error(
              '[event attendance stats realtime] error',
              attErr.message
            );
            return;
          }

          if (attendanceData) {
            const accepted = attendanceData.filter(
              (a) => a.status === 'accepted'
            ).length;
            const total = attendanceData.length;
            setAttendanceStats({ accepted, total });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId]);

  // Check admin status
  useEffect(() => {
    let alive = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive || !user) return;

      if (!bandId) return;

      const { data, error } = await supabase
        .from('band_members')
        .select('role')
        .eq('band_id', bandId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!alive) return;
      if (!error && data?.role === 'admin') {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  const attendancePercentage = useMemo(() => {
    if (attendanceStats.total === 0) return 0;
    return Math.round((attendanceStats.accepted / attendanceStats.total) * 100);
  }, [attendanceStats]);

  return (
    <IonPage ref={pageRef as any}>
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
              padding: '12px 16px',
              gap: 12,
            }}
          >
            <IonButton
              onClick={handleBack}
              fill="clear"
              style={{
                minWidth: 0,
                padding: 6,
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#F9FAFB', fontSize: 24 }}
              />
            </IonButton>

            <button
              type="button"
              onClick={() => setShowInfoSheet(true)}
              style={{
                flex: 1,
                minWidth: 0,
                background: 'transparent',
                border: 'none',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
              }}
            >
              {/* Title + subtitle */}
              <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      fontWeight: 800,
                      color: '#F9FAFB',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      letterSpacing: '-0.5px',
                      lineHeight: 1,
                    }}
                  >
                    {event?.title ?? (loading ? 'Loading…' : 'Event')}
                  </span>
                </div>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 13,
                    color: '#9ca3af',
                  }}
                >
                  Event
                </p>
              </div>

              {/* Chevron on the right */}
              <IonIcon
                icon={chevronForwardOutline}
                style={{
                  fontSize: 18,
                  color: '#9ca3af',
                  flexShrink: 0,
                }}
              />
            </button>
          </div>
        </IonToolbar>
      </IonHeader>

      <EventSheetModal
        isOpen={showInfoSheet}
        onDismiss={() => {
          setShowInfoSheet(false);
        }}
        event={event}
        isAdmin={isAdmin}
        savingPublic={savingPublic}
        hasStart={hasStart}
        startsAtLabel={startsAtLabel}
        onExportGoogle={handleExportGoogle}
        onTogglePublic={handleTogglePublic}
        onGotoSettings={() => {
          setShowInfoSheet(false);
          if (event) {
            nav(`/bands/${event.band_id}/events/${event.id}/settings`);
          }
        }}
      />

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {loading && (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
            }}
          >
            <IonText color="medium">
              <p>Loading event…</p>
            </IonText>
          </div>
        )}

        {!loading && !event && (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
            }}
          >
            <IonText color="medium">
              <p>Event not found.</p>
            </IonText>
          </div>
        )}

        {!loading && event && (
          <div
            style={{
              padding: '16px',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            {/* 1) EVENT DETAILS BLOCK */}
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
                border: '1px solid rgba(71, 85, 105, 0.3)',
                borderRadius: '20px',
                padding: '20px',
                marginBottom: '16px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: '16px',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <IonIcon
                      icon={status?.icon}
                      style={{
                        fontSize: 20,
                        color: status?.color,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: status?.color,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                      }}
                    >
                      {status?.label}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: 'rgba(148, 163, 184, 0.8)',
                    }}
                  >
                    {event.type === 'practice' ? 'Practice Session' : 'Show'}
                  </div>
                </div>

                {timeUntilEvent && (
                  <div
                    style={{
                      padding: '8px 16px',
                      borderRadius: '12px',
                      background: 'rgba(52, 211, 153, 0.15)',
                      border: '1px solid rgba(52, 211, 153, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <IonIcon
                      icon={timeOutline}
                      style={{ fontSize: 16, color: '#34d399' }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#34d399',
                      }}
                    >
                      {timeUntilEvent}
                    </span>
                  </div>
                )}
              </div>

              {/* Event details */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                {event.starts_at && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <IonIcon
                      icon={calendarOutline}
                      style={{
                        fontSize: 18,
                        color: 'rgba(148, 163, 184, 0.8)',
                      }}
                    />
                    <span style={{ fontSize: 14, color: '#e5e7eb' }}>
                      {new Date(event.starts_at).toLocaleDateString('en-US', {
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                      {' • '}
                      {new Date(event.starts_at).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                )}

                {event.location && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <IonIcon
                      icon={locationOutline}
                      style={{
                        fontSize: 18,
                        color: 'rgba(148, 163, 184, 0.8)',
                      }}
                    />
                    <span style={{ fontSize: 14, color: '#e5e7eb' }}>
                      {event.location}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 2) CHAT TAB / CTA */}
            <button
              type="button"
              onClick={() =>
                handleButtonPress('chat', () =>
                  nav(`/bands/${event.band_id}/events/${event.id}/chat`)
                )
              }
              style={{
                width: '100%',
                background:
                  'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(52, 211, 153, 0.05) 100%)',
                border: '1px solid rgba(52, 211, 153, 0.3)',
                borderRadius: '18px',
                padding: '16px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                cursor: 'pointer',
                transition: 'all 120ms ease-out',
                textAlign: 'left',
                marginBottom: '16px',
                position: 'relative',
                transform:
                  pressedButton === 'chat' ? 'scale(0.97)' : 'scale(1)',
              }}
            >
              <IonIcon
                icon={chevronForwardOutline}
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  fontSize: 20,
                  color: 'rgba(148, 163, 184, 0.7)',
                }}
              />
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: 16,
                  background: 'rgba(52, 211, 153, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  position: 'relative',
                }}
              >
                <IonIcon
                  icon={chatbubblesOutline}
                  style={{ fontSize: 26, color: '#34d399' }}
                />
                {unreadMessages > 0 && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -4,
                      background: '#ef4444',
                      color: '#fff',
                      borderRadius: '12px',
                      padding: '2px 6px',
                      fontSize: 10,
                      fontWeight: 700,
                      minWidth: 20,
                      textAlign: 'center',
                    }}
                  >
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </div>
                )}
              </div>

              <div style={{ flex: 1, paddingRight: 24 }}>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: '#F9FAFB',
                    marginBottom: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  Chat
                  <IonIcon
                    icon={flashOutline}
                    style={{ fontSize: 16, color: '#34d399' }}
                  />
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>
                  Message your bandmates for this event
                </div>
              </div>
            </button>

            {/* 3) 2×2 GRID: ROLL CALL, SETLIST, NOTES, FILES */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              {/* Roll Call */}
              <button
                type="button"
                onClick={() =>
                  handleButtonPress('rollcall', () =>
                    nav(`/bands/${event.band_id}/events/${event.id}/rollcall`)
                  )
                }
                style={{
                  background: 'rgba(52, 211, 153, 0.05)',
                  border: '1px solid rgba(52, 211, 153, 0.15)',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition:
                    'transform 120ms ease-out, background 120ms ease-out, border-color 120ms ease-out',
                  position: 'relative',
                  textAlign: 'left',
                  transform:
                    pressedButton === 'rollcall' ? 'scale(0.97)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 211, 153, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 211, 153, 0.05)';
                  e.currentTarget.style.borderColor =
                    'rgba(52, 211, 153, 0.15)';
                }}
              >
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    fontSize: 18,
                    color: 'rgba(148, 163, 184, 0.6)',
                    opacity: 0.7,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <IonIcon
                    icon={peopleOutline}
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
                    Roll Call
                  </span>
                </div>

                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#34d399',
                    lineHeight: 1,
                    marginBottom: '4px',
                  }}
                >
                  {attendancePercentage}%
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  {attendanceStats.total === 0
                    ? 'No responses yet'
                    : `${attendanceStats.accepted} of ${attendanceStats.total} in`}
                </div>
              </button>

              {/* Setlist */}
              <button
                type="button"
                onClick={() =>
                  handleButtonPress('setlist', () =>
                    nav(`/bands/${event.band_id}/events/${event.id}/setlist`)
                  )
                }
                style={{
                  background: 'rgba(244, 114, 182, 0.05)',
                  border: '1px solid rgba(244, 114, 182, 0.15)',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition:
                    'transform 120ms ease-out, background 120ms ease-out, border-color 120ms ease-out',
                  position: 'relative',
                  textAlign: 'left',
                  transform:
                    pressedButton === 'setlist' ? 'scale(0.97)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'rgba(244, 114, 182, 0.08)';
                  e.currentTarget.style.borderColor =
                    'rgba(244, 114, 182, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    'rgba(244, 114, 182, 0.05)';
                  e.currentTarget.style.borderColor =
                    'rgba(244, 114, 182, 0.15)';
                }}
              >
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    fontSize: 18,
                    color: 'rgba(148, 163, 184, 0.6)',
                    opacity: 0.7,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
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
                    Setlist
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#f472b6',
                    lineHeight: 1,
                    marginBottom: '4px',
                  }}
                >
                  {setlistCount}
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>
                  {setlistCount === 1 ? 'song' : 'songs'} planned
                </div>
              </button>

              {/* Notes */}
              <button
                type="button"
                onClick={() =>
                  handleButtonPress('notes', () =>
                    nav(`/bands/${event.band_id}/events/${event.id}/notes`)
                  )
                }
                style={{
                  background: 'rgba(52, 211, 153, 0.05)',
                  border: '1px solid rgba(52, 211, 153, 0.15)',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition:
                    'transform 120ms ease-out, background 120ms ease-out, border-color 120ms ease-out',
                  position: 'relative',
                  textAlign: 'left',
                  transform:
                    pressedButton === 'notes' ? 'scale(0.97)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 211, 153, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 211, 153, 0.05)';
                  e.currentTarget.style.borderColor =
                    'rgba(52, 211, 153, 0.15)';
                }}
              >
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    fontSize: 18,
                    color: 'rgba(148, 163, 184, 0.6)',
                    opacity: 0.7,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <IonIcon
                    icon={documentTextOutline}
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
                    Notes
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#e5e7eb',
                    lineHeight: 1.4,
                  }}
                >
                  Your notes
                </div>
              </button>

              {/* Files */}
              <button
                type="button"
                onClick={() =>
                  handleButtonPress('files', () =>
                    nav(`/bands/${event.band_id}/events/${event.id}/files`)
                  )
                }
                style={{
                  background: 'rgba(52, 211, 153, 0.05)',
                  border: '1px solid rgba(52, 211, 153, 0.15)',
                  borderRadius: '16px',
                  padding: '16px',
                  cursor: 'pointer',
                  transition:
                    'transform 120ms ease-out, background 120ms ease-out, border-color 120ms ease-out',
                  position: 'relative',
                  textAlign: 'left',
                  transform:
                    pressedButton === 'files' ? 'scale(0.97)' : 'scale(1)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 211, 153, 0.08)';
                  e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 211, 153, 0.05)';
                  e.currentTarget.style.borderColor =
                    'rgba(52, 211, 153, 0.15)';
                }}
              >
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    fontSize: 18,
                    color: 'rgba(148, 163, 184, 0.6)',
                    opacity: 0.7,
                  }}
                />
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginBottom: '12px',
                  }}
                >
                  <IonIcon
                    icon={folderOpenOutline}
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
                    Files
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#e5e7eb',
                    lineHeight: 1.4,
                  }}
                >
                  Your files
                </div>
              </button>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
