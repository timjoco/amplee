import { Capacitor } from '@capacitor/core';
import {
  IonContent,
  IonIcon,
  IonItem,
  IonList,
  IonModal,
  IonSpinner,
  IonText,
} from '@ionic/react';

import {
  calendarOutline,
  locationOutline,
  musicalNotesOutline,
  settingsOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useRef, useState } from 'react';
import AvatarImageMobile from '../../../../components/ui/AvatarImageMobile';
import { supabase } from '../../../../lib/supabase';

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
  const isAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDismiss}
      breakpoints={[0, 0.9]}
      initialBreakpoint={0.9}
      handleBehavior="cycle"
      className="event-info-sheet"
    >
      <IonContent
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        <div
          style={{
            position: 'relative',
            padding: 16,
            paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${
              isAndroid ? 18 : 12
            }px)`,
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
              background: 'linear-gradient(90deg, #34d399 0%, #10b981 100%)',
              boxShadow: '0 0 8px rgba(52,211,153,0.4)',
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
              <IonSpinner name="dots" style={{ color: '#34d399' }} />
            </div>
          ) : (
            <>
              {/* Header row */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h2
                    style={{
                      margin: 0,
                      fontSize: 24,
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      color: '#F9FAFB',
                      letterSpacing: '-0.5px',
                    }}
                  >
                    {event.title || 'Event'}
                  </h2>
                  <p
                    style={{
                      margin: '4px 0 0',
                      fontSize: 13,
                      color: '#9ca3af',
                    }}
                  >
                    Event details and quick actions
                  </p>
                </div>

                {isAdmin && (
                  <button
                    type="button"
                    onClick={onGotoSettings}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: '1px solid rgba(52,211,153,0.3)',
                      background:
                        'linear-gradient(135deg, rgba(52,211,153,0.15) 0%, rgba(16,185,129,0.1) 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      WebkitTapHighlightColor: 'transparent',
                      touchAction: 'manipulation',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                    }}
                  >
                    <IonIcon
                      icon={settingsOutline}
                      style={{
                        fontSize: 20,
                        color: '#6ee7b7',
                        pointerEvents: 'none',
                      }}
                    />
                  </button>
                )}
              </div>

              <div
                style={{
                  flex: 1,
                  overflowY: 'auto',
                  paddingRight: 2,
                  paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${
                    isAndroid ? 18 : 12
                  }px)`,
                }}
              >
                {/* EVENT OVERVIEW CARD */}
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(16,185,129,0.04) 100%)',
                    border: '1px solid rgba(52,211,153,0.2)',
                    borderRadius: 20,
                    padding: 20,
                    marginBottom: 16,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <div style={{ marginBottom: 20 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: '#34d399',
                      }}
                    >
                      Event overview
                    </p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 13,
                        color: '#9ca3af',
                      }}
                    >
                      Basic info about this event
                    </p>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                    }}
                  >
                    {/* When */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(52,211,153,0.1)',
                          border: '1px solid rgba(52,211,153,0.2)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IonIcon
                          icon={calendarOutline}
                          style={{ fontSize: 18, color: '#6ee7b7' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            color: '#6b7280',
                            fontWeight: 600,
                          }}
                        >
                          When
                        </p>
                        <p
                          style={{
                            margin: '4px 0 0',
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#e5e7eb',
                          }}
                        >
                          {startsAtLabel || 'TBD'}
                        </p>
                      </div>
                    </div>

                    {/* Where */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(52,211,153,0.1)',
                          border: '1px solid rgba(52,211,153,0.2)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IonIcon
                          icon={locationOutline}
                          style={{ fontSize: 18, color: '#6ee7b7' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            color: '#6b7280',
                            fontWeight: 600,
                          }}
                        >
                          Where
                        </p>
                        <p
                          style={{
                            margin: '4px 0 0',
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#e5e7eb',
                          }}
                        >
                          {event.location || 'TBD'}
                        </p>
                      </div>
                    </div>

                    {/* Type */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: 'rgba(52,211,153,0.1)',
                          border: '1px solid rgba(52,211,153,0.2)',
                          display: 'grid',
                          placeItems: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <IonIcon
                          icon={musicalNotesOutline}
                          style={{ fontSize: 18, color: '#6ee7b7' }}
                        />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            margin: 0,
                            fontSize: 11,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            color: '#6b7280',
                            fontWeight: 600,
                          }}
                        >
                          Type
                        </p>
                        <p
                          style={{
                            margin: '4px 0 0',
                            fontSize: 14,
                            fontWeight: 500,
                            color: '#e5e7eb',
                          }}
                        >
                          {event.type === 'practice' ? 'Practice' : 'Show'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Add to Google Calendar */}
                  <div style={{ marginTop: 20 }}>
                    <button
                      type="button"
                      onClick={onExportGoogle}
                      disabled={!hasStart}
                      style={{
                        width: '100%',
                        padding: '14px 16px',
                        borderRadius: 14,
                        border: hasStart
                          ? '1px solid rgba(52,211,153,0.4)'
                          : '1px solid rgba(148,163,184,0.15)',
                        background: hasStart
                          ? 'linear-gradient(135deg, rgba(52,211,153,0.9) 0%, rgba(16,185,129,0.9) 100%)'
                          : 'rgba(255,255,255,0.02)',
                        color: hasStart ? '#fff' : '#6b7280',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: hasStart ? 'pointer' : 'not-allowed',
                        transition: 'all 0.2s ease',
                        WebkitTapHighlightColor: 'transparent',
                        touchAction: 'manipulation',
                        boxShadow: hasStart
                          ? '0 4px 14px rgba(52,211,153,0.3)'
                          : 'none',
                      }}
                    >
                      Add to Google Calendar
                    </button>
                  </div>
                </div>

                {/* LINEUP CARD */}
                <div
                  style={{
                    background:
                      'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
                    border: '1px solid rgba(148,163,184,0.12)',
                    borderRadius: 20,
                    padding: 20,
                    marginBottom: 16,
                    backdropFilter: 'blur(12px)',
                    WebkitBackdropFilter: 'blur(12px)',
                  }}
                >
                  <div style={{ marginBottom: 16 }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 12,
                        fontWeight: 700,
                        letterSpacing: 0.5,
                        textTransform: 'uppercase',
                        color: '#e5e7eb',
                      }}
                    >
                      Lineup
                    </p>
                    <p
                      style={{
                        margin: '4px 0 0',
                        fontSize: 13,
                        color: '#9ca3af',
                      }}
                    >
                      See who's in and who's out
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
                      <RosterPanelMobile eventId={event.id} />
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

