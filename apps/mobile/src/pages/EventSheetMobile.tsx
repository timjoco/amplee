import {
  IonButtons,
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
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import {
  chevronBackOutline,
  chevronForwardOutline,
  closeOutline,
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

  const [myUserId, setMyUserId] = useState<string | null>(null);

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
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
          }}
        >
          <IonButtons slot="start">
            <button
              type="button"
              onClick={handleBack}
              style={{
                background: 'transparent',
                border: 'none',
                padding: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#a855f7',
              }}
            >
              <IonIcon icon={chevronBackOutline} style={{ fontSize: 24 }} />
            </button>
          </IonButtons>

          {/* Center, event name */}
          <IonTitle
            style={{
              paddingInline: 0,
              paddingBlock: 0,
              fontWeight: 900,
              fontSize: 20,
              letterSpacing: 0.2,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <button
                type="button"
                onClick={() => setShowInfoSheet(true)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  color: 'inherit',
                  font: 'inherit',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  cursor: 'pointer',
                  paddingInline: 4,
                  paddingBlock: 2,
                  borderRadius: 999,
                  maxWidth: '80vw',
                }}
              >
                <span
                  style={{
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '70vw',
                  }}
                >
                  {event?.title ?? (loading ? 'Loading…' : 'Event')}
                </span>

                <IonIcon
                  icon={chevronForwardOutline}
                  style={{
                    fontSize: 16,
                    opacity: 0.6,
                    flexShrink: 0,
                  }}
                />
              </button>
            </div>
          </IonTitle>

          {/* Right: status pill */}
          {event && status && (
            <div
              slot="end"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 11,
                fontWeight: 600,
                textTransform: 'capitalize',
                paddingInline: 8,
                paddingBlock: 3,
                borderRadius: 999,
                whiteSpace: 'nowrap',
                background: status.bg,
                color: status.color,
                border: `1px solid ${status.border}`,
                marginRight: 6,
              }}
            >
              {status.label}
            </div>
          )}
        </IonToolbar>

        {/* Tabs toolbar */}
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
      <IonModal
        isOpen={showInfoSheet}
        onDidDismiss={() => setShowInfoSheet(false)}
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
              onClick={() => setShowInfoSheet(false)}
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
                    {event.title || 'Event'}
                  </h2>
                </div>

                <div
                  style={{
                    flex: 1,
                    overflowY: 'auto',
                    paddingRight: 2,
                  }}
                >
                  <div
                    style={{
                      borderRadius: 18,
                      background:
                        'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                      border: '1px solid rgba(88,28,135,0.7)',
                      padding: 14,
                      marginBottom: 16,
                      boxShadow: '0 22px 45px rgba(0,0,0,0.9)',
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
                        <p
                          style={{
                            margin: '4px 0 0',
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#EDE9FE',
                          }}
                        >
                          {startsAtLabel || 'TBD'}
                        </p>
                      </div>

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
                      </div>

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
                      </div>
                    </div>

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
