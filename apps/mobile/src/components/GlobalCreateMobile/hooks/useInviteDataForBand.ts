/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { MemberLite, RosterLite } from '../types';

export function useInviteDataForBand(params: {
  open: boolean;
  enabled: boolean;
  bandId: string | null | undefined;
  onError?: (msg: string) => void;
}) {
  const { open, enabled, bandId, onError } = params;

  const [availableRosters, setAvailableRosters] = useState<RosterLite[]>([]);
  const [bandMembersForInvite, setBandMembersForInvite] = useState<
    MemberLite[]
  >([]);
  const [loadingInviteData, setLoadingInviteData] = useState(false);
  const [inviteErr, setInviteErr] = useState<string | null>(null);

  // “should we be fetching right now?”
  const canFetch = useMemo(
    () => open && enabled && !!bandId,
    [open, enabled, bandId]
  );

  useEffect(() => {
    let alive = true;

    // If modal closed / step not active / no bandId: clear loading (and optionally clear data)
    if (!canFetch) {
      setLoadingInviteData(false);
      return () => {
        alive = false;
      };
    }

    // Band changed while still open: clear old data immediately so UI doesn’t show stale rosters
    setAvailableRosters([]);
    setBandMembersForInvite([]);
    setInviteErr(null);

    (async () => {
      setLoadingInviteData(true);

      try {
        const [rostersRes, membersRes] = await Promise.all([
          supabase
            .from('band_rosters')
            .select('id, name')
            .eq('band_id', bandId as string)
            .order('created_at', { ascending: false }),

          supabase
            .from('band_members')
            .select(
              `
              user_id,
              role,
              profiles(
                first_name,
                last_name,
                display_name
              )
            `
            )
            .eq('band_id', bandId as string)
            .order('created_at', { ascending: true }),
        ]);

        if (!alive) return;

        if (rostersRes.error) throw rostersRes.error;
        if (membersRes.error) throw membersRes.error;

        setAvailableRosters((rostersRes.data ?? []) as RosterLite[]);

        const formatted: MemberLite[] =
          (membersRes.data ?? []).map((m: any) => {
            const p = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;

            const first = (p?.first_name ?? '').trim();
            const last = (p?.last_name ?? '').trim();

            const display = (p?.display_name ?? '').trim();
            const fullName = [first, last].filter(Boolean).join(' ');

            return {
              user_id: m.user_id,
              role: m.role,
              name: fullName || display || 'Unknown',
            };
          }) ?? [];

        setBandMembersForInvite(formatted);
      } catch (e: any) {
        const msg = e?.message ?? 'Failed to load invite data';
        console.error('[useInviteDataForBand]', e);
        if (!alive) return;
        setInviteErr(msg);
        onError?.(msg);
      } finally {
        if (alive) setLoadingInviteData(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [canFetch, bandId, onError]);

  const clearInviteData = () => {
    setAvailableRosters([]);
    setBandMembersForInvite([]);
    setInviteErr(null);
    setLoadingInviteData(false);
  };

  return {
    availableRosters,
    bandMembersForInvite,
    loadingInviteData,
    inviteErr,
    clearInviteData,
  };
}