function RosterPanelMobile({ eventId }: { eventId: string }) {
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);
  // Track user IDs for realtime filtering without causing re-subscriptions
  const userIdsRef = useRef<Set<string>>(new Set());
  const loadRosterRef = useRef<() => Promise<void>>();

  const loadRoster = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);

    try {
      console.log('[roster] eventId =', eventId);

      const { data: members, error: memErr } = await supabase
        .from('event_members')
        .select('user_id, status, needs_sub') // <-- adjust if your columns differ
        .eq('event_id', eventId); // <-- if this is wrong, you’ll see 0 rows

      if (memErr) {
        console.warn('[event_members select error]', memErr);
        setRows([]);
        return;
      }

      console.log('[roster] event_members rows =', members?.length, members);

      const ids = (members ?? []).map((m: any) => m.user_id).filter(Boolean);
      if (ids.length === 0) {
        setRows([]);
        return;
      }

      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, avatar_url, updated_at')
        .in('id', ids);

      if (profErr) {
        console.warn('[profiles select error]', profErr);
      }

      const byId = new Map(
        (profiles ?? []).map((p: any) => [
          p.id,
          {
            name: p.display_name ?? p.first_name ?? 'Member',
            avatar_url: p.avatar_url ?? null,
            updated_at: p.updated_at ?? null,
          },
        ])
      );

      const mapped: RosterRow[] = (members ?? []).map((m: any) => {
        const p = byId.get(m.user_id) ?? {
          name: 'Member',
          avatar_url: null,
          updated_at: null,
        };

        return {
          user_id: m.user_id,
          name: p.name,
          status: (m.status as RosterStatus) ?? 'pending',
          needs_sub: !!m.needs_sub,
          avatar_url: p.avatar_url,
          updated_at: p.updated_at,
        };
      });

      setRows(mapped);
      // Update ref for realtime filtering (doesn't trigger re-subscriptions)
      userIdsRef.current = new Set(mapped.map((r) => r.user_id));
    } finally {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, [eventId]);

  // Keep ref updated so realtime callbacks can call latest version
  loadRosterRef.current = loadRoster;

  useEffect(() => {
    initialLoadDone.current = false;
    setRows([]);
    userIdsRef.current = new Set();
    setLoading(true);
    void loadRoster();
  }, [loadRoster]);

  // Realtime: event_members changes for this event
  // NOTE: Only depends on eventId - uses ref for loadRoster to avoid re-subscriptions
  useEffect(() => {
    const ch = supabase
      .channel(`event:${eventId}:event-members`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_members',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // Use ref to get latest loadRoster without having it in deps
          void loadRosterRef.current?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId]);

  // Realtime: profile updates (patch rows if displayed users change)
  // NOTE: Only depends on eventId - uses userIdsRef to filter without re-subscriptions
  useEffect(() => {
    const chProf = supabase
      .channel(`event:${eventId}:profiles-roster`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload: any) => {
          const p = payload.new;
          if (!p) return;

          const userId = p.id as string;
          // Use ref instead of closure over rows - avoids re-subscription on rows change
          if (!userIdsRef.current.has(userId)) return;

          const name = (p.display_name ?? p.first_name ?? 'Member') as string;
          const avatar_url = (p.avatar_url ?? null) as string | null;
          const updated_at = (p.updated_at ?? null) as string | null;

          setRows((prev) =>
            prev.map((r) =>
              r.user_id === userId ? { ...r, name, avatar_url, updated_at } : r
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chProf);
    };
  }, [eventId]);

  const statusStyle = (s: RosterStatus) => {
    if (s === 'accepted') {
      return {
        bg: 'rgba(52, 211, 153, 0.1)',
        border: 'rgba(52, 211, 153, 0.3)',
        color: '#6ee7b7',
      };
    }
    if (s === 'declined') {
      return {
        bg: 'rgba(248, 113, 113, 0.1)',
        border: 'rgba(248, 113, 113, 0.3)',
        color: '#fca5a5',
      };
    }
    return {
      bg: 'rgba(251, 191, 36, 0.1)',
      border: 'rgba(251, 191, 36, 0.3)',
      color: '#fde68a',
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
        <IonSpinner name="dots" style={{ color: '#34d399' }} />
        <IonText color="medium">
          <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
            Loading roster…
          </p>
        </IonText>
      </div>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <IonText color="medium">
        <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
          No members on this event.
        </p>
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
                gap: 12,
                paddingBlock: 10,
              }}
            >
              <AvatarImageMobile
                name={r.name}
                bucket="profile-avatars"
                avatarPath={r.avatar_url || undefined}
                updatedAt={r.updated_at || undefined}
                size={40}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#e5e7eb',
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
                  paddingInline: 10,
                  paddingBlock: 5,
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  ...(r.needs_sub
                    ? {
                        background:
                          'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.1) 100%)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        color: '#93c5fd',
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

            {i < rows.length - 1 && (
              <div
                style={{
                  height: 1,
                  marginInline: 4,
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.1) 50%, transparent 100%)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
