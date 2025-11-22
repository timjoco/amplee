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
import { addOutline, chevronForwardOutline } from 'ionicons/icons';

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
  isAdmin,
}: {
  onLoaded?: (count: number) => void;
  bandId?: string;
  showAvatars?: boolean;
  enableCreateForBand?: boolean;
  isAdmin?: boolean;
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
      setRows([]);
      setLastMsgs({});
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
      setRows([]);
      setLastMsgs({});
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
          fontWeight: 800,
          fontSize: 16,
        }}
      >
        {initials}
      </div>
    );
  };

  // --- role guards --- //
  if (loading && rows.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IonSpinner name="dots" />
        <IonText color="medium">Loading…</IonText>
      </div>
    );
  }

  if (rows.length === 0) {
    const message = isAdmin
      ? 'No events yet. Create one to get your band calendar started.'
      : 'No events yet. Your band admin can create events for upcoming shows and practices.';

    return (
      <div style={{ paddingBottom: 16 }}>
        <div style={{ padding: 16 }}>
          <IonText color="medium">
            <p style={{ margin: 0 }}>{message}</p>
          </IonText>
        </div>

        {canCreateEvent && (
          <div
            style={{
              padding: 16,
              paddingTop: 0,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <IonButton
              fill="outline"
              size="default"
              onClick={openGlobalCreateForBand}
              style={{
                '--color': 'rgba(52, 211, 153, 0.95)',
                '--border-color': 'rgba(52, 211, 153, 0.95)',
                '--background-activated': 'rgba(52, 211, 153, 0.95)',
                '--border-color-activated': 'rgba(52, 211, 153, 0.95)',
                '--color-activated': '#000000',
                borderRadius: 999,
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

  // --- Render list --- //
  return (
    <div
      style={{
        paddingTop: 4,
        paddingBottom: 8,
        paddingLeft: 0,
        paddingRight: 0,
      }}
    >
      <IonList
        style={{
          margin: 0,
          padding: 0,
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          rowGap: 4,
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
                marginInline: -20,
                paddingInline: 0,
                paddingBlock: 3,
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
                  borderRadius: 20,
                  paddingInline: 10,
                  paddingBlock: 10,
                  minHeight: 85,
                  width: '100%',
                  display: 'grid',
                  gridTemplateColumns: showAvatars
                    ? 'auto 1fr auto auto'
                    : '1fr auto auto',
                  alignItems: 'center',
                  columnGap: 10,
                  background:
                    'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                  boxShadow: isPressed
                    ? '0 18px 40px rgba(0,0,0,0.9)'
                    : '0 10px 24px rgba(0,0,0,.32)',
                  transform: isPressed ? 'scale(1.03)' : 'scale(1)',
                  transition:
                    'transform 120ms ease-out, box-shadow 120ms ease-out, background 120ms ease-out',
                }}
              >
                {showAvatars && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <IonAvatar
                      style={{
                        width: 48,
                        height: 48,
                        background: 'rgba(15,23,42,0.9)',
                        boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.06)',
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
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontWeight: 800,
                      fontSize: 16,
                      letterSpacing: 0.2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={e.title || 'Event'}
                  >
                    {e.title || 'Event'}
                  </span>

                  <span
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      opacity: 0.8,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={preview}
                  >
                    {preview}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    gap: 4,
                    marginLeft: 6,
                  }}
                >
                  {!!when && (
                    <span
                      style={{
                        fontSize: 11,
                        opacity: 0.7,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {when}
                    </span>
                  )}
                  <EventStatusChip
                    isBooked={e.is_booked}
                    isCancelled={e.is_cancelled}
                    size="md"
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-end',
                    paddingLeft: 4,
                  }}
                >
                  <IonIcon
                    icon={chevronForwardOutline}
                    style={{ fontSize: 18, opacity: 0.6 }}
                  />
                </div>
              </div>
            </IonItem>
          );
        })}
      </IonList>

      {enableCreateForBand && bandId && (
        <div
          style={{
            marginTop: 12,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <IonButton
            fill="outline"
            size="default"
            onClick={openGlobalCreateForBand}
            style={{
              '--color': 'rgba(52, 211, 153, 0.95)',
              '--border-color': 'rgba(52, 211, 153, 0.95)',
              '--background-activated': 'rgba(52, 211, 153, 0.95)',
              '--border-color-activated': 'rgba(52, 211, 153, 0.95)',
              '--color-activated': '#000000',
              borderRadius: 999,
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
