import {
  IonButton,
  IonContent,
  IonIcon,
  IonItem,
  IonList,
  IonModal,
  IonSpinner,
  IonText,
} from '@ionic/react';
import { settingsOutline } from 'ionicons/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import AvatarImageMobile from '../ui/AvatarImageMobile';

type EventSheetModalEvent = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice' | null;
  location: string | null;
  is_public: boolean;
};

type EventInfoModalProps = {
  isOpen: boolean;
  onDismiss: () => void;
  event: EventSheetModalEvent | null;
  isAdmin: boolean;
  savingPublic: boolean;
  hasStart: boolean;
  startsAtLabel: string;
  onExportGoogle: () => void;
  onTogglePublic: () => void;
  onGotoSettings: () => void;
};

export default function EventSheetModal({
  isOpen,
  onDismiss,
  event,
  isAdmin,
  savingPublic,
  hasStart,
  startsAtLabel,
  onExportGoogle,
  onTogglePublic,
  onGotoSettings,
}: EventInfoModalProps) {
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDismiss}
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
          {/* GRABBER */}
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 999,
              margin: '4px auto 12px',
              background: 'rgba(52,211,153,0.75)',
            }}
          />

          {!event ? (
            <div
              style={{
                height: '100%',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IonSpinner name="dots" />
            </div>
          ) : (
            <>
              {/* Header row: title + subtitle + gear (mirrors band sheet modal) */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 12,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 18,
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: '#F5F3FF',
                    }}
                  >
                    {event.title || 'Event'}
                  </h2>
                  <p
                    style={{
                      margin: '2px 0 0',
                      fontSize: 12,
                      color: 'rgba(125, 205, 166, 0.9)',
                    }}
                  >
                    Details, visibility, and quick actions.
                  </p>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={onGotoSettings}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 999,
                      border: '1px solid rgba(148,163,184,0.8)',
                      backgroundColor: 'rgba(15,23,42,0.95)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <IonIcon
                      icon={settingsOutline}
                      style={{ fontSize: 16, color: '#E5E7EB' }}
                    />
                  </button>
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  paddingRight: 2,
                }}
              >
                {/* EVENT OVERVIEW CARD */}
                <div
                  style={{
                    borderRadius: 18,
                    border: '1px solid rgba(52,211,153,0.40)',
                    padding: 14,
                    marginBottom: 16,
                    boxShadow: '0 22px 45px rgba(0,0,0,0.9)',
                    position: 'relative',
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
                        color: 'rgba(209,250,229,0.96)',
                      }}
                    >
                      Event overview
                    </p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 13,
                        color: 'rgba(148,163,184,0.9)',
                      }}
                    >
                      Basic info about this event.
                    </p>
                  </div>

                  <div
                    style={{
                      marginTop: 4,
                      paddingLeft: 6,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {/* When */}
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          textTransform: 'uppercase',
                          letterSpacing: 0.08,
                          color: 'rgba(167,243,208,0.9)',
                        }}
                      >
                        When
                      </p>
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#ECFDF5',
                        }}
                      >
                        {startsAtLabel || 'TBD'}
                      </p>
                    </div>

                    {/* Where */}
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          textTransform: 'uppercase',
                          letterSpacing: 0.08,
                          color: 'rgba(167,243,208,0.9)',
                        }}
                      >
                        Where
                      </p>
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#ECFDF5',
                        }}
                      >
                        {event.location || 'TBD'}
                      </p>
                    </div>

                    {/* Type */}
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          textTransform: 'uppercase',
                          letterSpacing: 0.08,
                          color: 'rgba(167,243,208,0.9)',
                        }}
                      >
                        Type
                      </p>
                      <p
                        style={{
                          margin: '4px 0 0',
                          fontSize: 14,
                          fontWeight: 500,
                          color: '#ECFDF5',
                        }}
                      >
                        {event.type === 'practice' ? 'Practice' : 'Show'}
                      </p>
                    </div>
                  </div>

                  {/* Add to Google Calendar */}
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
                    <IonButton
                      type="button"
                      onClick={onExportGoogle}
                      disabled={!hasStart}
                      style={{
                        '--background': 'rgba(15,23,42,0.98)',
                        '--background-activated': 'rgba(45,212,191,0.95)',
                        '--border-color': 'rgba(45,212,191,0.8)',
                        '--color': 'rgba(45,212,191,0.95)',
                        '--color-activated': '#000000',
                        borderRadius: 999,
                      }}
                    >
                      Add to Google Calendar
                    </IonButton>
                  </div>
                </div>

                {/* LINEUP CARD */}
                <div
                  style={{
                    borderRadius: 18,
                    border: '1px solid rgba(52,211,153,0.32)',
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
                        color: 'rgba(209,250,229,0.96)',
                      }}
                    >
                      Lineup
                    </p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 13,
                        color: 'rgba(148,163,184,0.9)',
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
          )}
        </div>
      </IonContent>
    </IonModal>
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
