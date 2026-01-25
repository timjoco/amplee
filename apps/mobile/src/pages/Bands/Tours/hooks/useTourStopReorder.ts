/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DragEndEvent } from '@dnd-kit/core';
import { useCallback, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { TourStopWithFinancials } from '../types/tourTypes';

type UseTourStopReorderArgs = {
  tourId?: string;
  stops: TourStopWithFinancials[];
  setStops: React.Dispatch<React.SetStateAction<TourStopWithFinancials[]>>;
  triggerHaptic: () => Promise<void> | void;
};

export function useTourStopReorder({
  tourId,
  stops,
  setStops,
  triggerHaptic,
}: UseTourStopReorderArgs) {
  const [savingReorder, setSavingReorder] = useState(false);

  const saveOrder = useCallback(
    async (reorderedStops: TourStopWithFinancials[]) => {
      if (!tourId) return;

      setSavingReorder(true);
      try {
        const updates = reorderedStops.map((stop, index) => ({
          id: stop.id,
          order_index: index,
        }));

        // Update each stop's order_index
        for (const update of updates) {
          const { error } = await supabase
            .from('tour_stops')
            .update({ order_index: update.order_index } as any)
            .eq('id', update.id);

          if (error) {
            console.error('[useTourStopReorder] update error', error);
          }
        }
      } finally {
        setSavingReorder(false);
      }
    },
    [tourId]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      void triggerHaptic();

      const oldIndex = stops.findIndex((s) => s.id === active.id);
      const newIndex = stops.findIndex((s) => s.id === over.id);

      if (oldIndex === -1 || newIndex === -1) return;

      const reordered = [...stops];
      const [removed] = reordered.splice(oldIndex, 1);
      reordered.splice(newIndex, 0, removed);

      // Update order_index values
      const updated = reordered.map((stop, index) => ({
        ...stop,
        order_index: index,
      }));

      setStops(updated);
      void saveOrder(updated);
    },
    [stops, setStops, saveOrder, triggerHaptic]
  );

  return {
    savingReorder,
    saveOrder,
    handleDragEnd,
  };
}
