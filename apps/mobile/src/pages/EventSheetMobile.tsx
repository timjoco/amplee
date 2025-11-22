/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonToolbar,
} from '@ionic/react';
import {
  chatbubblesOutline,
  chevronBackOutline,
  chevronForwardOutline,
  documentTextOutline,
  folderOpenOutline,
  musicalNotesOutline,
  peopleOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import ChatTabMobile from '../components/Events/ChatTabMobile';
import EventSheetModal from '../components/Events/EventSheetModal';
import RSVPTabMobile from '../components/Events/RSVPTabMobile';
import SetlistTabMobile from '../components/Events/SetlistTabMobile';
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
};

type TabKey = 'Green Room' | 'roll call' | 'setlist' | 'notes' | 'files';

export default function EventSheetMobile() {
  const { bandId, eventId } = useParams<{
    bandId: string;
    eventId: string;
  }>();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('Green Room');
  const [isAdmin, setIsAdmin] = useState(false);
  const pageRef = useRef<HTMLElement | null>(null);
  const [showInfoSheet, setShowInfoSheet] = useState(false);
  const [, setMyUserId] = useState<string | null>(null);
  const [savingPublic, setSavingPublic] = useState(false);

  const location = useLocation();
  const cameFromSettings = (location.state as any)?.fromSettings;
  const nav = useNavigate();
  const hasStart = !!event?.starts_at;

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
        bg: 'rgba(248,113,113,0.18)',
        border: 'rgba(248,113,113,0.7)',
        color: '#FCA5A5',
      };
    }
    if (event.is_booked) {
      return {
        label: 'Booked',
        bg: 'rgba(76,175,80,0.16)',
        border: 'rgba(76,175,80,0.45)',
        color: '#C9F5D0',
      };
    }
    return {
      label: 'Pending',
      bg: 'rgba(255,193,7,0.2)',
      border: 'rgba(255,193,7,0.5)',
      color: '#FFE7AA',
    };
  }, [event]);

  const eventIconColor = (key: TabKey) =>
    tab === key ? EVENT_TAB_META[key].accent : 'rgba(148,163,184,0.9)';

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
          const { data } = await supabase
            .from('events_with_my_attendance')
            .select(
              'id, band_id, title, type, starts_at, location, is_booked, is_cancelled'
            )
            .eq('id', eventId)
            .maybeSingle();

          if (data) {
            setEvent((prev) =>
              prev
                ? {
                    ...prev,
                    is_booked: Boolean(data.is_booked),
                    is_cancelled: Boolean(data.is_cancelled),
                  }
                : null
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId]);

  useEffect(() => {
    let alive = true;

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive || !user) return;

      setMyUserId(user.id);

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

  return (
    <IonPage ref={pageRef as any}>
      <IonHeader translucent>
        {/* CARD HEADER */}
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
          }}
        >
          <div
            style={{
              width: '100%',
              paddingInline: 21,
              paddingBlock: 6,
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '20px 14px',
                borderRadius: 20,
                background: 'rgba(14, 15, 16, 0.98)',
                border: '.5px solid rgba(18, 55, 41, 0.9)',
                boxShadow: '0 16px 40px rgba(0,0,0,0.55)',
                outline: 'none',
                gap: 10,
              }}
            >
              {/* Column 1: Back button */}
              <IonButtons slot="start">
                <IonButton
                  fill="clear"
                  onClick={handleBack}
                  style={{ minWidth: 0, paddingInline: 4 }}
                >
                  <IonIcon
                    icon={chevronBackOutline}
                    style={{ color: '#F9FAFB', fontSize: 22 }}
                  />
                </IonButton>
              </IonButtons>

              {/* Column 2: Title + metadata (with status chip inside title row) */}
              <button
                type="button"
                onClick={() => setShowInfoSheet(true)}
                style={{
                  flex: '1 1 auto',
                  minWidth: 0,
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-start',
                  justifyContent: 'center',
                  gap: 4,
                  cursor: 'pointer',
                }}
              >
                {/* Title row: title + status chip + chevron */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between', // 👈 spread left cluster + pill
                    width: '100%',
                    minWidth: 0,
                    gap: 8,
                  }}
                >
                  {/* Left cluster: title + chevron, only as wide as needed */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      minWidth: 0,
                      flexShrink: 1, // 👈 can shrink, but won't grow to fill
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 1,
                        minWidth: 0,
                        maxWidth: '100%',
                        fontSize: 20,
                        fontWeight: 700,
                        color: '#F9FAFB',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        textAlign: 'left',
                      }}
                    >
                      {event?.title ?? (loading ? 'Loading…' : 'Event')}
                    </span>

                    <IonIcon
                      icon={chevronForwardOutline}
                      style={{
                        fontSize: 13,
                        opacity: 0.8,
                        flexShrink: 0,
                        color: '#ffffffff',
                      }}
                    />
                  </div>

                  {/* Right: Status pill pinned to far right */}
                  {event && status && (
                    <div
                      style={{
                        flexShrink: 0,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 10.5,
                        lineHeight: 1.1,
                        fontWeight: 600,
                        textTransform: 'capitalize',
                        paddingInline: 7,
                        paddingBlock: 2,
                        borderRadius: 999,
                        whiteSpace: 'nowrap',
                        background: status.bg,
                        color: status.color,
                        border: `1px solid ${status.border}`,
                        transform: 'scale(0.84)',
                        transformOrigin: 'center right',
                      }}
                    >
                      {status.label}
                    </div>
                  )}
                </div>

                {/* Meta row: date/time */}
                <span
                  style={{
                    fontSize: 13,
                    color: 'rgba(209,213,219,0.96)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {event
                    ? (() => {
                        const rawLoc = event.location?.trim() || 'Venue TBD';
                        const maxLocLen = 15;
                        const loc =
                          rawLoc.length > maxLocLen
                            ? rawLoc.slice(0, maxLocLen - 1).trimEnd() + '…'
                            : rawLoc;

                        if (event.starts_at) {
                          const d = new Date(event.starts_at);
                          const date = d.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          });
                          const time = d.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                          });
                          return `${date} • ${time} • ${loc}`;
                        }

                        return `Date & time TBD • ${loc}`;
                      })()
                    : 'Loading details…'}
                </span>
              </button>
            </div>
          </div>
        </IonToolbar>

        {/* TABS BELOW CARD */}
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gridAutoRows: 'auto',
              rowGap: 0,
              padding: '0 8px',
              maxWidth: 480,
              margin: '0 auto',
            }}
          >
            {/* Row 1: icon row */}
            <div style={{ gridColumn: '1 / -1' }}>
              <IonSegment
                value={tab}
                onIonChange={(e) => setTab(e.detail.value as TabKey)}
                className="event-tabs"
              >
                <IonSegmentButton
                  value="Green Room"
                  style={{
                    '--padding-start': '0px',
                    '--padding-end': '0px',
                  }}
                >
                  <IonIcon
                    icon={chatbubblesOutline}
                    style={{
                      fontSize: 'clamp(18px, 4vw, 22px)',
                      color: eventIconColor('Green Room'),
                    }}
                  />
                </IonSegmentButton>

                <IonSegmentButton
                  value="roll call"
                  style={{
                    '--padding-start': '0px',
                    '--padding-end': '0px',
                  }}
                >
                  <IonIcon
                    icon={peopleOutline}
                    style={{
                      fontSize: 'clamp(18px, 4vw, 22px)',
                      color: eventIconColor('roll call'),
                    }}
                  />
                </IonSegmentButton>

                <IonSegmentButton
                  value="setlist"
                  style={{
                    '--padding-start': '0px',
                    '--padding-end': '0px',
                  }}
                >
                  <IonIcon
                    icon={musicalNotesOutline}
                    style={{
                      fontSize: 'clamp(18px, 4vw, 22px)',
                      color: eventIconColor('setlist'),
                    }}
                  />
                </IonSegmentButton>

                <IonSegmentButton
                  value="notes"
                  style={{
                    '--padding-start': '0px',
                    '--padding-end': '0px',
                  }}
                >
                  <IonIcon
                    icon={documentTextOutline}
                    style={{
                      fontSize: 'clamp(18px, 4vw, 22px)',
                      color: eventIconColor('notes'),
                    }}
                  />
                </IonSegmentButton>

                <IonSegmentButton
                  value="files"
                  style={{
                    '--padding-start': '0px',
                    '--padding-end': '0px',
                  }}
                >
                  <IonIcon
                    icon={folderOpenOutline}
                    style={{
                      fontSize: 'clamp(18px, 4vw, 22px)',
                      color: eventIconColor('files'),
                    }}
                  />
                </IonSegmentButton>
              </IonSegment>
            </div>

            {/* Row 2: labels centered under each tab */}
            <div
              style={{
                gridColumn: '1 / -1',
                display: 'grid',
                gridTemplateColumns: 'repeat(5, 1fr)',
                paddingTop: 2,
                paddingBottom: 4,
              }}
            >
              {(
                [
                  'Green Room',
                  'roll call',
                  'setlist',
                  'notes',
                  'files',
                ] as TabKey[]
              ).map((key) => (
                <div key={key} style={{ textAlign: 'center' }}>
                  <IonText>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 700,
                        fontSize: 'clamp(11px, 3vw, 13px)',
                        letterSpacing: 0.4,
                        textTransform: 'uppercase',
                        color:
                          tab === key
                            ? EVENT_TAB_META[key].accent
                            : 'transparent',
                      }}
                    >
                      {EVENT_TAB_META[key].label}
                    </p>
                  </IonText>
                </div>
              ))}
            </div>
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

      {/* MAIN BODY */}
      <IonContent
        fullscreen
        scrollY={tab !== 'Green Room'}
        className="ion-padding"
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
          <>
            {tab === 'Green Room' && (
              <ChatTabMobile eventId={event.id} isAdmin={isAdmin} />
            )}

            {tab !== 'Green Room' && (
              <div
                style={{
                  minHeight: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  overflowY: 'auto',
                  WebkitOverflowScrolling: 'touch',
                }}
              >
                {tab === 'setlist' && (
                  <SetlistTabMobile
                    eventId={event.id}
                    bandId={event.band_id}
                    isAdmin={isAdmin}
                  />
                )}
                {tab === 'roll call' && (
                  <RSVPTabMobile
                    eventId={event.id}
                    onLocalBookedChange={(isBooked) => {
                      setEvent((prev) =>
                        prev ? { ...prev, is_booked: isBooked } : prev
                      );
                    }}
                  />
                )}{' '}
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
}

const EVENT_TAB_META: Record<
  TabKey,
  { label: string; accent: string; col: number }
> = {
  'Green Room': {
    label: 'Green Room',
    accent: 'rgba(52, 211, 153, 0.95)',
    col: 1,
  },
  'roll call': {
    label: 'Roll Call',
    accent: 'rgba(52, 211, 153, 0.95)',
    col: 2,
  },
  setlist: {
    label: 'Setlist',
    accent: 'rgba(52, 211, 153, 0.95)',
    col: 3,
  },
  notes: {
    label: 'Notes',
    accent: 'rgba(52, 211, 153, 0.95)',
    col: 4,
  },
  files: {
    label: 'Files',
    accent: 'rgba(52, 211, 153, 0.95)',
    col: 5,
  },
};
