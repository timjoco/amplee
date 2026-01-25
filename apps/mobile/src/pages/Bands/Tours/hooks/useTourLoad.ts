import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type {
  TourRow,
  TourStopFinancialsRow,
  TourStopRow,
  TourStopWithFinancials,
} from '../types/tourTypes';

export function useTourLoad(bandId?: string, tourId?: string) {
  const [loading, setLoading] = useState(true);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  const [tour, setTour] = useState<TourRow | null>(null);
  const [stops, setStops] = useState<TourStopWithFinancials[]>([]);

  const reload = useCallback(async () => {
    if (!tourId) {
      setTour(null);
      setStops([]);
      return;
    }

    setLoading(true);
    try {
      // 1) Load tour (RLS is the authority)
      const { data: tourData, error: tourError } = await supabase
        .from('tours')
        .select('*')
        .eq('id', tourId)
        .maybeSingle();

      if (tourError || !tourData) {
        console.error('[useTourLoad] tour load error', tourError);
        setTour(null);
        setStops([]);
        return;
      }

      setTour(tourData as TourRow);

      // 2) Load stops with financials (ordered by date, soonest first)
      const { data: stopsData, error: stopsError } = await supabase
        .from('tour_stops')
        .select('*')
        .eq('tour_id', tourId)
        .order('date', { ascending: true });

      if (stopsError) {
        console.error('[useTourLoad] stops load error', stopsError);
        setStops([]);
        return;
      }

      const stopIds = (stopsData || []).map((s: TourStopRow) => s.id);
      let financialsMap: Record<string, TourStopFinancialsRow> = {};

      if (stopIds.length > 0) {
        const { data: financialsData } = await supabase
          .from('tour_stop_financials')
          .select('*')
          .in('tour_stop_id', stopIds);

        if (financialsData) {
          for (const f of financialsData as TourStopFinancialsRow[]) {
            financialsMap[f.tour_stop_id] = f;
          }
        }
      }

      const stopsWithFinancials: TourStopWithFinancials[] = (stopsData || []).map(
        (s: TourStopRow) => ({
          ...s,
          financials: financialsMap[s.id] || null,
        })
      );

      setStops(stopsWithFinancials);
    } finally {
      setLoading(false);
      setHasAttemptedLoad(true);
    }
  }, [tourId]);

  useEffect(() => {
    if (!bandId || !tourId) {
      setTour(null);
      setStops([]);
      setLoading(false);
      setHasAttemptedLoad(true);
      return;
    }

    void reload();
  }, [bandId, tourId, reload]);

  return {
    loading,
    hasAttemptedLoad,
    tour,
    setTour,
    stops,
    setStops,
    reload,
  };
}
