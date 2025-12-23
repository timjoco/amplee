/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  EventRow,
  getCache,
  needsEventRefresh,
  setAvatarPath,
  setEvents,
  setLastMsgsBulk,
  upsertLastMsg,
} from '../../../../lib/cache/eventInboxCache';
import { supabase } from '../../../../lib/supabase';

export type InboxScope = 'home' | 'band';
export type LastMsg = { event_id: string; body: string; created_at: string };

type Params = {
  scope: InboxScope;
  bandId?: string;
  showArchived?: boolean;
  showDeclined?: boolean;
  showAvatars?: boolean;
  onLoaded?: (count: number) => void;
  clientFilterBandId?: string;
};

export function useEventInboxData({
  scope,
  bandId,
  showArchived = false,
  showDeclined = false,
  showAvatars = true,
  onLoaded,
  clientFilterBandId,
}: Params) {
  // Initial hydration: ONLY home uses cache for instant render
  const initial = useMemo(() => {
    if (scope === 'home') return getCache();
    return {
      events: [] as EventRow[],
      lastMsgs: {} as Record<string, LastMsg | undefined>,
    };
  }, [scope]);

  const [rows, setRows] = useState<EventRow[]>(initial.events);
  const [lastMsgs, setLastMsgs] = useState<Record<string, LastMsg | undefined>>(
    initial.lastMsgs as any
  );

  const [loading, setLoading] = useState<boolean>(() => {
    if (scope === 'band') return true;
    return needsEventRefresh();
  });

  const eventIdsRef = useRef<string[]>(initial.events.map((e) => e.id));
  const lastMsgsRef = useRef<Record<string, LastMsg | undefined>>(
    initial.lastMsgs as any
  );

  useEffect(() => {
    lastMsgsRef.current = lastMsgs;
  }, [lastMsgs]);

  const displayRows = useMemo(() => {
    if (!clientFilterBandId) return rows;
    return rows.filter((e) => e.band_id === clientFilterBandId);
  }, [rows, clientFilterBandId]);

  const removeLocal = useCallback(
    (eventId: string) => {
      setRows((prev) => prev.filter((r) => r.id !== eventId));
      setLastMsgs((prev) => {
        const next = { ...prev };
        delete next[eventId];
        return next;
      });

      if (scope === 'home') {
        const c = getCache();
        setEvents(c.events.filter((r) => r.id !== eventId));
        const lm = { ...(c.lastMsgs as any) };
        delete lm[eventId];
        setLastMsgsBulk(lm);
      }
    },
    [scope]
  );

  const recomputeLastMessage = useCallback(async (eventId: string) => {
    if (!eventIdsRef.current.includes(eventId)) return;

    const { data, error } = await supabase
      .from('event_last_messages')
      .select('event_id, body, created_at')
      .eq('event_id', eventId)
      .maybeSingle();

    if (error) return;

    const next = (data as LastMsg | null) ?? null;

    setLastMsgs((prev) => {
      const clone = { ...prev };
      if (next) clone[eventId] = next;
      else delete clone[eventId];
      return clone;
    });

    if (next) upsertLastMsg(next as any);
  }, []);

  const refresh = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const userId = auth?.user?.id ?? null;

    if (!userId) {
      setRows([]);
      setLastMsgs({});
      eventIdsRef.current = [];
      onLoaded?.(0);
      if (scope === 'home') {
        setEvents([]);
        setLastMsgsBulk({});
      }
      return;
    }

    // Determine bandIds
    let bandIds: string[] = [];

    if (scope === 'band') {
      if (!bandId) {
        setRows([]);
        setLastMsgs({});
        eventIdsRef.current = [];
        onLoaded?.(0);
        return;
      }
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
      eventIdsRef.current = [];
      onLoaded?.(0);
      if (scope === 'home') {
        setEvents([]);
        setLastMsgsBulk({});
      }
      return;
    }

    // 1) Pull events (include archived_at so we DON'T query events twice)
    const { data: events, error: eventsErr } = await supabase
      .from('events')
      .select(
        'id, band_id, title, type, starts_at, ends_at, location, notes, is_booked, is_cancelled, archived_at, bands(id, name, avatar_url)'
      )
      .in('band_id', bandIds)
      .order('starts_at', { ascending: true })
      .limit(200);

    if (eventsErr) {
      console.warn('[inbox] events query error', eventsErr);
      setRows([]);
      setLastMsgs({});
      eventIdsRef.current = [];
      onLoaded?.(0);
      return;
    }

    const eventIds = (events ?? []).map((e: any) => String(e.id));
    const now = Date.now();

    // 2) Pull event_members ONCE for these eventIds (derive my status + counts)
    let myStatusMap: Record<string, 'accepted' | 'declined' | 'pending'> = {};
    let myNeedsSubMap: Record<string, boolean> = {};
    let attendanceCounts: Record<string, { total: number; accepted: number }> =
      {};
    let userEventIds: Set<string> = new Set();

    if (eventIds.length > 0) {
      const { data: members, error: memErr } = await supabase
        .from('event_members')
        .select('event_id, user_id, status, needs_sub')
        .in('event_id', eventIds);

      if (memErr) {
        console.warn('[inbox] event_members query error', memErr);
      } else if (members) {
        const YES_STATUSES = new Set(['accepted', 'going']);

        for (const row of members as any[]) {
          const eId = String(row.event_id);
          const status = String(row.status ?? '');
          const needsSub = Boolean(row.needs_sub);

          // Initialize counts
          if (!attendanceCounts[eId])
            attendanceCounts[eId] = { total: 0, accepted: 0 };

          attendanceCounts[eId].total += 1;

          if (YES_STATUSES.has(status)) {
            attendanceCounts[eId].accepted += 1;
          }

          // my status
          if (String(row.user_id) === userId) {
            myStatusMap[eId] = status as any;
            myNeedsSubMap[eId] = needsSub;
            userEventIds.add(eId);
          }
        }
      }
    }

    const toTs = (s?: string | null) =>
      s ? new Date(s).getTime() : Number.POSITIVE_INFINITY;

    const normalized: EventRow[] = (events ?? [])
      .filter((e: any) => userEventIds.has(String(e.id)))
      .map((e: any) => {
        const eventId = String(e.id);
        const counts = attendanceCounts[eventId] || {
          total: 0,
          accepted: 0,
        };

        const myStatus = myStatusMap[eventId] || 'pending';
        const myNeedsSub = myNeedsSubMap[eventId] || false;

        const myEventStatus: EventRow['my_event_status'] =
          myStatus === 'accepted'
            ? 'confirmed'
            : myStatus === 'declined'
            ? 'cancelled'
            : 'pending';

        const band = Array.isArray(e.bands)
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
          : null;

        return {
          id: eventId,
          band_id: String(e.band_id),
          title: String(e.title ?? ''),
          type: e.type === 'practice' ? 'practice' : 'show',
          starts_at: e.starts_at ?? null,
          ends_at: e.ends_at ?? null,
          location: e.location ?? null,
          notes: e.notes ?? null,
          is_booked: Boolean(e.is_booked),
          is_cancelled: Boolean(e.is_cancelled),
          archived_at: e.archived_at ?? null,
          my_event_status: myEventStatus,
          my_needs_sub: myNeedsSub,
          bands: band,
        };
      });

    // Filter archived vs active
    const filtered = normalized.filter((ev) => {
      // Archived tab: only archived events
      if (showArchived) return Boolean(ev.archived_at);

      // Declined tab: only declined events (not archived)
      if (showDeclined) {
        return !ev.archived_at && ev.my_event_status === 'cancelled';
      }

      // Active tab: not archived AND not declined
      return !ev.archived_at && ev.my_event_status !== 'cancelled';
    });

    // Sort upcoming first; past descending unless archived tab (archived sorted ascending)
    const upcoming = filtered
      .filter((ev) => ev.starts_at && toTs(ev.starts_at) >= now)
      .sort((a, b) => toTs(a.starts_at) - toTs(b.starts_at));

    const past = filtered
      .filter((ev) => !ev.starts_at || toTs(ev.starts_at) < now)
      .sort((a, b) =>
        showArchived
          ? toTs(a.starts_at) - toTs(b.starts_at)
          : toTs(b.starts_at) - toTs(a.starts_at)
      );

    const sorted = [...upcoming, ...past];

    setRows(sorted);
    eventIdsRef.current = sorted.map((ev) => ev.id);
    onLoaded?.(sorted.length);

    // Home cache update
    if (scope === 'home') setEvents(sorted);

    // Avatar path hydration (cache only; signing is handled in UI layer for now)
    if (showAvatars) {
      for (const ev of sorted) {
        if (ev.bands?.id) {
          setAvatarPath(ev.bands.id, ev.bands.avatar_url ?? null);
        }
      }
    }

    // 3) Load last messages for these events
    const targetIds = sorted.map((ev) => ev.id);

    if (targetIds.length) {
      const { data: msgs, error: msgErr } = await supabase
        .from('event_last_messages')
        .select('event_id, body, created_at')
        .in('event_id', targetIds);

      if (msgErr) {
        console.warn('[inbox] last message query error', msgErr);
      } else {
        const map: Record<string, LastMsg> = {};
        for (const m of msgs ?? []) {
          const id = String((m as any).event_id);
          map[id] = {
            event_id: id,
            body: String((m as any).body ?? ''),
            created_at: String((m as any).created_at),
          };
        }

        setLastMsgs((prev) => {
          const next = { ...prev };
          for (const id of targetIds) {
            if (map[id]) next[id] = map[id];
            else delete next[id];
          }
          return next;
        });

        if (scope === 'home') setLastMsgsBulk(map);
      }
    } else {
      setLastMsgs({});
      if (scope === 'home') setLastMsgsBulk({});
    }
  }, [scope, bandId, showArchived, showAvatars, onLoaded, showDeclined]);

  // initial load / reload
  useEffect(() => {
    setLoading(true);
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  // realtime (messages → update preview)
  useEffect(() => {
    if (eventIdsRef.current.length === 0) return;

    const ch = supabase
      .channel(`event-inbox:${scope}:${bandId ?? 'all'}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'event_messages' },
        (payload: any) => {
          const msg = payload.new as LastMsg;
          if (!eventIdsRef.current.includes(msg.event_id)) return;

          setLastMsgs((prev) => {
            const cur = prev[msg.event_id];
            if (
              !cur ||
              new Date(msg.created_at).getTime() >
                new Date(cur.created_at).getTime()
            ) {
              const next = { ...prev, [msg.event_id]: msg };
              upsertLastMsg(msg as any);
              return next;
            }
            return prev;
          });
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'event_messages' },
        (payload: any) => {
          const eventId = payload?.new?.event_id as string | undefined;
          if (!eventId) return;
          void recomputeLastMessage(eventId);
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'event_messages' },
        (payload: any) => {
          const eventId = payload?.old?.event_id as string | undefined;
          if (!eventId) return;
          void recomputeLastMessage(eventId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [scope, bandId, recomputeLastMessage]);

  return {
    rows,
    displayRows,
    lastMsgs,
    loading,
    refresh,
    eventIdsRef,
    removeLocal,
  };
}
