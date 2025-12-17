/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';
import {
  getAttendanceCache,
  setAttendanceCache,
} from '../lib/cache/eventAttendanceCache';
import { supabase } from '../lib/supabase';

export type AttStatus = 'accepted' | 'pending' | 'declined' | 'tentative';

const coerceStatus = (s: any): AttStatus =>
  s === 'accepted' || s === 'pending' || s === 'declined' || s === 'tentative'
    ? s
    : 'pending';

export function useAttendance(eventId: string) {
  const [mine, setMine] = useState<AttStatus>('pending');
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
      setMine(coerceStatus((cached as any).mine));
      setCounts(cached.counts);
      setNeedsSub(!!cached.needsSub);
      setSubReason(cached.subReason ?? '');
      setHydrated(true);
      return;
    }

    // 2) DB: read event roster from event_members (source of truth)
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

    const nextMine: AttStatus = coerceStatus(myRow?.status);
    const nextNeedsSub = !!myRow?.needs_sub;
    const nextSubReason = myRow?.sub_reason ?? '';

    // Confirmed = accepted AND not requesting a sub
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
      mine: nextMine as any,
      counts: nextCounts,
      needsSub: nextNeedsSub,
      subReason: nextSubReason,
    });

    setHydrated(true);
  }, [eventId, cacheEventKey]);

  useEffect(() => {
    let active = true;

    if (active) void load();

    // Realtime: listen to event_members
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
      const next: AttStatus = coerceStatus(nextInput);

      // Any explicit RSVP change clears sub request (keeps UX simple)
      const resetSub = next === 'accepted' || next === 'pending';

      // If no-op
      if (next === mine && (!resetSub || !needsSub)) return;

      setSaving(true);
      setError(null);

      const prevMine = mine;
      const prevCounts = counts;
      const prevNeedsSub = needsSub;
      const prevSubReason = subReason;

      const wasConfirmed = prevMine === 'accepted' && !prevNeedsSub;
      const willBeConfirmed = next === 'accepted'; // because we clear sub below

      const acceptedDelta = (wasConfirmed ? -1 : 0) + (willBeConfirmed ? 1 : 0);

      const optimisticMine: AttStatus = next;
      const optimisticCounts = {
        accepted: Math.max(0, prevCounts.accepted + acceptedDelta),
        total: prevCounts.total,
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

        const { error: upErr } = await supabase.from('event_members').upsert(
          {
            event_id: eventId,
            user_id: user.id,
            status: optimisticMine,
            needs_sub: optimisticNeedsSub,
            sub_reason: optimisticSubReason,
          },
          { onConflict: 'event_id,user_id' }
        );

        if (upErr) throw upErr;

        setAttendanceCache(cacheEventKey, user.id, {
          mine: optimisticMine as any,
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

      // If requesting a sub => declined + needs_sub=true
      // If clearing => pending + needs_sub=false (they must re-accept explicitly)
      const nextMine: AttStatus = nextNeedsSub ? 'declined' : 'pending';

      const wasConfirmed = prevMine === 'accepted' && !prevNeeds;

      const nextCounts = {
        accepted:
          nextNeedsSub && wasConfirmed
            ? Math.max(0, prevCounts.accepted - 1)
            : prevCounts.accepted,
        total: prevCounts.total,
      };

      setNeedsSub(nextNeedsSub);
      setSubReason(nextNeedsSub ? reason || '' : '');
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

        setAttendanceCache(cacheEventKey, user.id, {
          mine: nextMine as any,
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
