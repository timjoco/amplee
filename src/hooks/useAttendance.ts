'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type RawAtt = 'accepted' | 'pending';
export type AttStatus = RawAtt | 'declined' | 'tentative';

export function useAttendance(eventId: string) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [mine, setMine] = useState<RawAtt>('pending');
  const [counts, setCounts] = useState<{ accepted: number; total: number }>({
    accepted: 0,
    total: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalize = (s: AttStatus | null | undefined): RawAtt =>
    s === 'accepted' ? 'accepted' : 'pending';

  const load = useCallback(async () => {
    setError(null);

    // who am I?
    const {
      data: { user },
      error: autErr,
    } = await sb.auth.getUser();
    if (autErr) setError(autErr.message);
    if (!user) {
      setMine('pending');
      setCounts({ accepted: 0, total: 0 });
      return;
    }

    // my status (filter by user_id = auth.uid())
    const { data: me, error: meErr } = await sb
      .from('event_attendance')
      .select('status')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle();

    if (!meErr) setMine(normalize(me?.status as AttStatus));
    else setError(meErr.message);

    const { data: all, error: cErr } = await sb
      .from('event_attendance')
      .select('status')
      .eq('event_id', eventId);

    if (!cErr) {
      const total = all?.length ?? 0;
      const accepted = (all ?? []).filter(
        (r) => r.status === 'accepted'
      ).length;
      setCounts({ accepted, total });
    } else {
      setError(cErr.message);
    }
  }, [sb, eventId]);

  useEffect(() => {
    load();

    const ch = sb
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
      sb.removeChannel(ch);
    };
  }, [sb, eventId, load]);

  const update = useCallback(
    async (nextInput: AttStatus) => {
      const next: RawAtt = normalize(nextInput);
      if (next === mine) return;

      setSaving(true);
      setError(null);

      const prevMine = mine;
      const prevCounts = counts;

      // optimistic UI
      const newAccepted =
        counts.accepted +
        (prevMine === 'accepted' ? -1 : 0) +
        (next === 'accepted' ? 1 : 0);
      setMine(next);
      setCounts({ accepted: newAccepted, total: counts.total });

      try {
        const { error: rpcErr } = await sb.rpc('upsert_my_event_attendance', {
          p_event_id: eventId,
          p_status: next,
        });
        if (rpcErr) throw rpcErr;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        setMine(prevMine);
        setCounts(prevCounts);

        const msg = /row[- ]level security|RLS|42501/i.test(e?.message)
          ? "You don't have permission to respond for this event."
          : e?.message ?? 'Failed to update attendance.';
        setError(msg);
      } finally {
        setSaving(false);
      }
    },
    [sb, eventId, mine, counts]
  );

  return { mine, counts, saving, error, update };
}
