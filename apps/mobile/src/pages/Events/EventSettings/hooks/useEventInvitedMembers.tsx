/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { InvitedMemberRow, InviteStatus } from '../types';

export function useEventInvitedMembers(eventId?: string) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<InvitedMemberRow[]>([]);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const sortRows = useCallback((list: InvitedMemberRow[]) => {
    const rank = (s: InviteStatus) =>
      s === 'accepted' ? 0 : s === 'pending' ? 1 : 2;

    const next = [...list];
    next.sort((a, b) => {
      const d = rank(a.status) - rank(b.status);
      if (d !== 0) return d;

      const an =
        `${a.first_name ?? ''} ${a.last_name ?? ''}`.trim() ||
        (a.display_name ?? '');
      const bn =
        `${b.first_name ?? ''} ${b.last_name ?? ''}`.trim() ||
        (b.display_name ?? '');

      return an.localeCompare(bn);
    });
    return next;
  }, []);

  const fetchRows = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (!eventId) {
        if (!mountedRef.current) return;
        setRows([]);
        setLoading(false);
        setRefreshing(false);
        setError(null);
        return;
      }

      const silent = !!opts?.silent;

      if (!mountedRef.current) return;
      if (silent) setRefreshing(true);
      else setLoading(true);
      setError(null);

      try {
        const { data: members, error: err } = await supabase
          .from('event_members')
          .select('user_id, status, needs_sub, updated_at, created_at')
          .eq('event_id', eventId);

        if (err) throw err;
        if (!mountedRef.current) return;

        const ids = (members ?? []).map((r: any) => r.user_id).filter(Boolean);

        let byId = new Map<string, any>();
        if (ids.length > 0) {
          const { data: profs, error: profErr } = await supabase
            .from('profiles')
            .select(
              'id, first_name, last_name, display_name, avatar_url, updated_at'
            )
            .in('id', ids);

          if (profErr)
            console.warn('[useEventInvitedMembers] profiles error', profErr);

          byId = new Map((profs ?? []).map((p: any) => [p.id, p]));
        }

        const mapped: InvitedMemberRow[] = (members ?? []).map((r: any) => {
          const p = byId.get(r.user_id);
          return {
            user_id: r.user_id,
            status: (r.status ?? 'pending') as InviteStatus,
            needs_sub: !!r.needs_sub,
            updated_at: p?.updated_at ?? null,
            invited_at: r.created_at ?? null,
            first_name: p?.first_name ?? null,
            last_name: p?.last_name ?? null,
            display_name: p?.display_name ?? null,
            avatar_url: p?.avatar_url ?? null,
          };
        });

        console.log('[invitedMembers] sample', mapped[0]);

        setRows(sortRows(mapped));

        setRows(sortRows(mapped));
      } catch (e: any) {
        console.error('[useEventInvitedMembers]', e);
        if (!mountedRef.current) return;
        setError(String(e?.message ?? 'Failed to load invited members'));
      } finally {
        if (!mountedRef.current) return;
        setLoading(false);
        setRefreshing(false);
      }
    },
    [eventId, sortRows]
  );

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const refetch = useCallback(
    async (opts?: { silent?: boolean }) => {
      await fetchRows(opts);
    },
    [fetchRows]
  );

  const grouped = useMemo(() => {
    const accepted = rows.filter((r) => r.status === 'accepted');
    const pending = rows.filter((r) => r.status === 'pending');
    const declined = rows.filter((r) => r.status === 'declined');
    return { accepted, pending, declined };
  }, [rows]);

  return { loading, refreshing, error, rows, grouped, refetch, setRows };
}
