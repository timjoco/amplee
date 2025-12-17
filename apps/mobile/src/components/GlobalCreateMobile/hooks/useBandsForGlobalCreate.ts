/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { BandLite } from '../types';

const mapBands = (rows: any[] | null | undefined): BandLite[] => {
  const map = new Map<string, BandLite>();

  for (const r of rows ?? []) {
    const b = r?.bands;
    if (!b?.id) continue;

    const id = String(b.id);
    const name = String(b.name ?? '');
    const avatar_url = b.avatar_url ?? null;

    // last write wins (fine for optimistic merges)
    map.set(id, { id, name, avatar_url });
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
};

export function useBandsForGlobalCreate(open: boolean) {
  const [bands, setBands] = useState<BandLite[]>([]);
  const [loadingBands, setLoadingBands] = useState(false);
  const [bandsLoadedOnce, setBandsLoadedOnce] = useState(false);

  const inflight = useRef(false);
  const aliveRef = useRef(true);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const ensureBandsLoaded = useCallback(async () => {
    if (inflight.current) return;
    inflight.current = true;

    if (aliveRef.current) setLoadingBands(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!aliveRef.current) return;
        setBands([]);
        setBandsLoadedOnce(true);
        return;
      }

      const { data, error } = await supabase
        .from('band_members')
        .select('role, bands(id, name, avatar_url)')
        .eq('user_id', user.id);

      if (error) throw error;

      if (!aliveRef.current) return;
      setBands(mapBands(data));
      setBandsLoadedOnce(true);
    } catch (e: any) {
      console.warn(
        '[useBandsForGlobalCreate.ensureBandsLoaded]',
        e?.message ?? e
      );
      if (!aliveRef.current) return;
      setBandsLoadedOnce(true);
    } finally {
      if (aliveRef.current) setLoadingBands(false);
      inflight.current = false;
    }
  }, []);

  // load on open (only if not loaded yet)
  useEffect(() => {
    if (!open) return;
    if (!bandsLoadedOnce) void ensureBandsLoaded();
  }, [open, bandsLoadedOnce, ensureBandsLoaded]);

  const invalidateBands = useCallback(
    (opts?: { refetchIfOpen?: boolean }) => {
      setBands([]);
      setBandsLoadedOnce(false);
      if (opts?.refetchIfOpen && open) {
        void ensureBandsLoaded();
      }
    },
    [open, ensureBandsLoaded]
  );

  // listens for changes anywhere in the app
  useEffect(() => {
    const onBandsChanged = () => invalidateBands({ refetchIfOpen: true });

    window.addEventListener('bands:deleted', onBandsChanged);
    window.addEventListener('bands:changed', onBandsChanged);

    return () => {
      window.removeEventListener('bands:deleted', onBandsChanged);
      window.removeEventListener('bands:changed', onBandsChanged);
    };
  }, [invalidateBands]);

  return useMemo(
    () => ({
      bands,
      setBands, // keep this so you can do optimistic merges if you want
      loadingBands,
      bandsLoadedOnce,
      ensureBandsLoaded,
      invalidateBands,
    }),
    [bands, loadingBands, bandsLoadedOnce, ensureBandsLoaded, invalidateBands]
  );
}
