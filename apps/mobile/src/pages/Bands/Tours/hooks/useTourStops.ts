/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { TourStopRow, TourStopWithFinancials } from '../types/tourTypes';

type UseTourStopsArgs = {
  tourId?: string;
  stops: TourStopWithFinancials[];
  setStops: React.Dispatch<React.SetStateAction<TourStopWithFinancials[]>>;
  triggerHaptic: () => Promise<void> | void;
};

export function useTourStops({
  tourId,
  stops,
  setStops,
  triggerHaptic,
}: UseTourStopsArgs) {
  const [addStopOpen, setAddStopOpen] = useState(false);
  const [savingStop, setSavingStop] = useState(false);

  const openAddStop = useCallback(() => {
    setAddStopOpen(true);
  }, []);

  const closeAddStop = useCallback(() => {
    setAddStopOpen(false);
  }, []);

  const handleAddStop = useCallback(
    async (stopData: {
      date: string;
      venue_name: string;
      venue_city?: string;
      venue_state?: string;
      venue_address?: string;
      venue_lat?: number;
      venue_lng?: number;
    }) => {
      if (!tourId) return;

      void triggerHaptic();
      setSavingStop(true);

      try {
        const newOrderIndex = stops.length;

        const { data, error } = await supabase
          .from('tour_stops')
          .insert({
            tour_id: tourId,
            date: stopData.date,
            venue_name: stopData.venue_name,
            venue_city: stopData.venue_city || null,
            venue_state: stopData.venue_state || null,
            venue_address: stopData.venue_address || null,
            venue_lat: stopData.venue_lat || null,
            venue_lng: stopData.venue_lng || null,
            order_index: newOrderIndex,
            status: 'tentative',
          } as any)
          .select('*')
          .single();

        if (error) {
          console.error('[useTourStops] add stop error', error);
          return;
        }

        const newStop: TourStopWithFinancials = {
          ...(data as TourStopRow),
          financials: null,
        };

        setStops((prev) => [...prev, newStop]);
        setAddStopOpen(false);
      } finally {
        setSavingStop(false);
      }
    },
    [tourId, stops.length, setStops, triggerHaptic]
  );

  const handleDeleteStop = useCallback(
    async (stopId: string) => {
      void triggerHaptic();

      const { error } = await supabase
        .from('tour_stops')
        .delete()
        .eq('id', stopId);

      if (error) {
        console.error('[useTourStops] delete stop error', error);
        return;
      }

      setStops((prev) => prev.filter((s) => s.id !== stopId));
    },
    [setStops, triggerHaptic]
  );

  const handleUpdateStop = useCallback(
    async (stopId: string, updates: Partial<TourStopRow>) => {
      const { error } = await supabase
        .from('tour_stops')
        .update(updates as any)
        .eq('id', stopId);

      if (error) {
        console.error('[useTourStops] update stop error', error);
        return false;
      }

      setStops((prev) =>
        prev.map((s) => (s.id === stopId ? { ...s, ...updates } : s))
      );
      return true;
    },
    [setStops]
  );

  return {
    addStopOpen,
    openAddStop,
    closeAddStop,
    savingStop,
    handleAddStop,
    handleDeleteStop,
    handleUpdateStop,
  };
}
