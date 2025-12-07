/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonAvatar, IonIcon, IonSpinner, IonText } from '@ionic/react';
import { addOutline, chatbubbleOutline } from 'ionicons/icons';

import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useCallback, useEffect, useRef, useState } from 'react';
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
import { MessageBodyWithLinks } from './Chat/MessageBodyWithLinks';

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
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const eventIdsRef = useRef<string[]>(initial.events.map((e) => e.id));
  const lastMsgsRef = useRef<Record<string, LastMsg | undefined>>(
    initial.lastMsgs
  );

  const [pressedId, setPressedId] = useState<string | null>(null);
  const longPressTimeoutRef = useRef<number | null>(null);
  const pressStartRef = useRef<{ x: number; y: number } | null>(null);
  const MOVE_THRESHOLD = 12;

  // Admin-only create privilege
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

  const getRelativeTime = useCallback((dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays > 1 && diffDays <= 7) {
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    }
  }, []);

  const refreshEvents = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id ?? null;
    if (!userId) {
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
        detail: { kind: 'event', bandId },
      })
    );
  };

  const handlePressStart = useCallback(
    (
      id: string,
      e: React.TouchEvent<HTMLDivElement> | React.MouseEvent<HTMLDivElement>
    ) => {
      if (longPressTimeoutRef.current != null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }

      let clientX = 0,
        clientY = 0;
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
    if (
      Math.abs(t.clientX - x) > MOVE_THRESHOLD ||
      Math.abs(t.clientY - y) > MOVE_THRESHOLD
    ) {
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
          fontWeight: 600,
          fontSize: 14,
          color: 'rgba(148, 163, 184, 0.9)',
          background: 'rgba(30, 41, 59, 0.8)',
        }}
      >
        {initials}
      </div>
    );
  };

  if (loading && rows.length === 0) {
    if (suppressEmptyState) return null;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '20px 16px',
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

  // Empty state - unified with proposals style
  if (!suppressEmptyState && rows.length === 0 && !loading) {
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
            borderRadius: 20,
            padding: '32px 24px',
            textAlign: 'center',
            marginTop: 24,
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
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
              No Events Yet
            </h2>
            <p
              style={{
                margin: 0,
                color: 'rgba(148, 163, 184, 0.9)',
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              {isAdmin
                ? 'Create your first show or practice to get started.'
                : 'Events will appear here once your band admin schedules them.'}
            </p>
          </IonText>

          {/* Admin-only create button */}
          {canCreateEvent && (
            <button
              type="button"
              onClick={openGlobalCreateForBand}
              style={{
                marginTop: 24,
                display: 'inline-flex',
                alignItems: 'center',
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
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(52, 211, 153, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.4)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(52, 211, 153, 0.1)';
                e.currentTarget.style.borderColor = 'rgba(52, 211, 153, 0.25)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
              Create event
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingBlock: 4 }}>
      {rows.map((e) => {
        const when = getRelativeTime(e.starts_at);
        const lm = lastMsgs[e.id];
        const fallbackPreview =
          e.location || `${e.type === 'show' ? 'Show' : 'Practice'}`;
        const band = e.bands;
        const isPressed = pressedId === e.id;
        const isHovered = hoveredId === e.id;

        const avatarSrc = band?.id ? getAvatarSigned(band.id) : undefined;
        if (!avatarSrc && band?.id && band.avatar_url) {
          void (async () => {
            const url = await getAvatar(band.id, band.avatar_url!);
            if (url) setRows((r) => [...r]);
          })();
        }

        return (
          <div
            key={e.id}
            onClick={() => openEvent(e.band_id, e.id)}
            onMouseEnter={() => setHoveredId(e.id)}
            onMouseLeave={() => setHoveredId(null)}
            onTouchStart={(ev) => handlePressStart(e.id, ev)}
            onTouchMove={handlePressMove}
            onTouchEnd={handlePressEnd}
            onTouchCancel={handlePressEnd}
            onMouseDown={(ev) => handlePressStart(e.id, ev)}
            onMouseUp={handlePressEnd}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 12px',
              marginInline: 4,
              borderRadius: 8,
              cursor: 'pointer',
              background: isPressed
                ? 'rgba(52, 211, 153, 0.1)'
                : isHovered
                ? 'rgba(255, 255, 255, 0.03)'
                : 'transparent',
              transform: isPressed ? 'scale(0.98)' : 'scale(1)',
              transition: 'all 100ms ease-out',
            }}
          >
            {/* Avatar */}
            {showAvatars && (
              <IonAvatar
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  overflow: 'hidden',
                  flexShrink: 0,
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
            )}

            <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: 15,
                    color: 'rgba(241, 245, 249, 0.95)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {e.title || 'Event'}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background:
                      e.type === 'show'
                        ? 'rgba(168, 85, 247, 0.15)'
                        : 'rgba(59, 130, 246, 0.15)',
                    color:
                      e.type === 'show'
                        ? 'rgba(192, 132, 252, 0.9)'
                        : 'rgba(96, 165, 250, 0.9)',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    textTransform: 'capitalize',
                  }}
                >
                  {e.type}
                </span>
                <span style={{ flex: 1 }} />
                {when && (
                  <span
                    style={{
                      fontSize: 12,
                      color: 'rgba(148, 163, 184, 0.6)',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    {when}
                  </span>
                )}
              </div>

              {/* Preview text / last message */}
              <div
                style={{
                  margin: 0,
                  fontSize: 13,
                  color: 'rgba(148, 163, 184, 0.7)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  lineHeight: 1.4,
                  opacity: 0.7, // <-- slightly muted to indicate preview
                }}
              >
                {lm?.body ? (
                  <div
                    style={{
                      display: 'inline-block',
                      maxWidth: '100%',
                      opacity: 0.9, // keep content readable but still a bit softer than full chat
                    }}
                  >
                    <MessageBodyWithLinks
                      body={lm.body}
                      preview={undefined}
                      status={undefined}
                      onSongNavigate={(songId) =>
                        nav(`/bands/${e.band_id}/songs/${songId}`)
                      }
                    />
                  </div>
                ) : (
                  fallbackPreview
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Admin-only add button when list has items */}
      {canCreateEvent && rows.length > 0 && (
        <div style={{ padding: '12px 16px' }}>
          <button
            type="button"
            onClick={openGlobalCreateForBand}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 12px',
              borderRadius: 6,
              border: 'none',
              background: 'transparent',
              color: 'rgba(148, 163, 184, 0.7)',
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
              e.currentTarget.style.color = 'rgba(52, 211, 153, 0.9)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'rgba(148, 163, 184, 0.7)';
            }}
          >
            <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
            Add event
          </button>
        </div>
      )}
    </div>
  );
}
