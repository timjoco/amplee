/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonToolbar,
} from '@ionic/react';
import {
  checkmarkCircleOutline,
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
  createOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ChatTabMobile from '../components/Events/ChatTabMobile';
import RSVPTabMobile from '../components/Events/RSVPTabMobile';
import SetlistTabMobile from '../components/Events/SetlistTabMobile';
import AvatarImageMobile from '../components/ui/AvatarImageMobile';
import { supabase } from '../lib/supabase';
import { exportEventToCalendar } from '../utils/exportEventToCalendar';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice' | string;
  starts_at: string | null;
  location: string | null;
  is_cancelled: boolean;
  is_booked: boolean;
};

type TabKey = 'Green Room' | 'roll call' | 'setlist';

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

  const [editingEvent, setEditingEvent] = useState(false);
  const [savingEvent, setSavingEvent] = useState(false);

  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editType, setEditType] = useState<'show' | 'practice'>('show');
  const [editStartsAt, setEditStartsAt] = useState('');
  const [editEndsAt, setEditEndsAt] = useState('');

  const nav = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      nav(-1);
    } else {
      nav('/home', { replace: true });
    }
  };

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

  const hasStart = !!event?.starts_at;

  function toLocalInputValue(iso: string): string {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';

    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const mi = pad(d.getMinutes());

    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  }

  function startEditEventDetails() {
    if (!event) return;

    setEditTitle(event.title || '');
    setEditLocation(event.location || '');
    setEditType(event.type === 'practice' ? 'practice' : 'show');
    setEditStartsAt(event.starts_at ? toLocalInputValue(event.starts_at) : '');
    // 👇 NEW: pull existing ends_at if you have it on the row
    setEditEndsAt(
      (event as any).ends_at ? toLocalInputValue((event as any).ends_at) : ''
    );
    setEditingEvent(true);
  }

  const handleSaveEventDetails = useCallback(async () => {
    if (!event) return;

    try {
      setSavingEvent(true);

      const updates: {
        title?: string | null;
        location?: string | null;
        type?: string | null;
        starts_at?: string | null;
        ends_at?: string | null;
      } = {
        title: editTitle.trim() || null,
        location: editLocation.trim() || null,
        type: editType,
        starts_at: editStartsAt ? new Date(editStartsAt).toISOString() : null,
        ends_at: editEndsAt ? new Date(editEndsAt).toISOString() : null,
      };

      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', event.id)
        .eq('band_id', event.band_id);

      if (error) throw error;

      // Optimistic local update
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              title: updates.title ?? prev.title,
              location: updates.location ?? prev.location,
              type: (updates.type as any) ?? prev.type,
              starts_at: updates.starts_at ?? prev.starts_at,
              // 👇 keep local ends_at in sync if you have it
              ...(prev as any),
              ends_at:
                updates.ends_at !== undefined
                  ? updates.ends_at
                  : (prev as any).ends_at,
            }
          : prev
      );

      setEditingEvent(false);
    } catch (err) {
      console.error('Failed to update event', err);
    } finally {
      setSavingEvent(false);
    }
  }, [event, editTitle, editLocation, editType, editStartsAt, editEndsAt]);

  useEffect(() => {
    let alive = true;
    if (!eventId) return;

    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('events_with_my_attendance')
        .select(
          'id, band_id, title, type, starts_at, location, is_booked, is_cancelled'
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
          location: e.location ?? null,
          is_booked: Boolean(e.is_booked),
          is_cancelled: Boolean(e.is_cancelled),
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
              paddingInline: 12,
              paddingBlock: 6, // matches band header wrapper padding
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                padding: '10px 14px', // 👈 same as band header
                borderRadius: 20, // 👈 same as band header
                background: 'rgba(14, 15, 16, 0.98)', // 👈 same as band header
                border: '.5px solid #41235eff', // 👈 same border
                boxShadow: '0 16px 40px rgba(0,0,0,0.55)', // 👈 same shadow
                outline: 'none',
                gap: 12,
              }}
            >
              {/* Column 1: Back button */}
              <button
                type="button"
                onClick={handleBack}
                style={{
                  flex: '0 0 auto',
                  background: 'transparent',
                  border: 'none',
                  padding: 6,
                  borderRadius: 999,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <IonIcon
                  icon={chevronBackOutline}
                  style={{ color: '#F9FAFB', fontSize: 24 }}
                />
              </button>

              {/* Column 2: Title + metadata (clickable for modal) */}
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
                {/* Event title + tiny chevron right next to name */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    maxWidth: '100%',
                  }}
                >
                  <span
                    style={{
                      flexGrow: 0,
                      flexShrink: 1,
                      minWidth: 0,
                      maxWidth: '100%',
                      fontSize: 20, // bumped slightly to feel closer to band header
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
                      fontSize: 16,
                      opacity: 0.8,
                      flexShrink: 0,
                      color: '#ffffffff',
                    }}
                  />
                </div>

                {/* Meta row: date/time • truncated location */}
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

              {/* Column 3: Status pill (far right) */}
              {event && status && (
                <div
                  style={{
                    flex: '0 0 auto',
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
                    marginLeft: 4,
                    transform: 'scale(0.94)',
                    transformOrigin: 'center right',
                  }}
                >
                  {status.label}
                </div>
              )}
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
          <IonSegment
            value={tab}
            onIonChange={(e) => setTab(e.detail.value as TabKey)}
            className="event-tabs"
          >
            <IonSegmentButton value="Green Room">
              <IonLabel>Green Room</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="roll call">
              <IonText>Roll Call</IonText>
            </IonSegmentButton>
            <IonSegmentButton value="setlist">
              <IonLabel>Setlist</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      {/*EVENT DETAILS POPUP */}
      {/*EVENT DETAILS POPUP */}
      <IonModal
        isOpen={showInfoSheet}
        onDidDismiss={() => {
          setShowInfoSheet(false);
          setEditingEvent(false);
        }}
        breakpoints={[0, 0.9]}
        initialBreakpoint={0.9}
        handleBehavior="cycle"
        className="event-info-sheet"
      >
        <IonContent>
          <div
            style={{
              position: 'relative',
              padding: 16,
              paddingBottom: 24,
              height: '100%',
              color: '#E5E7EB',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowInfoSheet(false);
                setEditingEvent(false);
              }}
              style={{
                position: 'absolute',
                top: 10,
                right: 12,
                width: 28,
                height: 28,
                borderRadius: 999,
                border: '1px solid rgba(139,92,246,0.8)',
                background:
                  'radial-gradient( rgba(168,85,247,0.25), rgba(15,23,42,0.98))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 10px 26px rgba(0,0,0,0.75)',
                padding: 0,
                cursor: 'pointer',
              }}
            >
              <IonIcon
                icon={closeOutline}
                style={{ fontSize: 16, color: '#F9FAFB' }}
              />
            </button>

            <div
              style={{
                width: 40,
                height: 4,
                borderRadius: 999,
                margin: '4px auto 12px',
                background: 'rgba(168,85,247,0.85)',
              }}
            />

            {event ? (
              <>
                <div
                  style={{
                    position: 'relative',
                    marginBottom: 12,
                  }}
                >
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 20,
                      fontWeight: 800,
                      textAlign: 'center',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      paddingInline: 40,
                      color: '#F5F3FF',
                    }}
                  >
                    {editingEvent
                      ? editTitle || 'Event'
                      : event.title || 'Event'}
                  </h2>
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: 2,
                  }}
                >
                  {/* EVENT OVERVIEW CARD */}
                  {/* EVENT OVERVIEW CARD */}
                  <div
                    style={{
                      position: 'relative', // 👈 needed for the pinned edit icon
                      borderRadius: 18,
                      background:
                        'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                      border: '1px solid rgba(88,28,135,0.7)',
                      padding: 14,
                      marginBottom: 16,
                      boxShadow: '0 22px 45px rgba(0,0,0,0.9)',
                    }}
                  >
                    {/* Pinned edit / save controls (admin only) */}
                    {isAdmin && !editingEvent && (
                      <button
                        type="button"
                        onClick={startEditEventDetails}
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          border: '1px solid rgba(129,140,248,0.9)',
                          background:
                            'radial-gradient(circle at top, rgba(79,70,229,0.22), rgba(15,23,42,0.98))',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          boxShadow: '0 10px 26px rgba(0,0,0,0.75)',
                        }}
                      >
                        <IonIcon
                          icon={createOutline}
                          style={{ fontSize: 16, color: '#E0E7FF' }}
                        />
                      </button>
                    )}

                    {isAdmin && editingEvent && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 10,
                          right: 10,
                          display: 'flex',
                          gap: 6,
                        }}
                      >
                        {/* Save icon */}
                        <button
                          type="button"
                          onClick={handleSaveEventDetails}
                          disabled={savingEvent}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 999,
                            border: '1px solid rgba(34,197,94,0.9)',
                            background:
                              'linear-gradient(135deg, rgba(34,197,94,0.98), rgba(5,46,22,0.98))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: savingEvent ? 'default' : 'pointer',
                            opacity: savingEvent ? 0.75 : 1,
                          }}
                        >
                          <IonIcon
                            icon={checkmarkCircleOutline}
                            style={{ fontSize: 17, color: '#DCFCE7' }}
                          />
                        </button>

                        {/* Cancel icon */}
                        <button
                          type="button"
                          onClick={() => setEditingEvent(false)}
                          disabled={savingEvent}
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 999,
                            border: '1px solid rgba(148,163,184,0.7)',
                            background: 'rgba(15,23,42,0.96)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: savingEvent ? 'default' : 'pointer',
                            opacity: savingEvent ? 0.75 : 1,
                          }}
                        >
                          <IonIcon
                            icon={closeOutline}
                            style={{ fontSize: 15, color: '#E5E7EB' }}
                          />
                        </button>
                      </div>
                    )}

                    <div style={{ marginBottom: 10 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: 0.04,
                          textTransform: 'uppercase',
                          color: 'rgba(237,233,254,0.96)',
                        }}
                      >
                        Event overview
                      </p>
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 13,
                          color: 'rgba(196,181,253,0.9)',
                        }}
                      >
                        Basic info about this event.
                      </p>
                    </div>

                    <div
                      style={{
                        marginTop: 4,
                        paddingLeft: 6,
                      }}
                    >
                      {/* WHEN — now supports optional end time */}
                      <div style={{ marginBottom: 10 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            textTransform: 'uppercase',
                            letterSpacing: 0.08,
                            color: 'rgba(196,181,253,0.95)',
                          }}
                        >
                          When
                        </p>

                        {!editingEvent ? (
                          <p
                            style={{
                              margin: '4px 0 0',
                              fontSize: 14,
                              fontWeight: 500,
                              color: '#EDE9FE',
                            }}
                          >
                            {(() => {
                              // we already have startsAtLabel computed outside
                              const endIso = (event as any).ends_at as
                                | string
                                | null
                                | undefined;
                              if (endIso) {
                                const endLabel = new Intl.DateTimeFormat(
                                  'en-US',
                                  {
                                    dateStyle: 'medium',
                                    timeStyle: 'short',
                                    timeZone: 'America/Chicago',
                                  }
                                ).format(new Date(endIso));

                                return startsAtLabel
                                  ? `${startsAtLabel} – ${endLabel}`
                                  : `Start TBD – ${endLabel}`;
                              }

                              return startsAtLabel || 'TBD';
                            })()}
                          </p>
                        ) : (
                          <div
                            style={{
                              marginTop: 4,
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                            }}
                          >
                            {/* Start */}
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  marginBottom: 4,
                                  color: 'rgba(209,213,219,0.92)',
                                }}
                              >
                                Start
                              </p>
                              <input
                                type="datetime-local"
                                value={editStartsAt}
                                onChange={(e) =>
                                  setEditStartsAt(e.target.value)
                                }
                                style={{
                                  width: '100%',
                                  borderRadius: 10,
                                  border: '1px solid rgba(148,163,184,0.8)',
                                  padding: 8,
                                  backgroundColor: '#020617',
                                  color: '#E5E7EB',
                                  fontSize: 14,
                                }}
                              />
                            </div>

                            {/* End (optional) */}
                            <div>
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: 11,
                                  marginBottom: 4,
                                  color: 'rgba(209,213,219,0.92)',
                                }}
                              >
                                End (optional)
                              </p>
                              <input
                                type="datetime-local"
                                value={editEndsAt}
                                onChange={(e) => setEditEndsAt(e.target.value)}
                                style={{
                                  width: '100%',
                                  borderRadius: 10,
                                  border: '1px solid rgba(148,163,184,0.8)',
                                  padding: 8,
                                  backgroundColor: '#020617',
                                  color: '#E5E7EB',
                                  fontSize: 14,
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* WHERE */}
                      <div style={{ marginBottom: 10 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            textTransform: 'uppercase',
                            letterSpacing: 0.08,
                            color: 'rgba(196,181,253,0.95)',
                          }}
                        >
                          Where
                        </p>

                        {!editingEvent ? (
                          <p
                            style={{
                              margin: '4px 0 0',
                              fontSize: 14,
                              fontWeight: 500,
                              color: '#EDE9FE',
                            }}
                          >
                            {event.location || 'TBD'}
                          </p>
                        ) : (
                          <input
                            type="text"
                            value={editLocation}
                            onChange={(e) => setEditLocation(e.target.value)}
                            placeholder="Venue / location"
                            style={{
                              marginTop: 4,
                              width: '100%',
                              borderRadius: 10,
                              border: '1px solid rgba(148,163,184,0.8)',
                              padding: 8,
                              backgroundColor: '#020617',
                              color: '#E5E7EB',
                              fontSize: 14,
                            }}
                          />
                        )}
                      </div>

                      {/* TYPE */}
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 12,
                            textTransform: 'uppercase',
                            letterSpacing: 0.08,
                            color: 'rgba(196,181,253,0.95)',
                          }}
                        >
                          Type
                        </p>

                        {!editingEvent ? (
                          <p
                            style={{
                              margin: '4px 0 0',
                              fontSize: 14,
                              fontWeight: 500,
                              color: '#EDE9FE',
                            }}
                          >
                            {event.type === 'practice' ? 'Practice' : 'Show'}
                          </p>
                        ) : (
                          <div
                            style={{
                              marginTop: 4,
                              display: 'flex',
                              gap: 8,
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => setEditType('show')}
                              style={{
                                flex: 1,
                                paddingBlock: 8,
                                borderRadius: 999,
                                border:
                                  editType === 'show'
                                    ? '1px solid rgba(167,139,250,0.95)'
                                    : '1px solid rgba(148,163,184,0.8)',
                                background:
                                  editType === 'show'
                                    ? 'linear-gradient(135deg, rgba(111, 44, 133, 0.95), rgba(107, 39, 134, 0.98))'
                                    : 'rgba(15,23,42,0.96)',
                                color:
                                  editType === 'show'
                                    ? '#EEF2FF'
                                    : 'rgba(209,213,219,0.95)',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Show
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditType('practice')}
                              style={{
                                flex: 1,
                                paddingBlock: 8,
                                borderRadius: 999,
                                border:
                                  editType === 'practice'
                                    ? '1px solid rgba(167,139,250,0.95)'
                                    : '1px solid rgba(148,163,184,0.8)',
                                background:
                                  editType === 'practice'
                                    ? 'linear-gradient(135deg, rgba(111, 44, 133, 0.95), rgba(107, 39, 134, 0.98))'
                                    : 'rgba(15,23,42,0.96)',
                                color:
                                  editType === 'practice'
                                    ? '#ECFEFF'
                                    : 'rgba(209,213,219,0.95)',
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: 'pointer',
                              }}
                            >
                              Practice
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CALENDAR CTA stays the same */}
                    <div
                      style={{
                        marginTop: 14,
                        marginBottom: 16,
                        paddingLeft: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <button
                        type="button"
                        onClick={handleExportGoogle}
                        disabled={!hasStart}
                        style={{
                          width: '100%',
                          paddingBlock: 10,
                          borderRadius: 999,
                          border: '1px solid rgba(216,180,254,0.9)',
                          fontSize: 14,
                          fontWeight: 600,
                          background: hasStart
                            ? 'linear-gradient(135deg, rgba(147,51,234,0.96), rgba(107, 58, 157, 0.98))'
                            : 'rgba(17,24,39,0.9)',
                          color: hasStart
                            ? '#F5F3FF'
                            : 'rgba(196,181,253,0.85)',
                          opacity: hasStart ? 1 : 0.7,
                        }}
                      >
                        Add to Google Calendar
                      </button>
                    </div>
                  </div>

                  {/* LINEUP CARD */}
                  <div
                    style={{
                      borderRadius: 18,
                      background:
                        'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                      border: '1px solid rgba(88,28,135,0.7)',
                      padding: 14,
                      marginBottom: 16,
                    }}
                  >
                    <div style={{ marginBottom: 10 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 13,
                          fontWeight: 700,
                          letterSpacing: 0.04,
                          textTransform: 'uppercase',
                          color: 'rgba(237,233,254,0.96)',
                        }}
                      >
                        Lineup
                      </p>
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 13,
                          color: 'rgba(196,181,253,0.9)',
                        }}
                      >
                        See the lineup for this event and their RSVP.
                      </p>
                    </div>

                    <IonList
                      inset={false}
                      style={{
                        margin: 0,
                        background: 'transparent',
                      }}
                    >
                      <IonItem
                        lines="none"
                        style={
                          {
                            '--background': 'transparent',
                            paddingInline: 0,
                          } as any
                        }
                      >
                        <RosterPanelMobile
                          bandId={event.band_id}
                          eventId={event.id}
                        />
                      </IonItem>
                    </IonList>
                  </div>
                </div>
              </>
            ) : (
              <div
                style={{
                  height: '100%',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <IonSpinner name="dots" />
              </div>
            )}
          </div>
        </IonContent>
      </IonModal>

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

                {tab === 'roll call' && <RSVPTabMobile eventId={event.id} />}
              </div>
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
}

type RosterStatus = 'accepted' | 'declined' | 'tentative' | 'pending';

type RosterRow = {
  user_id: string;
  name: string;
  status: RosterStatus;
  needs_sub: boolean;
  avatar_url?: string | null;
  updated_at?: string | null;
};

function RosterPanelMobile({
  bandId,
  eventId,
}: {
  bandId: string;
  eventId: string;
}) {
  type BaseMember = {
    user_id: string;
    name: string;
    avatar_url: string | null;
    updated_at: string | null;
  };

  const [baseMembers, setBaseMembers] = useState<BaseMember[] | null>(null);
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const loadBaseMembers = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);

    try {
      const { data: members } = await supabase
        .from('band_members')
        .select('user_id')
        .eq('band_id', bandId)
        .order('created_at', { ascending: true });

      const ids = (members ?? []).map((m: any) => m.user_id);

      if (ids.length === 0) {
        setBaseMembers([]);
        setRows([]);
        initialLoadDone.current = true;
        setLoading(false);
        return;
      }

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, avatar_url, updated_at')
        .in('id', ids);

      const byId = new Map(
        (profiles ?? []).map((p: any) => [
          p.id,
          {
            user_id: p.id,
            name: p.display_name ?? p.first_name ?? 'Member',
            avatar_url: p.avatar_url ?? null,
            updated_at: p.updated_at ?? null,
          } as BaseMember,
        ])
      );

      // keep original band member order
      const ordered: BaseMember[] = ids
        .map((id) => byId.get(id)!)
        .filter(Boolean);

      setBaseMembers(ordered);
    } finally {
      // don't flip initialLoadDone here; we want attendance too
    }
  }, [bandId]);

  const loadAttendance = useCallback(async () => {
    if (!baseMembers) return;

    if (baseMembers.length === 0) {
      setRows([]);
      initialLoadDone.current = true;
      setLoading(false);
      return;
    }

    if (!initialLoadDone.current) setLoading(true);

    try {
      const { data: att } = await supabase
        .from('event_attendance')
        .select('user_id, status, needs_sub')
        .eq('event_id', eventId);

      const attMap = new Map(
        (att ?? []).map((a: any) => [
          a.user_id,
          {
            status: (a.status as RosterStatus) ?? 'pending',
            needs_sub: !!a.needs_sub,
          },
        ])
      );

      const merged: RosterRow[] = baseMembers.map((base) => {
        const attInfo = attMap.get(base.user_id) ?? {
          status: 'pending' as RosterStatus,
          needs_sub: false,
        };

        return {
          user_id: base.user_id,
          name: base.name,
          status: attInfo.status,
          needs_sub: attInfo.needs_sub,
          avatar_url: base.avatar_url,
          updated_at: base.updated_at,
        };
      });

      setRows(merged);
    } finally {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, [eventId, baseMembers]);

  useEffect(() => {
    initialLoadDone.current = false;
    setRows([]);
    setBaseMembers(null);
    setLoading(true);
    void loadBaseMembers();
  }, [loadBaseMembers]);

  // Once baseMembers are ready, load attendance once
  useEffect(() => {
    if (baseMembers) {
      void loadAttendance();
    }
  }, [baseMembers, loadAttendance]);

  // Realtime subscriptions
  useEffect(() => {
    const chAtt = supabase
      .channel(`event:${eventId}:attendance-roster`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_attendance',
          filter: `event_id=eq.${eventId}`,
        },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          if (!row) return;

          const userId = row.user_id as string;

          setRows((prev) => {
            // make sure we have something to update
            if (!prev || prev.length === 0) return prev;

            if (payload.eventType === 'DELETE') {
              // fallback to "pending" when attendance row is deleted
              return prev.map((r) =>
                r.user_id === userId
                  ? {
                      ...r,
                      status: 'pending' as RosterStatus,
                      needs_sub: false,
                    }
                  : r
              );
            }

            const status =
              (row.status as RosterStatus | undefined) ??
              ('pending' as RosterStatus);
            const needs_sub = !!row.needs_sub;

            return prev.map((r) =>
              r.user_id === userId ? { ...r, status, needs_sub } : r
            );
          });
        }
      )
      .subscribe();

    // Profile realtime: patch baseMembers + rows instead of re-querying
    const chProf = supabase
      .channel(`band:${bandId}:profile-roster`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload: any) => {
          const p = payload.new;
          if (!p) return;

          const userId = p.id as string;
          const name = (p.display_name ?? p.first_name ?? 'Member') as string;
          const avatar_url = (p.avatar_url ?? null) as string | null;
          const updated_at = (p.updated_at ?? null) as string | null;

          // update baseMembers
          setBaseMembers((prev) => {
            if (!prev) return prev;
            return prev.map((b) =>
              b.user_id === userId ? { ...b, name, avatar_url, updated_at } : b
            );
          });

          // update visible rows
          setRows((prev) =>
            prev.map((r) =>
              r.user_id === userId ? { ...r, name, avatar_url, updated_at } : r
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chAtt);
      supabase.removeChannel(chProf);
    };
  }, [bandId, eventId]);

  const statusStyle = (s: RosterStatus) => {
    if (s === 'accepted') {
      return {
        bg: 'rgba(34,197,94,0.18)',
        border: 'rgba(34,197,94,0.65)',
        color: '#BBF7D0',
      };
    }
    if (s === 'declined') {
      return {
        bg: 'rgba(248,113,113,0.18)',
        border: 'rgba(248,113,113,0.7)',
        color: '#FCA5A5',
      };
    }
    return {
      bg: 'rgba(251,191,36,0.18)',
      border: 'rgba(251,191,36,0.7)',
      color: '#FDE68A',
    };
  };

  if (loading && !initialLoadDone.current) {
    return (
      <div
        style={{
          width: '100%',
          paddingBlock: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <IonSpinner name="dots" />
        <IonText color="medium">
          <p style={{ margin: 0, fontSize: 13 }}>Loading roster…</p>
        </IonText>
      </div>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <IonText color="medium">
        <p style={{ margin: 0, fontSize: 13 }}>No members found.</p>
      </IonText>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {rows.map((r, i) => {
        const st = statusStyle(r.status);

        return (
          <div key={r.user_id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                paddingBlock: 6,
              }}
            >
              <AvatarImageMobile
                name={r.name}
                bucket="profile-avatars"
                avatarPath={r.avatar_url || undefined}
                updatedAt={r.updated_at || undefined}
                size={32}
              />

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <span
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.name}
                </span>
              </div>

              {/* STATUS PILL (Only blue when sub is requested) */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingInline: 8,
                  paddingBlock: 2,
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  ...(r.needs_sub
                    ? {
                        background: 'rgba(37,99,235,0.18)',
                        border: '1px solid rgba(59,130,246,0.85)',
                        color: '#BFDBFE',
                      }
                    : {
                        background: st.bg,
                        border: `1px solid ${st.border}`,
                        color: st.color,
                      }),
                }}
              >
                {r.needs_sub ? 'Sub requested' : r.status}
              </span>
            </div>

            {/* divider */}
            {i < rows.length - 1 && (
              <div
                style={{
                  height: 1,
                  marginInline: 4,
                  opacity: 0.14,
                  backgroundColor: 'rgba(148,163,184,0.6)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
