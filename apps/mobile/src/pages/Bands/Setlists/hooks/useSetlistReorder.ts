import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { SetlistTemplateItemRow } from '../types/setlistTypes';

/**
 * Reorder hook for setlist template items.
 * Provides DnD onDragEnd handling + persistence (upsert) of updated order_index
 * back to Supabase, plus a savingReorder flag for UI feedback.
 */
export function useSetlistReorder(args: {
  setlistId?: string;
  items: SetlistTemplateItemRow[];
  setItems: React.Dispatch<React.SetStateAction<SetlistTemplateItemRow[]>>;
  triggerHaptic: () => Promise<void> | void;
}) {
  const { setlistId, setItems, triggerHaptic } = args;
  const [savingReorder, setSavingReorder] = useState(false);

  const saveOrder = useCallback(
    async (rows: SetlistTemplateItemRow[]) => {
      if (!rows.length || !setlistId) return;
      setSavingReorder(true);
      try {
        const payload = rows.map((r) => ({
          ...r,
          template_id: r.template_id ?? setlistId,
          musical_key: r.musical_key ?? null,
          bpm: r.bpm ?? null,
          notes: r.notes ?? null,
          duration_seconds: r.duration_seconds ?? null,
        }));

        const { error } = await supabase
          .from('setlist_template_items')
          .upsert(payload);

        if (error) console.error('[SetlistTemplate] save order error', error);
      } finally {
        setSavingReorder(false);
      }
    },
    [setlistId]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      void triggerHaptic();

      setItems((prev) => {
        const oldIndex = prev.findIndex((r) => r.id === active.id);
        const newIndex = prev.findIndex((r) => r.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;

        const moved = arrayMove(prev, oldIndex, newIndex).map((row, i) => ({
          ...row,
          order_index: i,
        }));

        void saveOrder(moved);
        return moved;
      });
    },
    [saveOrder, setItems, triggerHaptic]
  );

  return { savingReorder, saveOrder, handleDragEnd };
}
