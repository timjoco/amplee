/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';
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

  const [saving, setSaving] = useState(false); // RSVP saving
  const [savingSub, setSavingSub] = useState(false); // sub request saving
  const [error, setError] = useState<string | null>(null);

  const normalize = (s: AttStatus | null | undefined): RawAtt =>
    s === 'accepted' ? 'accepted' : 'pending';

  /* ---------------- LOAD ---------------- */
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
      return;
    }

    // my record
    const { data: me, error: meErr } = await supabase
      .from('event_attendance')
      .select('status, needs_sub, sub_reason')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (!meErr) {
      setMine(normalize(me?.status as AttStatus));
      setNeedsSub(!!me?.needs_sub);
      setSubReason(me?.sub_reason ?? '');
    } else {
      setError(meErr.message);
    }

    // counts
    const { data: all, error: cErr } = await supabase
      .from('event_attendance')
      .select('status')
      .eq('event_id', eventId);

    if (!cErr) {
      const total = all?.length ?? 0;
      const accepted = (all || []).filter(
        (r) => r.status === 'accepted'
      ).length;

      setCounts({ accepted, total });
    } else {
      setError(cErr.message);
    }
  }, [eventId]);

  /* ---------------- REALTIME ---------------- */
  useEffect(() => {
    let active = true;

    if (active) load();

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
        () => load()
      )
      .subscribe();

    return () => {
      active = false;
      supabase.removeChannel(ch);
    };
  }, [eventId, load]);

  /* ---------------- UPDATE RSVP ---------------- */
  const update = useCallback(
    async (nextInput: AttStatus) => {
      const next = normalize(nextInput);

      // if user selects "Yes I'm in", ALWAYS reset sub-request
      const resetSub = next === 'accepted';

      if (next === mine && !resetSub) return;

      setSaving(true);
      setError(null);

      const prevMine = mine;
      const prevCounts = counts;
      const prevNeedsSub = needsSub;
      const prevSubReason = subReason;

      // optimistic UI
      const acceptedDelta =
        (prevMine === 'accepted' ? -1 : 0) + (next === 'accepted' ? 1 : 0);

      setMine(next);
      setCounts({
        accepted: counts.accepted + acceptedDelta,
        total: counts.total,
      });

      if (resetSub) {
        setNeedsSub(false);
        setSubReason('');
      }

      try {
        const user = (await supabase.auth.getUser()).data.user;
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
      } catch (e: any) {
        // rollback
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

  /* ---------------- UPDATE SUB REQUEST ---------------- */
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

      // If user requests a sub while accepted → they become pending
      if (nextNeedsSub && mine === 'accepted') {
        nextMine = 'pending';
        nextCounts = {
          accepted: Math.max(0, counts.accepted - 1),
          total: counts.total,
        };
      }

      // If user cancels sub request, nothing changes unless logic changes later

      // optimistic
      setNeedsSub(nextNeedsSub);
      setSubReason(reason);
      setMine(nextMine);
      setCounts(nextCounts);

      try {
        const user = (await supabase.auth.getUser()).data.user;
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
      } catch (e: any) {
        // rollback
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
  };
}
