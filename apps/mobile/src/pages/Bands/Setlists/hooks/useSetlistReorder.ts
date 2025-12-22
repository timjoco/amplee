import type { DragEndEvent } from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { useCallback, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { SetlistTemplateItemRow } from '../types/setlistTypes';

/**
 * Reorder hook for setlist template items.
 *
 * Key points:
 * - UI reorder is optimistic (we update local state immediately for snappy drag UX)
 * - Persistence is handled via an RPC that updates order_index in one transaction
 * - We intentionally DO NOT use upsert for reorder:
 *    PostgREST "upsert" goes through an INSERT code path, which triggers RLS WITH CHECK
 *    and can fail with "new row violates row-level security policy" even when updating.
 * - RLS is the source of truth: only band admins can persist reorder. Non-admins
 *   should still see the list, but drag is disabled elsewhere (useSortable disabled).
 */
export function useSetlistReorder(args: {
  setlistId?: string;
  items: SetlistTemplateItemRow[];
  setItems: React.Dispatch<React.SetStateAction<SetlistTemplateItemRow[]>>;
  triggerHaptic: () => Promise<void> | void;
}) {
  const { setlistId, setItems, triggerHaptic } = args;
  const [savingReorder, setSavingReorder] = useState(false);

  /**
   * Persist the current client order to the server.
   *
   * We call a server-side function:
   *   reorder_setlist_template_items(template_id, ids[])
   *
   * Why RPC?
   * - Single request (better on mobile)
   * - Atomic update in Postgres (no partial order writes)
   * - Avoids PostgREST upsert INSERT path that can trip RLS "WITH CHECK"
   *
   * Security:
   * - Function is SECURITY INVOKER (default). Updates still go through RLS on
   *   setlist_template_items, so only admins can update order_index.
   */
  const saveOrder = useCallback(
    async (rows: SetlistTemplateItemRow[]) => {
      if (!setlistId) return;

      // Nothing to persist
      if (!rows.length) return;

      setSavingReorder(true);
      try {
        // IDs in the exact order we want them displayed.
        // The RPC sets order_index based on array position.
        const ids = rows.map((r) => r.id);

        const { error } = await supabase.rpc('reorder_setlist_template_items', {
          p_template_id: setlistId,
          p_ids: ids,
        });

        if (error) {
          // Common case: 42501 / permission denied / RLS failure if user isn't admin
          // or if their membership changed while the screen is open.
          console.error('[SetlistTemplate] save order error', error);
          // Optional UX improvement:
          // - show toast ("Only admins can reorder songs")
          // - refetch items to re-sync order if needed
        }
      } finally {
        setSavingReorder(false);
      }
    },
    [setlistId]
  );

  /**
   * Optimistic drag end:
   * - compute new order in memory
   * - renumber order_index locally (for UI + consistency)
   * - persist via saveOrder (best-effort; server remains source of truth)
   */
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

        // Persist best-effort (do not block UI). If this fails, we should ideally
        // show a toast and/or refetch to re-sync.
        void saveOrder(moved);

        return moved;
      });
    },
    [saveOrder, setItems, triggerHaptic]
  );

  return { savingReorder, saveOrder, handleDragEnd };
}
