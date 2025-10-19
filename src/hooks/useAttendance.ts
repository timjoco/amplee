'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type AttStatus = 'accepted' | 'tentative' | 'declined' | 'pending';

export function useAttendance(eventId: string) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [mine, setMine] = useState<AttStatus>('pending');
  const [counts, setCounts] = useState<{ accepted: number; total: number }>({
    accepted: 0,
    total: 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);

    // my status
    const { data: me, error: meErr } = await sb
      .from('event_attendance')
      .select('status')
      .eq('event_id', eventId)
      .limit(1);
    if (!meErr && me?.[0]?.status) setMine(me[0].status as AttStatus);
    if (meErr) setError(meErr.message);

    // counts
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
    async (next: AttStatus) => {
      if (next === 'pending' || next === mine) return;
      setSaving(true);
      setError(null);

      const prevMine = mine;
      const prevCounts = counts;

      const applyCounts = (from: AttStatus, to: AttStatus) => {
        let accepted = counts.accepted;
        if (from === 'accepted') accepted -= 1;
        if (to === 'accepted') accepted += 1;
        setCounts({ accepted, total: counts.total });
      };

      // optimistic UI
      setMine(next);
      applyCounts(prevMine, next);

      try {
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!user) throw new Error('Sign in to respond');

        const { error: upErr } = await sb.from('event_attendance').upsert(
          {
            event_id: eventId,
            status: next,
            responded_at: new Date().toISOString(),
          },
          { onConflict: 'event_id,user_id' }
        );

        if (upErr) throw upErr;
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
