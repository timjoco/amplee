/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { TourRow, TourStatus } from '../types/tourTypes';

type UseTourActionsArgs = {
  tourId?: string;
  tour: TourRow | null;
  setTour: React.Dispatch<React.SetStateAction<TourRow | null>>;
  onDeleted?: () => void;
};

export function useTourActions({
  tourId,
  tour,
  setTour,
  onDeleted,
}: UseTourActionsArgs) {
  // Edit tour modal state
  const [showEditTour, setShowEditTour] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');
  const [editStatus, setEditStatus] = useState<TourStatus>('planning');
  const [savingTour, setSavingTour] = useState(false);

  // Delete tour modal state
  const [showDeleteTour, setShowDeleteTour] = useState(false);
  const [deletingTour, setDeletingTour] = useState(false);

  const startEditTour = useCallback(() => {
    if (!tour) return;
    setEditName(tour.name);
    setEditDescription(tour.description || '');
    setEditStartDate(tour.start_date || '');
    setEditEndDate(tour.end_date || '');
    setEditStatus(tour.status);
    setShowEditTour(true);
  }, [tour]);

  const closeEditTour = useCallback(() => {
    setShowEditTour(false);
  }, []);

  const saveTourEdits = useCallback(async () => {
    if (!tourId || !editName.trim()) return;

    setSavingTour(true);
    try {
      const { error } = await supabase
        .from('tours')
        .update({
          name: editName.trim(),
          description: editDescription.trim() || null,
          start_date: editStartDate || null,
          end_date: editEndDate || null,
          status: editStatus,
          updated_at: new Date().toISOString(),
        } as any)
        .eq('id', tourId);

      if (error) {
        console.error('[useTourActions] save tour error', error);
        return;
      }

      setTour((prev) =>
        prev
          ? {
              ...prev,
              name: editName.trim(),
              description: editDescription.trim() || null,
              start_date: editStartDate || null,
              end_date: editEndDate || null,
              status: editStatus,
            }
          : null
      );
      setShowEditTour(false);
    } finally {
      setSavingTour(false);
    }
  }, [tourId, editName, editDescription, editStartDate, editEndDate, editStatus, setTour]);

  const openDeleteTourConfirm = useCallback(() => {
    setShowDeleteTour(true);
  }, []);

  const closeDeleteTourConfirm = useCallback(() => {
    setShowDeleteTour(false);
  }, []);

  const deleteTour = useCallback(async () => {
    if (!tourId) return;

    setDeletingTour(true);
    try {
      const { error } = await supabase.from('tours').delete().eq('id', tourId);

      if (error) {
        console.error('[useTourActions] delete tour error', error);
        return;
      }

      setShowDeleteTour(false);
      onDeleted?.();
    } finally {
      setDeletingTour(false);
    }
  }, [tourId, onDeleted]);

  const updateTourStatus = useCallback(
    async (status: TourStatus) => {
      if (!tourId) return;

      const { error } = await supabase
        .from('tours')
        .update({ status, updated_at: new Date().toISOString() } as any)
        .eq('id', tourId);

      if (error) {
        console.error('[useTourActions] update status error', error);
        return;
      }

      setTour((prev) => (prev ? { ...prev, status } : null));
    },
    [tourId, setTour]
  );

  return {
    // Edit tour
    showEditTour,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editStartDate,
    setEditStartDate,
    editEndDate,
    setEditEndDate,
    editStatus,
    setEditStatus,
    savingTour,
    startEditTour,
    closeEditTour,
    saveTourEdits,
    // Delete tour
    showDeleteTour,
    deletingTour,
    openDeleteTourConfirm,
    closeDeleteTourConfirm,
    deleteTour,
    // Status
    updateTourStatus,
  };
}
