/* eslint-disable @next/next/no-img-element */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonAvatar,
  IonItem,
  IonLabel,
  IonList,
  IonSpinner,
  IonText,
} from '@ionic/react';
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
} from '../../lib/eventInboxCache';
import { supabase } from '../../lib/supabase';

type LastMsg = { event_id: string; body: string; created_at: string };

export default function EventInboxListMobile({
  onLoaded,
  bandId,
  showAvatars = true,
}: {
  onLoaded?: (count: number) => void;
  bandId?: string;
  showAvatars?: boolean;
}) {
  const nav = useNavigate();

  // hydrate from cache immediately
  const initial = getCache();
  const [rows, setRows] = useState<EventRow[]>(initial.events);
  const [lastMsgs, setLastMsgs] = useState<Record<string, LastMsg | undefined>>(
    initial.lastMsgs
  );
  const [loading, setLoading] = useState(needsEventRefresh());
  const eventIdsRef = useRef<string[]>(initial.events.map((e) => e.id));

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

  // Fetch events only if cache is stale or we’re filtering by bandId (filtering needs fresh query)
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

    // normalize + sort (upcoming asc, past desc)
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

    // cache events
    setEvents(sorted);
    setRows(sorted);
    eventIdsRef.current = sorted.map((e) => e.id);
    onLoaded?.(sorted.length);

    // seed avatar paths into cache
    if (showAvatars) {
      for (const e of sorted) {
        if (e.bands?.id && e.bands.avatar_url) {
          setAvatarPath(e.bands.id, e.bands.avatar_url);
        }
      }
    }

    // fetch last-messages only for events missing a cached preview
    const missingIds = sorted
      .map((e) => e.id)
      .filter((id) => !initial.lastMsgs[id]);
    if (missingIds.length) {
      const { data: msgs } = await supabase
        .from('event_messages')
        .select('event_id, body, created_at')
        .in('event_id', missingIds)
        .order('created_at', { ascending: false })
        .limit(1000);
      const map: Record<string, LastMsg> = {};
      for (const m of msgs ?? []) {
        // keep first (newest) per event
        if (!map[m.event_id]) map[m.event_id] = m as LastMsg;
      }
      // update cache and state
      setLastMsgs((prev) => ({ ...prev, ...map }));
      setLastMsgsBulk(map);
    }
  }, [bandId, onLoaded, showAvatars, initial.lastMsgs]);

  // Initial mount: show cache immediately, then (maybe) refresh events if stale/filtered.
  useEffect(() => {
    if (needsEventRefresh() || bandId) {
      setLoading(true);
      void refreshEvents().finally(() => setLoading(false));
    } else {
      // up-to-date cache; nothing to do
      onLoaded?.(rows.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bandId]);

  // Realtime: insert messages update just the last message (no refetch)
  useEffect(() => {
    const ch = supabase
      .channel('dashboard:event-inbox')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_messages' },
        (payload) => {
          const msg = payload.new as LastMsg;
          if (!eventIdsRef.current.includes(msg.event_id)) return;
          // update cache first, then state
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

  // Avatar signed URLs: resolve on-demand per row if expired/missing
  const getAvatar = useCallback(
    async (bandId: string, path: string | null | undefined) => {
      if (!showAvatars || !bandId || !path) return undefined;
      const cached = getAvatarSigned(bandId);
      if (cached) return cached;
      const { data, error } = await supabase.storage
        .from('band-avatars')
        .createSignedUrl(path, 60 * 60); // 1h
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

  // ----- Render -----
  if (loading && rows.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IonSpinner name="dots" />
        <IonText color="medium">Loading…</IonText>
      </div>
    );
  }

  if (rows.length === 0) {
    return <IonText color="medium">No events yet.</IonText>;
  }

  return (
    <IonList inset>
      {rows.map((e) => {
        const when = e.starts_at ? timeFmt.format(new Date(e.starts_at)) : '';
        const lm = lastMsgs[e.id];
        const preview =
          lm?.body ??
          (e.location ? `Location: ${e.location}` : `${e.type} scheduled`);
        const band = e.bands;

        // lazy avatar (signed URL only when needed/expired)
        const avatarSrc = band?.id ? getAvatarSigned(band.id) : undefined;
        if (!avatarSrc && band?.id && band.avatar_url) {
          // fire-and-forget (no reflow): resolve and then trigger a tiny state update
          void (async () => {
            const url = await getAvatar(band.id, band.avatar_url!);
            if (url) {
              // micro state tick to paint new avatar
              setRows((r) => [...r]);
            }
          })();
        } else if (avatarSrc === undefined && band?.avatar_url) {
          // ensure path is in cache for future signing
          setAvatarPath(band.id, band.avatar_url);
        }

        return (
          <IonItem
            key={e.id}
            button
            detail={false} // no chevron
            onClick={() => openEvent(e.band_id, e.id)}
            style={{
              borderRadius: 12,
              marginBlock: 6,
              alignItems: 'flex-start',
              background:
                'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
              border: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            {showAvatars && (
              <div slot="start" style={{ marginRight: 10, marginTop: 8 }}>
                <IonAvatar
                  style={{
                    width: 48,
                    height: 48,
                    background: 'rgba(255,255,255,0.06)',
                    boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.06)',
                    fontWeight: 800,
                    color: '#fff',
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
                    (band?.name || '?')
                      .split(/\s+/)
                      .slice(0, 2)
                      .map((p) => p[0]?.toUpperCase())
                      .join('')
                  )}
                </IonAvatar>
              </div>
            )}

            <IonLabel>
              {/* Row 1: title + when */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 8,
                  alignItems: 'center',
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontWeight: 900,
                    letterSpacing: 0.2,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: 16,
                  }}
                  title={e.title || 'Event'}
                >
                  {e.title || 'Event'}
                </h2>
                {!!when && (
                  <span
                    style={{
                      opacity: 0.7,
                      whiteSpace: 'nowrap',
                      fontSize: 12,
                      marginLeft: 8,
                    }}
                  >
                    {when}
                  </span>
                )}
              </div>

              {/* Row 2: preview (left) — tiny status chip (right) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 8,
                  alignItems: 'center',
                  marginTop: 4,
                }}
              >
                <p
                  style={{
                    margin: 0,
                    opacity: 0.85,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontSize: 13.5,
                  }}
                  title={preview}
                >
                  {preview}
                </p>

                <MiniStatusChip isBooked={e.is_booked} />
              </div>
            </IonLabel>
          </IonItem>
        );
      })}
    </IonList>
  );
}

function MiniStatusChip({ isBooked }: { isBooked: boolean }) {
  const label = isBooked ? 'Booked' : 'Pending';
  const bg = isBooked ? 'rgba(76,175,80,0.18)' : 'rgba(255,193,7,0.18)';
  const brd = isBooked ? 'rgba(76,175,80,0.35)' : 'rgba(255,193,7,0.35)';
  const color = isBooked ? '#B7E7BF' : '#FFE19A';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        height: 22,
        padding: '0 8px',
        borderRadius: 999,
        fontSize: 12,
        lineHeight: '22px',
        background: bg,
        color,
        border: `1px solid ${brd}`,
        userSelect: 'none',
      }}
    >
      {label}
    </span>
  );
}
