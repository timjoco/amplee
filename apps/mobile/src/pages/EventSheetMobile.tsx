// src/pages/EventSheetMobile.tsx
import {
  IonAlert,
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonSpinner,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatTabMobile from '../components/Events/ChatTabMobile';
import SetlistTabMobile from '../components/Events/SetlistTabMobile';
import AvatarImageMobile from '../components/ui/AvatarImageMobile';
import { useAttendance } from '../hooks/useAttendance';
import { supabase } from '../lib/supabase';

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

type TabKey = 'details' | 'chat' | 'setlist' | 'notes' | 'files' | 'roster';

export default function EventSheetMobile() {
  const { bandId, eventId } = useParams<{
    bandId: string;
    eventId: string;
  }>();

  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('details');
  const [isAdmin, setIsAdmin] = useState(false);

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

  // Status chip label + colors – mirror inbox Booked/Pending/Cancelled vibe
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

  // Load event from events_with_my_attendance (same view as inbox)
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

  // Check if current user is band admin (for setlist controls)
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!bandId) return;
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('band_members')
        .select('role')
        .eq('band_id', bandId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!alive) return;
      if (!error && data && data.role === 'admin') {
        setIsAdmin(true);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  const defaultBackHref = bandId ? `/bands/${bandId}` : '/home';

  return (
    <IonPage>
      <IonHeader translucent>
        {/* Top toolbar: back + title + status pill ONLY */}
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              paddingInline: 8,
            }}
          >
            <IonButtons slot="start">
              <IonBackButton
                defaultHref={defaultBackHref}
                text=""
                style={{ marginRight: 4 }}
              />
            </IonButtons>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                flex: 1,
                minWidth: 0,
              }}
            >
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
                }}
              >
                {event?.title ?? (loading ? 'Loading…' : 'Event')}
              </IonTitle>

              {event && status && (
                <span
                  style={{
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
                  }}
                >
                  {status.label}
                </span>
              )}
            </div>
          </div>
        </IonToolbar>

        {/* Tabs toolbar */}
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '1px solid rgba(148,163,184,0.35)',
          }}
        >
          <IonSegment
            value={tab}
            onIonChange={(e) => setTab(e.detail.value as TabKey)}
            className="event-tabs"
          >
            <IonSegmentButton value="details">
              <IonLabel>Details</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="chat">
              <IonLabel>Chat</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="setlist">
              <IonLabel>Setlist</IonLabel>
            </IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent fullscreen scrollY={false} className="ion-padding">
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
            {/* DETAILS TAB – three sections: Event details, Attendance, Roster */}
            {tab === 'details' && (
              <>
                {/* Event overview header */}
                <div style={{ marginBottom: 8 }}>
                  <IonText>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      Event overview
                    </h2>
                  </IonText>
                  <IonText color="medium">
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 14,
                      }}
                    >
                      Basic info about this event.
                    </p>
                  </IonText>
                </div>

                {/* Event details card */}
                <IonList inset>
                  <IonItem lines="full">
                    <IonLabel>
                      <h2>When</h2>
                      <p style={{ marginTop: 4, fontSize: 14 }}>
                        {startsAtLabel || 'TBD'}
                      </p>
                    </IonLabel>
                  </IonItem>

                  <IonItem lines="full">
                    <IonLabel>
                      <h2>Where</h2>
                      <p style={{ marginTop: 4, fontSize: 14 }}>
                        {event.location || 'TBD'}
                      </p>
                    </IonLabel>
                  </IonItem>

                  <IonItem lines="none">
                    <IonLabel>
                      <h2>Type</h2>
                      <p style={{ marginTop: 4, fontSize: 14 }}>
                        {event.type === 'practice' ? 'Practice' : 'Show'}
                      </p>
                    </IonLabel>
                  </IonItem>
                </IonList>
                {/* Attendance card */}
                <div style={{ marginBottom: 8 }}>
                  <IonText>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      Attendance{' '}
                    </h2>
                  </IonText>
                  <IonText color="medium">
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 14,
                      }}
                    >
                      Let your band know if you&apos;re in.
                    </p>
                  </IonText>
                </div>
                <IonList inset>
                  <IonItem lines="none">
                    <MobileRSVPStrip eventId={event.id} />
                  </IonItem>
                </IonList>

                <div style={{ marginBottom: 8 }}>
                  <IonText>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: 20,
                        fontWeight: 700,
                      }}
                    >
                      Lineup
                    </h2>
                  </IonText>
                  <IonText color="medium">
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 14,
                      }}
                    >
                      See who&apos;s in this band and their RSVP.
                    </p>
                  </IonText>
                </div>
                {/* Roster card – using mobile version of RosterPanel */}
                <IonList inset>
                  <IonItem lines="none">
                    <RosterPanelMobile
                      bandId={event.band_id}
                      eventId={event.id}
                    />
                  </IonItem>
                </IonList>
              </>
            )}

            {/* Chat tab */}
            {tab === 'chat' && <ChatTabMobile eventId={event.id} />}

            {/* Setlist tab */}
            {tab === 'setlist' && (
              <SetlistTabMobile
                eventId={event.id}
                bandId={event.band_id}
                isAdmin={isAdmin}
              />
            )}
          </>
        )}
      </IonContent>
    </IonPage>
  );
}

