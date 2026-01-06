import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useEventShell } from '../../../../hooks/useEventShell';
import { supabase } from '../../../../lib/supabase';
import type { RouteParams } from '../types';

export function useEventNotes() {
  const { eventId } = useParams<RouteParams>();
  const { event, isAdmin, loading } = useEventShell(eventId);

  const [notes, setNotes] = useState<string>('');
  const [editedNotes, setEditedNotes] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const title = event?.title ?? 'Event';

  // Load notes from event data
  useEffect(() => {
    if (event?.notes) {
      setNotes(event.notes);
      setEditedNotes(event.notes);
    }
  }, [event?.notes]);

  const handleStartEdit = () => {
    setEditedNotes(notes);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setEditedNotes(notes);
    setIsEditing(false);
  };

  const handleSaveNotes = async () => {
    if (!eventId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('events')
        .update({ notes: editedNotes })
        .eq('id', eventId);

      if (error) throw error;

      setNotes(editedNotes);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    eventId,
    title,
    notes,
    editedNotes,
    setEditedNotes,
    isEditing,
    isSaving,
    isAdmin,
    loading,
    handleStartEdit,
    handleCancelEdit,
    handleSaveNotes,
  };
}
