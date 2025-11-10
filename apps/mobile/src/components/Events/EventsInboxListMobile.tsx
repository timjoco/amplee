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
import { supabase } from '../../lib/supabase';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice';
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  is_cancelled: boolean;
  is_booked: boolean;
  my_event_status: 'pending' | 'confirmed' | 'cancelled';
  bands: { id: string; name: string; avatar_url: string | null } | null;
};

type LastMsg = {
  event_id: string;
  body: string;
  created_at: string;
};

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
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<EventRow[]>([]);
  const [lastMsgs, setLastMsgs] = useState<Record<string, LastMsg | undefined>>(
    {}
  );
  const [avatarMap, setAvatarMap] = useState<
    Record<string, string | undefined>
  >({});
  const eventIdsRef = useRef<string[]>([]);

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

  const load = useCallback(async () => {
    setLoading(true);

    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id ?? null;

    if (!userId) {
      setRows([]);
      setLastMsgs({});
      setAvatarMap({});
      setLoading(false);
      onLoaded?.(0);
      return;
    }

    // 1) Compute the set of band IDs to include
    let bandIds: string[] = [];
    if (bandId) {
      bandIds = [bandId];
    } else {
      const { data: mems, error: memErr } = await supabase
        .from('band_members')
        .select('band_id')
        .eq('user_id', userId);
      if (memErr) {
        setRows([]);
        setLastMsgs({});
        setAvatarMap({});
        setLoading(false);
        onLoaded?.(0);
        return;
      }
      bandIds = (mems ?? []).map((m: any) => String(m.band_id));
    }

    if (bandIds.length === 0) {
      setRows([]);
      setLastMsgs({});
      setAvatarMap({});
      setLoading(false);
      onLoaded?.(0);
      return;
    }

    // 2) Pull events from the view with my attendance + join bands
    const { data: events, error: eErr } = await supabase
      .from('events_with_my_attendance')
      .select(
        'id, band_id, title, type, starts_at, ends_at, location, notes, is_booked, is_cancelled, my_event_status, bands(id, name, avatar_url)'
      )
      .in('band_id', bandIds)
      .order('starts_at', { ascending: true })
      .limit(200);

    if (eErr) {
      setRows([]);
      setLastMsgs({});
      setAvatarMap({});
      setLoading(false);
      onLoaded?.(0);
      return;
    }

    // 3) Normalize record shapes (bands may be object or 1-element array)
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

    // 4) Sort upcoming first (ascending) then past (descending)
    const now = Date.now();
    const toTs = (s?: string | null) =>
      s ? new Date(s).getTime() : Number.POSITIVE_INFINITY;
    const upcoming = normalized
      .filter((e) => e.starts_at && toTs(e.starts_at) >= now)
      .sort((a, b) => toTs(a.starts_at) - toTs(b.starts_at));
    const past = normalized
      .filter((e) => !e.starts_at || toTs(e.starts_at) < now)
      .sort((a, b) => toTs(b.starts_at) - toTs(a.starts_at));
    const sorted = [...upcoming, ...past];

    setRows(sorted);
    eventIdsRef.current = sorted.map((e) => e.id);
    onLoaded?.(sorted.length);

    // 5) Get the last message per event
    if (sorted.length > 0) {
      const ids = sorted.map((e) => e.id);
      const { data: msgs, error: mErr } = await supabase
        .from('event_messages')
        .select('event_id, body, created_at')
        .in('event_id', ids)
        .order('created_at', { ascending: false })
        .limit(1000);
      if (!mErr) {
        const map: Record<string, LastMsg> = {};
        for (const m of msgs ?? []) {
          if (!map[m.event_id]) map[m.event_id] = m as LastMsg;
        }
        setLastMsgs(map);
      } else {
        setLastMsgs({});
      }
    } else {
      setLastMsgs({});
    }

    // 6) Sign private avatar URLs (band-avatars bucket)
    if (showAvatars) {
      const pairs = Array.from(
        new Map(
          sorted
            .filter((e) => e.bands?.id && e.bands?.avatar_url)
            .map((e) => [e.bands!.id, e.bands!.avatar_url as string])
        ).entries()
      );
      const next: Record<string, string> = {};
      for (const [bId, path] of pairs) {
        const { data, error } = await supabase.storage
          .from('band-avatars')
          .createSignedUrl(path, 60 * 60);
        if (!error && data?.signedUrl) next[bId] = data.signedUrl;
      }
      setAvatarMap(next);
    } else {
      setAvatarMap({});
    }

    setLoading(false);
  }, [bandId, onLoaded, showAvatars]);

  // Initial load
  useEffect(() => {
    void load();
  }, [load]);

  // Realtime: last message updates
  useEffect(() => {
    const ch = supabase
      .channel('dashboard:event-inbox')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_messages' },
        (payload) => {
          const msg = payload.new as LastMsg;
          if (!eventIdsRef.current.includes(msg.event_id)) return;
          setLastMsgs((prev) => {
            const current = prev[msg.event_id];
            if (
              !current ||
              new Date(msg.created_at) > new Date(current.created_at)
            ) {
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

  const openEvent = (bId: string, eventId: string) => {
    nav(`/bands/${bId}/events/${eventId}`);
  };

  // ----- Render -----
  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <IonSpinner name="dots" />
        <IonText color="medium">Loading…</IonText>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <IonText color="medium">
        No events yet. Join a band or create an event.
      </IonText>
    );
  }

  return (
    <IonList inset>
      {rows.map((e) => {
        const band = e.bands;
        const when = e.starts_at ? timeFmt.format(new Date(e.starts_at)) : '';
        const lm = lastMsgs[e.id];
        const preview =
          lm?.body ??
          (e.location ? `Location: ${e.location}` : `${e.type} scheduled`);
        const avatarSrc = (band?.id && avatarMap[band.id]) || undefined;

        return (
          <IonItem
            key={e.id}
            button
            detail={false}
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
            {/* Avatar */}
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
                    // eslint-disable-next-line @next/next/no-img-element
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

            {/* Content */}
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

              {/* Row 2: preview (left) — status chip (right) */}
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
  // Use a tiny custom badge to mimic your MUI Chip w/ icon
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
