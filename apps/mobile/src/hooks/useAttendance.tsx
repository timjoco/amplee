/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';
import {
  getAttendanceCache,
  setAttendanceCache,
} from '../lib/cache/eventAttendanceCache';
import { supabase } from '../lib/supabase';

export type RawAtt = 'accepted' | 'pending';
export type AttStatus = RawAtt | 'declined' | 'tentative';

export function useAttendance(eventId: string) {
  const [mine, setMine] = useState<RawAtt>('pending');
  const [counts, setCounts] = useState<{ accepted: number; total: number }>({
    accepted: 0,
    total: 0,
  });

  const [needsSub, setNeedsSub] = useState(false);
  const [subReason, setSubReason] = useState('');

  const [saving, setSaving] = useState(false);
  const [savingSub, setSavingSub] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hydrated, setHydrated] = useState(false);

  const normalize = (s: AttStatus | null | undefined): RawAtt =>
    s === 'accepted' ? 'accepted' : 'pending';

  // IMPORTANT: bump cache key so old event_attendance cache never gets reused
  const cacheEventKey = `v2:${eventId}`;

  const load = useCallback(async () => {
    setError(null);

    const {
      data: { user },
      error: autErr,
    } = await supabase.auth.getUser();

    if (autErr) setError(autErr.message);

    if (!user) {
      setMine('pending');
      setCounts({ accepted: 0, total: 0 });
      setNeedsSub(false);
      setSubReason('');
      setHydrated(true);
      return;
    }

    // 1) Cache first
    const cached = getAttendanceCache(cacheEventKey, user.id);
    if (cached) {
      setMine(cached.mine);
      setCounts(cached.counts);
      setNeedsSub(cached.needsSub);
      setSubReason(cached.subReason);
      setHydrated(true);
      return;
    }

    // 2) DB: read event roster from event_members (source of truth)
    // Assumes event_members has:
    // - event_id (uuid)
    // - user_id (uuid)
    // - status (text/enum) default 'pending'
    // - needs_sub (boolean) default false  (optional but recommended)
    // - sub_reason (text) default ''       (optional but recommended)
    const { data: all, error: allErr } = await supabase
      .from('event_members')
      .select('user_id,status,needs_sub,sub_reason')
      .eq('event_id', eventId);

    if (allErr) {
      setError(allErr.message);
      setMine('pending');
      setCounts({ accepted: 0, total: 0 });
      setNeedsSub(false);
      setSubReason('');
      setHydrated(true);
      return;
    }

    const list = (all ?? []) as any[];

    const myRow = list.find((r) => r.user_id === user.id);

    const nextMine: RawAtt = normalize(myRow?.status as AttStatus);
    const nextNeedsSub = !!myRow?.needs_sub;
    const nextSubReason = myRow?.sub_reason ?? '';

    // Count accepted as those accepted AND not requesting sub
    const total = list.length;
    const accepted = list.filter(
      (r) => r.status === 'accepted' && !r.needs_sub
    ).length;

    const nextCounts = { accepted, total };

    setMine(nextMine);
    setNeedsSub(nextNeedsSub);
    setSubReason(nextSubReason);
    setCounts(nextCounts);

    // 3) Cache fresh values
    setAttendanceCache(cacheEventKey, user.id, {
      mine: nextMine,
      counts: nextCounts,
      needsSub: nextNeedsSub,
      subReason: nextSubReason,
    });

    setHydrated(true);
  }, [eventId, cacheEventKey]);

  useEffect(() => {
    let active = true;

    if (active) void load();

    // Realtime: listen to event_members now (not event_attendance)
    const ch = supabase
      .channel(`event:${eventId}:attendance:v2`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_members',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          void load();
        }
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [eventId, load]);

  const update = useCallback(
    async (nextInput: AttStatus) => {
      const next = normalize(nextInput);

      const resetSub = next === 'accepted';
      if (next === mine && !resetSub) return;

      setSaving(true);
      setError(null);

      const prevMine = mine;
      const prevCounts = counts;
      const prevNeedsSub = needsSub;
      const prevSubReason = subReason;

      const acceptedDelta =
        (prevMine === 'accepted' ? -1 : 0) + (next === 'accepted' ? 1 : 0);

      const optimisticMine = next;
      const optimisticCounts = {
        accepted: counts.accepted + acceptedDelta,
        total: counts.total,
      };
      const optimisticNeedsSub = resetSub ? false : prevNeedsSub;
      const optimisticSubReason = resetSub ? '' : prevSubReason;

      setMine(optimisticMine);
      setCounts(optimisticCounts);

      if (resetSub) {
        setNeedsSub(false);
        setSubReason('');
      }

      try {
        const { data, error: authErr } = await supabase.auth.getUser();
        const user = data.user;
        if (authErr) throw authErr;
        if (!user) throw new Error('Not authenticated.');

        // Upsert into event_members (new source of truth)
        const { error: upErr } = await supabase.from('event_members').upsert(
          {
            event_id: eventId,
            user_id: user.id,
            status: next,
            needs_sub: resetSub ? false : prevNeedsSub,
            sub_reason: resetSub ? '' : prevSubReason,
          },
          { onConflict: 'event_id,user_id' }
        );

        if (upErr) throw upErr;

        // Sync cache with optimistic state
        setAttendanceCache(cacheEventKey, user.id, {
          mine: optimisticMine,
          counts: optimisticCounts,
          needsSub: optimisticNeedsSub,
          subReason: optimisticSubReason,
        });
      } catch (e: any) {
        setMine(prevMine);
        setCounts(prevCounts);
        setNeedsSub(prevNeedsSub);
        setSubReason(prevSubReason);

        const msg = /RLS|row-level|42501/i.test(e?.message)
          ? "You don't have permission to update your RSVP."
          : e?.message ?? 'Failed to update RSVP.';
        setError(msg);
      } finally {
        setSaving(false);
      }
    },
    [eventId, mine, needsSub, subReason, counts, cacheEventKey]
  );

  const updateSubRequest = useCallback(
    async (nextNeedsSub: boolean, reason: string) => {
      setSavingSub(true);
      setError(null);

      const prevNeeds = needsSub;
      const prevReason = subReason;
      const prevMine = mine;
      const prevCounts = counts;

      let nextMine = mine;
      let nextCounts = counts;

      // If requesting a sub while accepted -> treat as not fully confirmed
      if (nextNeedsSub && mine === 'accepted') {
        nextMine = 'pending';
        nextCounts = {
          accepted: Math.max(0, counts.accepted - 1),
          total: counts.total,
        };
      }

      setNeedsSub(nextNeedsSub);
      setSubReason(reason);
      setMine(nextMine);
      setCounts(nextCounts);

      try {
        const { data, error: authErr } = await supabase.auth.getUser();
        const user = data.user;
        if (authErr) throw authErr;
        if (!user) throw new Error('Not authenticated.');

        const { error: upsertErr } = await supabase
          .from('event_members')
          .upsert(
            {
              event_id: eventId,
              user_id: user.id,
              status: nextMine,
              needs_sub: nextNeedsSub,
              sub_reason: nextNeedsSub ? reason || '' : '',
            },
            { onConflict: 'event_id,user_id' }
          );

        if (upsertErr) throw upsertErr;

        // Sync cache with optimistic sub state
        setAttendanceCache(cacheEventKey, user.id, {
          mine: nextMine,
          counts: nextCounts,
          needsSub: nextNeedsSub,
          subReason: nextNeedsSub ? reason || '' : '',
        });
      } catch (e: any) {
        setNeedsSub(prevNeeds);
        setSubReason(prevReason);
        setMine(prevMine);
        setCounts(prevCounts);

        const msg = /RLS|row-level|42501/i.test(e?.message)
          ? "You don't have permission to request a sub."
          : e?.message ?? 'Failed to update sub request.';
        setError(msg);
      } finally {
        setSavingSub(false);
      }
    },
    [eventId, mine, needsSub, subReason, counts, cacheEventKey]
  );

  return {
    mine,
    counts,
    needsSub,
    subReason,
    saving,
    savingSub,
    error,
    update,
    updateSubRequest,
    hydrated,
  };
}
