import { useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { SetlistTemplateItemRow } from '../types/setlistTypes';

import { useDndSensors } from './useDndSensors';
import { useHapticsPress } from './useHapticsPress';
import { useSetlistDurations } from './useSetlistDurations';
import { useSetlistLinks } from './useSetlistLinks';
import { useSetlistReorder } from './useSetlistReorder';
import { useSetlistSongs } from './useSetlistSongs';
import { useSetlistTemplateActions } from './useSetlistTemplateActions';
import { useSetlistTemplateLoad } from './useSetlistTemplateLoad';

type UseSetlistTemplateEditorArgs = {
  bandId?: string;
  setlistId?: string;
  onDeleted?: () => void;
};

/**
 * Composer hook for the Setlist Template Editor screen.
 * Orchestrates loading template data, DnD reorder, song picker + inserts,
 * external links CRUD, rename/delete actions, haptics/press UI state, and
 * duration calculations. The page should mostly talk to this hook only.
 */
export function useSetlistTemplateEditor({
  bandId,
  setlistId,
  onDeleted,
}: UseSetlistTemplateEditorArgs) {
  const sensors = useDndSensors();
  const { pressedButton, triggerHaptic, handleButtonPress } = useHapticsPress();

  const { loading, template, setTemplate, items, setItems, links, setLinks } =
    useSetlistTemplateLoad(bandId, setlistId);

  const { savingReorder, saveOrder, handleDragEnd } = useSetlistReorder({
    setlistId,
    items,
    setItems,
    triggerHaptic,
  });

  const handleDeleteItem = useCallback(
    async (id: string) => {
      void triggerHaptic();

      const { error } = await supabase
        .from('setlist_template_items')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('[SetlistTemplate] delete item error', error);
        return;
      }

      setItems((prev) => {
        const remaining = prev.filter((r) => r.id !== id);
        const renumbered = remaining.map((r, i) => ({ ...r, order_index: i }));
        void saveOrder(renumbered as SetlistTemplateItemRow[]);
        return renumbered;
      });
    },
    [saveOrder, setItems, triggerHaptic]
  );

  const songsApi = useSetlistSongs({
    bandId,
    setlistId,
    items,
    setItems,
    triggerHaptic,
  });

  const linksApi = useSetlistLinks({
    setlistId,
    links,
    setLinks,
    triggerHaptic,
  });

  const templateActions = useSetlistTemplateActions({
    bandId,
    template,
    setTemplate,
    onDeleted,
  });

  const durations = useSetlistDurations(items);

  return {
    // data
    loading,
    template,
    items,
    links,
    savingReorder,
    sensors,
    pressedButton,

    // durations
    ...durations,

    // ui helpers
    handleButtonPress,

    // items
    handleDragEnd,
    handleDeleteItem,

    // songs
    ...songsApi,

    // links
    ...linksApi,

    // template actions
    ...templateActions,
  };
}
