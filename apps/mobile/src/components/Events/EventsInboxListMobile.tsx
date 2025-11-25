/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonAvatar,
  IonButton,
  IonIcon,
  IonItem,
  IonList,
  IonSpinner,
  IonText,
} from '@ionic/react';
import {
  addOutline,
  chatbubbleOutline,
  chevronForwardOutline,
} from 'ionicons/icons';

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  EventRow,
  getAvatarSigned,
  getCache,
  needsEventRefresh,
  setAvatarPath,
  setAvatarSigned,
  setEvents,
  setLastMsgsBulk,
  upsertLastMsg,
} from '../../lib/cache/eventInboxCache';
import { supabase } from '../../lib/supabase';
import EventStatusChip from './EventStatusChip';

type LastMsg = { event_id: string; body: string; created_at: string };

export default function EventInboxListMobile({
  onLoaded,
  bandId,
  showAvatars = true,
  enableCreateForBand = false,
  isAdmin = false,
  suppressEmptyState = false,
}: {
  onLoaded?: (count: number) => void;
  bandId?: string;
  showAvatars?: boolean;
  enableCreateForBand?: boolean;
  isAdmin?: boolean;
  suppressEmptyState?: boolean;
}) {
  const nav = useNavigate();

  const initial = bandId
    ? {
        events: [] as EventRow[],
        lastMsgs: {} as Record<string, LastMsg | undefined>,
      }
    : getCache();

  const [rows, setRows] = useState<EventRow[]>(initial.events);
  const [lastMsgs, setLastMsgs] = useState<Record<string, LastMsg | undefined>>(
    initial.lastMsgs
  );
  const [loading, setLoading] = useState(bandId ? true : needsEventRefresh());

  const eventIdsRef = useRef<string[]>(initial.events.map((e) => e.id));
  const lastMsgsRef = useRef<Record<string, LastMsg | undefined>>(
    initial.lastMsgs
  );

  // long-press tracking (for haptic + visual puff)
  const longPressTimeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);

  const [pressedId, setPressedId] = useState<string | null>(null);
  const MOVE_THRESHOLD = 12;

  const canCreateEvent = Boolean(enableCreateForBand && bandId && isAdmin);

  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('[event inbox haptic error]', e);
    }
  }, []);

  useEffect(() => {
    lastMsgsRef.current = lastMsgs;
  }, [lastMsgs]);

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    []
  );

  const refreshEvents = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id ?? null;
    if (!userId) {
      // No user: clear local + cached rows so we don't flash old data
      setRows([]);
      setLastMsgs({});
      if (!bandId) {
        setEvents([]);
        setLastMsgsBulk({});
      }
      onLoaded?.(0);
      return;
    }

    let bandIds: string[] = [];
    if (bandId) {
      bandIds = [bandId];
    } else {
      const { data: mems } = await supabase
        .from('band_members')
        .select('band_id')
        .eq('user_id', userId);
      bandIds = (mems ?? []).map((m: any) => String(m.band_id));
    }

    if (bandIds.length === 0) {
      // No bands: clear events + cache
      setRows([]);
      setLastMsgs({});
      if (!bandId) {
        setEvents([]);
        setLastMsgsBulk({});
      }
      onLoaded?.(0);
      return;
    }

    const { data: events } = await supabase
      .from('events_with_my_attendance')
      .select(
        'id, band_id, title, type, starts_at, ends_at, location, notes, is_booked, is_cancelled, my_event_status, bands(id, name, avatar_url)'
      )
      .in('band_id', bandIds)
      .order('starts_at', { ascending: true })
      .limit(200);

    const toTs = (s?: string | null) =>
      s ? new Date(s).getTime() : Number.POSITIVE_INFINITY;
    const now = Date.now();

    const normalized: EventRow[] = (events ?? []).map((e: any) => ({
      id: String(e.id),
      band_id: String(e.band_id),
      title: String(e.title ?? ''),
      type: e.type === 'practice' ? 'practice' : 'show',
      starts_at: e.starts_at ?? null,
      ends_at: e.ends_at ?? null,
      location: e.location ?? null,
      notes: e.notes ?? null,
      is_booked: Boolean(e.is_booked),
      is_cancelled: Boolean(e.is_cancelled),
      my_event_status:
        (e.my_event_status as EventRow['my_event_status']) ?? 'pending',
      bands: Array.isArray(e.bands)
        ? e.bands[0]
          ? {
              id: String(e.bands[0].id),
              name: String(e.bands[0].name ?? ''),
              avatar_url: e.bands[0].avatar_url ?? null,
            }
          : null
        : e.bands
        ? {
            id: String(e.bands.id),
            name: String(e.bands.name ?? ''),
            avatar_url: e.bands.avatar_url ?? null,
          }
        : null,
    }));

    const upcoming = normalized
      .filter((e) => e.starts_at && toTs(e.starts_at) >= now)
      .sort((a, b) => toTs(a.starts_at) - toTs(b.starts_at));
    const past = normalized
      .filter((e) => !e.starts_at || toTs(e.starts_at) < now)
      .sort((a, b) => toTs(b.starts_at) - toTs(a.starts_at));
    const sorted = [...upcoming, ...past];

    if (!bandId) setEvents(sorted);

    setRows(sorted);
    eventIdsRef.current = sorted.map((e) => e.id);
    onLoaded?.(sorted.length);

    if (showAvatars) {
      for (const e of sorted) {
        if (e.bands?.id && e.bands.avatar_url) {
          setAvatarPath(e.bands.id, e.bands.avatar_url);
        }
      }
    }

    const missingIds = sorted
      .map((e) => e.id)
      .filter((id) => !lastMsgsRef.current[id]);

    if (missingIds.length) {
      const { data: msgs } = await supabase
        .from('event_messages')
        .select('event_id, body, created_at')
        .in('event_id', missingIds)
        .order('created_at', { ascending: false })
        .limit(1000);

      const map: Record<string, LastMsg> = {};
      for (const m of msgs ?? []) {
        if (!map[m.event_id]) map[m.event_id] = m as LastMsg;
      }

      setLastMsgs((prev) => ({ ...prev, ...map }));
      setLastMsgsBulk(map);
    }
  }, [bandId, onLoaded, showAvatars]);

  useEffect(() => {
    setLoading(true);
    void refreshEvents().finally(() => setLoading(false));
  }, [bandId, refreshEvents]);

  useEffect(() => {
    const ch = supabase
      .channel('dashboard:event-inbox')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_messages' },
        (payload: { new: LastMsg }) => {
          const msg = payload.new as LastMsg;
          if (!eventIdsRef.current.includes(msg.event_id)) return;
          upsertLastMsg(msg);
          setLastMsgs((prev) => {
            const cur = prev[msg.event_id];
            if (!cur || new Date(msg.created_at) > new Date(cur.created_at)) {
              return { ...prev, [msg.event_id]: msg };
            }
            return prev;
          });
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const getAvatar = useCallback(
    async (bandId: string, path: string | null | undefined) => {
      if (!showAvatars || !bandId || !path) return undefined;
      const cached = getAvatarSigned(bandId);
      if (cached) return cached;
      const { data, error } = await supabase.storage
        .from('band-avatars')
        .createSignedUrl(path, 60 * 60);
      if (!error && data?.signedUrl) {
        setAvatarSigned(bandId, data.signedUrl, 60 * 60);
        return data.signedUrl;
      }
      return undefined;
    },
    [showAvatars]
  );

  const openEvent = (bId: string, eventId: string) => {
    nav(`/bands/${bId}/events/${eventId}`);
  };

  const openGlobalCreateForBand = () => {
    if (!bandId) return;
    window.dispatchEvent(
      new CustomEvent('amplee:global-create', {
        detail: {
          kind: 'event',
          bandId,
        },
      })
    );
  };

  // --- Long-press haptic --- //
  const handlePressStart = useCallback(
    (
      id: string,
      e:
        | React.TouchEvent<HTMLDivElement>
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      if (longPressTimeoutRef.current != null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }

      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      pressStartRef.current = { x: clientX, y: clientY };

      longPressTimeoutRef.current = window.setTimeout(() => {
        setPressedId(id);
        void triggerHaptic();
      }, 350);
    },
    [triggerHaptic]
  );

  const handlePressMove = useCallback((e: React.TouchEvent<HTMLDivElement>) => {
    if (!pressStartRef.current || longPressTimeoutRef.current == null) return;
    if (e.touches.length !== 1) return;

    const { x, y } = pressStartRef.current;
    const t = e.touches[0];
    const dx = t.clientX - x;
    const dy = t.clientY - y;

    if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
  }, []);

  const handlePressEnd = useCallback(() => {
    if (longPressTimeoutRef.current != null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    pressStartRef.current = null;

    if (pressedId != null) {
      setTimeout(() => setPressedId(null), 130);
    }
  }, [pressedId]);

  // --- Avatar initials --- //
  const renderAvatarInitials = (name?: string | null) => {
    const initials =
      name
        ?.split(/\s+/)
        .slice(0, 2)
        .map((p) => p[0]?.toUpperCase())
        .join('') || '?';

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 700,
          fontSize: 15,
          color: 'rgba(226, 232, 240, 0.9)',
        }}
      >
        {initials}
      </div>
    );
  };

  // --- role guards / loading --- //
  if (loading && rows.length === 0) {
    if (suppressEmptyState) {
      return null;
    }
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '20px 0',
        }}
      >
        <IonSpinner
          name="dots"
          style={{ '--color': 'rgba(52, 211, 153, 0.8)' } as any}
        />
        <IonText style={{ color: 'rgba(156, 163, 175, 0.9)', fontSize: 14 }}>
          Loading events…
        </IonText>
      </div>
    );
  }

  if (!suppressEmptyState && rows.length === 0 && !loading) {
    const subtitle = enableCreateForBand
      ? 'Create your first show or practice to start a chat.'
      : 'Event chats will show up here once your band has shows or practices.';

    const openGlobalCreateForBand = () => {
      if (bandId) {
        window.dispatchEvent(
          new CustomEvent('amplee:global-create', {
            detail: {
              kind: 'event',
              bandId,
            },
          })
        );
      }
    };

    return (
      <div
        style={{
          padding: '16px',
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        <div
          style={{
            background: 'transparent',
            border: '1px solid rgba(52, 211, 153, 0.2)',
            borderRadius: '20px',
            padding: '32px 24px',
            textAlign: 'center',
            marginTop: '24px',
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '16px',
              background: 'rgba(52, 211, 153, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: '1px solid rgba(52, 211, 153, 0.2)',
            }}
          >
            <IonIcon
              icon={chatbubbleOutline}
              style={{ fontSize: 32, color: 'rgba(52, 211, 153, 0.9)' }}
            />
          </div>
          <IonText color="light">
            <h2
              style={{
                margin: '0 0 8px',
                fontSize: 18,
                fontWeight: 700,
                color: 'rgba(241, 245, 249, 0.95)',
                letterSpacing: '-0.01em',
              }}
            >
              No Event Chats Yet
            </h2>
            <p
              style={{
                margin: 0,
                color: 'rgba(148, 163, 184, 0.9)',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {subtitle}
            </p>
          </IonText>

          {/* ONLY show button if enableCreateForBand AND isAdmin */}
          {enableCreateForBand && isAdmin && (
            <div
              style={{
                marginTop: 20,
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
              }}
            >
              <button
                type="button"
                onClick={openGlobalCreateForBand}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: '1px solid rgba(52, 211, 153, 0.25)',
                  background: 'rgba(52, 211, 153, 0.1)',
                  color: 'rgba(52, 211, 153, 0.95)',
                  fontSize: 14.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                  width: '100%',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 211, 153, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.4)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(52, 211, 153, 0.1)';
                  e.currentTarget.style.borderColor =
                    'rgba(52, 211, 153, 0.25)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
                Create an event
              </button>

              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  color: 'rgba(148, 163, 184, 0.75)',
                }}
              >
                Or tap the Global Create{' '}
                <span
                  style={{ fontWeight: 700, color: 'rgba(52, 211, 153, 0.9)' }}
                >
                  +
                </span>{' '}
                in the bottom bar.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- Render list --- //
  return (
    <div
      style={{
        paddingTop: 0,
        paddingBottom: 12,
        marginInline: -12,
      }}
    >
      <IonList
        style={{
          margin: 0,
          padding: 0,
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {rows.map((e) => {
          const when = e.starts_at ? timeFmt.format(new Date(e.starts_at)) : '';
          const lm = lastMsgs[e.id];
          const preview =
            lm?.body ??
            (e.location ? `Location: ${e.location}` : `${e.type} scheduled`);
          const band = e.bands;
          const isPressed = pressedId === e.id;

          const avatarSrc = band?.id ? getAvatarSigned(band.id) : undefined;
          if (!avatarSrc && band?.id && band.avatar_url) {
            void (async () => {
              const url = await getAvatar(band.id, band.avatar_url!);
              if (url) setRows((r) => [...r]);
            })();
          } else if (avatarSrc === undefined && band?.avatar_url) {
            setAvatarPath(band.id, band.avatar_url);
          }

          return (
            <IonItem
              key={e.id}
              detail={false}
              onClick={() => openEvent(e.band_id, e.id)}
              lines="none"
              style={{
                ['--background' as any]: 'transparent',
                ['--background-hover' as any]: 'transparent',
                ['--background-activated' as any]: 'transparent',
                ['--ripple-color' as any]: 'transparent',
                paddingInline: 0,
                paddingBlock: 0,
              }}
            >
              <div
                onTouchStart={(ev) => handlePressStart(e.id, ev)}
                onTouchMove={handlePressMove}
                onTouchEnd={handlePressEnd}
                onTouchCancel={handlePressEnd}
                onMouseDown={(ev) => handlePressStart(e.id, ev)}
                onMouseUp={handlePressEnd}
                onMouseLeave={handlePressEnd}
                style={{
                  paddingInline: 0,
                  paddingBlock: 0,
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: showAvatars ? '64px 1fr' : '1fr',
                  alignItems: 'center',
                  columnGap: 0,
                  background: 'transparent',
                  transform: isPressed ? 'scale(0.99)' : 'scale(1)',
                  opacity: isPressed ? 0.7 : 1,
                  transition: 'all 120ms ease-out',
                }}
              >
                {showAvatars && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'flex-start',
                      paddingTop: 12,
                      paddingBottom: 12,
                      paddingLeft: 4,
                    }}
                  >
                    <IonAvatar
                      style={{
                        width: 52,
                        height: 52,
                        background: 'rgba(15, 23, 42, 0.6)',
                        border: '1px solid rgba(71, 85, 105, 0.2)',
                        flexShrink: 0,
                        overflow: 'hidden',
                      }}
                    >
                      {avatarSrc ? (
                        <img
                          src={avatarSrc}
                          alt={band?.name || 'Band'}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        renderAvatarInitials(band?.name)
                      )}
                    </IonAvatar>
                  </div>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    alignItems: 'center',
                    columnGap: 14,
                    paddingInline: showAvatars ? '0 16px' : '16px',
                    paddingBlock: 12,
                    borderBottom: '0.5px solid rgba(71, 85, 105, 0.55)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      minWidth: 0,
                      gap: 4,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        justifyContent: 'space-between',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontWeight: 600,
                          fontSize: 17,
                          letterSpacing: '-0.02em',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          color: 'rgba(248, 250, 252, 0.95)',
                        }}
                        title={e.title || 'Event'}
                      >
                        {e.title || 'Event'}
                      </span>
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          color: 'rgba(148, 163, 184, 0.95)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.4,
                          flex: 1,
                        }}
                        title={preview}
                      >
                        {preview}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      justifyContent: 'flex-start',
                      gap: 8,
                    }}
                  >
                    {!!when && (
                      <span
                        style={{
                          fontSize: 14,
                          color: 'rgba(148, 163, 184, 0.75)',
                          whiteSpace: 'nowrap',
                          fontWeight: 400,
                        }}
                      >
                        {when}
                      </span>
                    )}
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                      <EventStatusChip
                        isBooked={e.is_booked}
                        isCancelled={e.is_cancelled}
                        size="md"
                      />
                      <IonIcon
                        icon={chevronForwardOutline}
                        style={{
                          fontSize: 16,
                          color: 'rgba(100, 116, 139, 0.5)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </IonItem>
          );
        })}
      </IonList>

      {canCreateEvent && rows.length > 0 && (
        <div
          style={{
            marginTop: 16,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <IonButton
            fill="clear"
            size="small"
            onClick={openGlobalCreateForBand}
            style={{
              '--color': 'rgba(52, 211, 153, 0.9)',
              '--padding-start': '16px',
              '--padding-end': '16px',
              '--border-radius': '10px',
              fontWeight: 700,
              fontSize: 13.5,
            }}
          >
            <IonIcon icon={addOutline} slot="start" />
            Create new event
          </IonButton>
        </div>
      )}
    </div>
  );
}

// Empty state component for EventInboxListMobile
// Replace your existing empty state with this:

function EmptyEventState({
  canCreateEvent,
  openGlobalCreateForBand,
  isForBand,
}: {
  canCreateEvent: boolean;
  openGlobalCreateForBand: () => void;
  isForBand: boolean;
}) {
  const subtitle = isForBand
    ? 'Create your first show or practice to start a chat.'
    : 'Event chats will show up here once your band has shows or practices.';

  return (
    <div
      style={{
        padding: '16px',
        maxWidth: '600px',
        margin: '0 auto',
      }}
    >
      <div
        style={{
          background: 'transparent',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          borderRadius: '20px',
          padding: '32px 24px',
          textAlign: 'center',
          marginTop: '24px',
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: '16px',
            background: 'rgba(52, 211, 153, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: '1px solid rgba(52, 211, 153, 0.2)',
          }}
        >
          <IonIcon
            icon={chatbubbleOutline}
            style={{ fontSize: 32, color: 'rgba(52, 211, 153, 0.9)' }}
          />
        </div>
        <IonText color="light">
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 18,
              fontWeight: 700,
              color: 'rgba(241, 245, 249, 0.95)',
              letterSpacing: '-0.01em',
            }}
          >
            No Event Chats Yet
          </h2>
          <p
            style={{
              margin: 0,
              color: 'rgba(148, 163, 184, 0.9)',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </p>
        </IonText>

        {canCreateEvent && (
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <IonButton
              expand="block"
              size="default"
              onClick={openGlobalCreateForBand}
              style={{
                '--color': '#0a0a0a',
                '--background':
                  'linear-gradient(135deg, rgba(52,211,153,0.95), rgba(16,185,129,0.95))',
                '--background-hover':
                  'linear-gradient(135deg, rgba(52,211,153,1), rgba(16,185,129,1))',
                '--border-radius': '12px',
                '--padding-top': '12px',
                '--padding-bottom': '12px',
                fontWeight: 700,
                fontSize: 14.5,
                letterSpacing: '0.02em',
              }}
            >
              Create an event
            </IonButton>

            <p
              style={{
                margin: 0,
                fontSize: 12,
                color: 'rgba(148, 163, 184, 0.75)',
              }}
            >
              Or tap the Global Create{' '}
              <span
                style={{ fontWeight: 700, color: 'rgba(52, 211, 153, 0.9)' }}
              >
                +
              </span>{' '}
              in the bottom bar.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