function MobileRSVPStrip({ eventId }: { eventId: string }) {
  const { mine, counts, saving, error, update } = useAttendance(eventId);

  const isYes = mine === 'accepted';
  const isPending = mine === 'pending' || mine == null;

  const [pendingStatus, setPendingStatus] = useState<
    'accepted' | 'pending' | null
  >(null);

  const isAlertOpen = pendingStatus !== null;
  const labelForPending =
    pendingStatus === 'accepted'
      ? 'Yes'
      : pendingStatus === 'pending'
      ? 'Pending'
      : '';

  return (
    <>
      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        {/* Left: counts + error */}
        <div
          style={{
            fontSize: 13,
            color: '#E5E7EB',
            fontWeight: 600,
            minWidth: 0,
            flex: 1,
          }}
        >
          {saving ? 'Saving…' : `Accepted: ${counts.accepted}/${counts.total}`}
          {error && (
            <div
              style={{
                marginTop: 2,
                fontSize: 11,
                color: '#FCA5A5',
                fontWeight: 500,
              }}
            >
              {error}
            </div>
          )}
        </div>

        {/* Right: buttons */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          {/* YES pill */}
          <button
            type="button"
            onClick={() => setPendingStatus('accepted')}
            disabled={saving}
            style={{
              flex: 0,
              paddingInline: 14,
              paddingBlock: 6,
              borderRadius: 999,
              border: 'none',
              fontSize: 13,
              fontWeight: 800,
              textTransform: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isYes
                ? 'linear-gradient(135deg, #B6FF68, #4ADE80)'
                : 'rgba(34,197,94,0.12)',
              color: isYes ? '#052E16' : '#BBF7D0',
              boxShadow: isYes
                ? '0 0 0 1px rgba(190,242,100,0.9), 0 8px 18px rgba(22,163,74,0.45)'
                : '0 0 0 1px rgba(34,197,94,0.35)',
              opacity: saving && !isYes ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            Yes
          </button>

          {/* Pending pill */}
          <button
            type="button"
            onClick={() => setPendingStatus('pending')}
            disabled={saving}
            style={{
              flex: 0,
              paddingInline: 14,
              paddingBlock: 6,
              borderRadius: 999,
              border: 'none',
              fontSize: 13,
              fontWeight: 800,
              textTransform: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: isPending
                ? 'linear-gradient(135deg, #FBBF24, #F97316)'
                : 'rgba(249,115,22,0.12)',
              color: isPending ? '#451A03' : '#FED7AA',
              boxShadow: isPending
                ? '0 0 0 1px rgba(251,191,36,0.9), 0 8px 18px rgba(234,88,12,0.45)'
                : '0 0 0 1px rgba(249,115,22,0.35)',
              opacity: saving && !isPending ? 0.7 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            Pending
          </button>
        </div>
      </div>

      {/* Confirm dialog – uses your dark alert CSS via cssClass */}
      <IonAlert
        cssClass="custom-dark-alert"
        isOpen={isAlertOpen}
        onDidDismiss={() => setPendingStatus(null)}
        header="Confirm RSVP"
        message={
          labelForPending
            ? `Change your RSVP to "${labelForPending}"?`
            : 'Change your RSVP?'
        }
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
            handler: () => setPendingStatus(null),
          },
          {
            text: 'Confirm',
            handler: () => {
              if (pendingStatus) {
                update(pendingStatus);
              }
              setPendingStatus(null);
            },
          },
        ]}
      />
    </>
  );
}

/* ----- ROSTER PANEL (MOBILE VERSION OF WEB RosterPanel) ----- */

type RosterStatus = 'accepted' | 'declined' | 'tentative' | 'pending';

type RosterRow = {
  user_id: string;
  name: string;
  status: RosterStatus;
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
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);

  const load = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);
    try {
      // band members
      const { data: members, error: mErr } = await supabase
        .from('band_members')
        .select('user_id')
        .eq('band_id', bandId)
        .order('created_at', { ascending: true });

      if (mErr) return;

      const ids = (members ?? []).map((m: any) => m.user_id);
      if (ids.length === 0) {
        setRows([]);
        return;
      }

      // profiles
      const { data: profiles, error: pErr } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, avatar_url, updated_at')
        .in('id', ids);

      if (pErr) return;

      // attendance
      const { data: att, error: aErr } = await supabase
        .from('event_attendance')
        .select('user_id, status')
        .eq('event_id', eventId);

      if (aErr) return;

      const statusByUser = new Map<string, RosterStatus>(
        (att ?? []).map((a: any) => [
          a.user_id,
          (a.status as RosterStatus) ?? 'pending',
        ])
      );

      const orderIndex = new Map(ids.map((id, i) => [id, i]));
      const merged: RosterRow[] = (profiles ?? [])
        .map((p: any) => ({
          user_id: p.id as string,
          name:
            (p.display_name as string | null) ??
            (p.first_name as string | null) ??
            'Member',
          status: statusByUser.get(p.id) ?? 'pending',
          avatar_url: p.avatar_url ?? null,
          updated_at: p.updated_at ?? null,
        }))
        .sort(
          (a, b) =>
            (orderIndex.get(a.user_id) ?? 0) - (orderIndex.get(b.user_id) ?? 0)
        );

      setRows(merged);
    } finally {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, [bandId, eventId]);

  // initial load + realtime listeners
  useEffect(() => {
    void load();

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
        () => void load()
      )
      .subscribe();

    const chProf = supabase
      .channel(`band:${bandId}:profile-roster`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => void load()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chAtt);
      supabase.removeChannel(chProf);
    };
  }, [bandId, eventId, load]);

  // listen for global RSVP-change events to optimistically update
  useEffect(() => {
    const onRsvp = (e: Event) => {
      const ce = e as CustomEvent<{
        eventId: string;
        userId: string;
        next: 'accepted' | 'pending';
      }>;
      const {
        eventId: changedEventId,
        userId,
        next,
      } = ce.detail || ({} as any);
      if (!changedEventId || changedEventId !== eventId || !userId) return;

      setRows((prev) =>
        prev.map((r) =>
          r.user_id === userId ? { ...r, status: next as RosterStatus } : r
        )
      );
    };

    window.addEventListener('amplee:rsvp-change', onRsvp as EventListener);
    return () =>
      window.removeEventListener('amplee:rsvp-change', onRsvp as EventListener);
  }, [eventId]);

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
    // tentative / pending
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
                  background: st.bg,
                  border: `1px solid ${st.border}`,
                  color: st.color,
                  whiteSpace: 'nowrap',
                }}
                title={r.status === 'pending' ? 'No response yet' : r.status}
              >
                {r.status}
              </span>
            </div>

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
