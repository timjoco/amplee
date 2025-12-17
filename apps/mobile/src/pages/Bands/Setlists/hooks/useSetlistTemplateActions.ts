import { useCallback, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { SetlistTemplateRow } from '../types/setlistTypes';

/**
 * Template-level actions hook.
 * Manages rename + delete flows for a setlist template (modal state + mutations),
 * including cascading deletes of items/links before removing the template row.
 */
export function useSetlistTemplateActions(args: {
  bandId?: string;
  template: SetlistTemplateRow | null;
  setTemplate: React.Dispatch<React.SetStateAction<SetlistTemplateRow | null>>;
  onDeleted?: () => void;
}) {
  const { bandId, template, setTemplate, onDeleted } = args;

  const [showEditTemplate, setShowEditTemplate] = useState(false);
  const [editName, setEditName] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  const [showDeleteTemplate, setShowDeleteTemplate] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  const startEditTemplate = useCallback(() => {
    if (!template) return;
    setEditName(template.name || '');
    setShowEditTemplate(true);
  }, [template]);

  const closeEditTemplate = useCallback(() => {
    if (!savingTemplate) setShowEditTemplate(false);
  }, [savingTemplate]);

  const saveTemplateEdits = useCallback(async () => {
    if (!template || !bandId) return;

    setSavingTemplate(true);
    try {
      const name = editName.trim() || 'Untitled setlist';

      const { error } = await supabase
        .from('setlist_templates')
        .update({ name })
        .eq('id', template.id)
        .eq('band_id', bandId);

      if (error) {
        console.error('[SetlistTemplate] update template error', error);
        return;
      }

      setTemplate((prev) => (prev ? { ...prev, name } : prev));
      setShowEditTemplate(false);
    } finally {
      setSavingTemplate(false);
    }
  }, [bandId, editName, setTemplate, template]);

  const openDeleteTemplateConfirm = useCallback(() => {
    setShowDeleteTemplate(true);
  }, []);

  const closeDeleteTemplateConfirm = useCallback(() => {
    if (!deletingTemplate) setShowDeleteTemplate(false);
  }, [deletingTemplate]);

  const deleteTemplate = useCallback(async () => {
    if (!template || !bandId) return;

    setDeletingTemplate(true);
    try {
      await supabase
        .from('setlist_template_links')
        .delete()
        .eq('template_id', template.id);

      await supabase
        .from('setlist_template_items')
        .delete()
        .eq('template_id', template.id);

      const { error } = await supabase
        .from('setlist_templates')
        .delete()
        .eq('id', template.id)
        .eq('band_id', bandId);

      if (error) {
        console.error('[SetlistTemplate] delete template error', error);
        return;
      }

      setShowDeleteTemplate(false);
      onDeleted?.();
    } finally {
      setDeletingTemplate(false);
    }
  }, [bandId, onDeleted, template]);

  return {
    showEditTemplate,
    editName,
    setEditName,
    savingTemplate,
    showDeleteTemplate,
    deletingTemplate,
    startEditTemplate,
    closeEditTemplate,
    saveTemplateEdits,
    openDeleteTemplateConfirm,
    closeDeleteTemplateConfirm,
    deleteTemplate,
  };
}
