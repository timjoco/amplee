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

  const [hydrated, setHydrated] = useState(false); // 👈 NEW

  const normalize = (s: AttStatus | null | undefined): RawAtt =>
    s === 'accepted' ? 'accepted' : 'pending';

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
      setHydrated(true); // 👈 even "no user" is now a known state
      return;
    }

    // 1) Try cache first
    const cached = getAttendanceCache(eventId, user.id);
    if (cached) {
      setMine(cached.mine);
      setCounts(cached.counts);
      setNeedsSub(cached.needsSub);
      setSubReason(cached.subReason);
      setHydrated(true); // 👈 avoid flash, we have a real value
      return;
    }

    // 2) Fallback to DB if no valid cache
    const { data: me, error: meErr } = await supabase
      .from('event_attendance')
      .select('status, needs_sub, sub_reason')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    let nextMine: RawAtt = 'pending';
    let nextNeedsSub = false;
    let nextSubReason = '';

    if (!meErr) {
      nextMine = normalize(me?.status as AttStatus);
      nextNeedsSub = !!me?.needs_sub;
      nextSubReason = me?.sub_reason ?? '';
      setMine(nextMine);
      setNeedsSub(nextNeedsSub);
      setSubReason(nextSubReason);
    } else {
      setError(meErr.message);
    }

    const { data: all, error: cErr } = await supabase
      .from('event_attendance')
      .select('status')
      .eq('event_id', eventId);

    let nextCounts = { accepted: 0, total: 0 };

    if (!cErr) {
      const total = all?.length ?? 0;
      const accepted = (all || []).filter(
        (r) => r.status === 'accepted'
      ).length;

      nextCounts = { accepted, total };
      setCounts(nextCounts);
    } else {
      setError(cErr.message);
    }

    // 3) Write fresh values to cache
    setAttendanceCache(eventId, user.id, {
      mine: nextMine,
      counts: nextCounts,
      needsSub: nextNeedsSub,
      subReason: nextSubReason,
    });

    setHydrated(true); // 👈 done with first load
  }, [eventId]);

  useEffect(() => {
    let active = true;

    if (active) void load();

    const ch = supabase
      .channel(`event:${eventId}:attendance`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_attendance',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          // DB changed → re-pull & refresh cache
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

        const { error: upErr } = await supabase.from('event_attendance').upsert(
          {
            event_id: eventId,
            user_id: user.id,
            status: next,
            needs_sub: resetSub ? false : prevNeedsSub,
            sub_reason: resetSub ? null : prevSubReason,
            responded_at: new Date().toISOString(),
          },
          { onConflict: 'event_id,user_id' }
        );

        if (upErr) throw upErr;

        // Sync cache with optimistic state
        setAttendanceCache(eventId, user.id, {
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
    [eventId, mine, needsSub, subReason, counts]
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
          .from('event_attendance')
          .upsert(
            {
              event_id: eventId,
              user_id: user.id,
              status: nextMine,
              needs_sub: nextNeedsSub,
              sub_reason: reason || null,
              responded_at: new Date().toISOString(),
            },
            { onConflict: 'event_id,user_id' }
          );

        if (upsertErr) throw upsertErr;

        // Sync cache with optimistic sub state
        setAttendanceCache(eventId, user.id, {
          mine: nextMine,
          counts: nextCounts,
          needsSub: nextNeedsSub,
          subReason: reason || '',
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
    [eventId, mine, needsSub, subReason, counts]
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
