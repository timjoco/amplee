/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';

import { useEventShell } from '../../../../hooks/useEventShell';
import { supabase } from '../../../../lib/supabase';
import type { EventFile, RouteParams } from '../types';

export function useEventFiles() {
  const { eventId } = useParams<RouteParams>();
  const { event, isAdmin, loading } = useEventShell(eventId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [files, setFiles] = useState<EventFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const title = event?.title ?? 'Event';

  // Load files for this event
  useEffect(() => {
    if (!eventId) return;

    let alive = true;

    (async () => {
      const { data, error } = await supabase
        .from('event_files')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (!alive) return;

      if (error) {
        console.error('Failed to load files:', error);
      } else {
        setFiles((data as EventFile[]) || []);
      }
      setFilesLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [eventId]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !eventId || !event?.band_id) return;

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setUploading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Generate unique file path
      const fileExt = file.name.split('.').pop();
      const fileName = `${eventId}/${Date.now()}-${Math.random()
        .toString(36)
        .substring(7)}.${fileExt}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('event-files')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create database record
      const { data: newFile, error: dbError } = await supabase
        .from('event_files')
        .insert({
          event_id: eventId,
          band_id: event.band_id,
          file_name: file.name,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by: user.id,
        })
        .select('*')
        .single();

      if (dbError) throw dbError;

      setFiles((prev) => [newFile as EventFile, ...prev]);
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to upload file. Please try again.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownload = async (file: EventFile) => {
    try {
      const { data, error } = await supabase.storage
        .from('event-files')
        .createSignedUrl(file.file_path, 60);

      if (error) throw error;
      if (!data?.signedUrl) throw new Error('No signed URL returned');

      window.location.href = data.signedUrl;
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file');
    }
  };

  const handleDelete = async (file: EventFile) => {
    if (!confirm(`Delete "${file.file_name}"?`)) return;

    try {
      const { error: storageError } = await supabase.storage
        .from('event-files')
        .remove([file.file_path]);

      if (storageError) throw storageError;

      const { error: dbError } = await supabase
        .from('event_files')
        .delete()
        .eq('id', file.id);

      if (dbError) throw dbError;

      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete file');
    }
  };

  return {
    eventId,
    title,
    files,
    loading,
    filesLoading,
    uploading,
    isAdmin,
    fileInputRef,
    handleUploadClick,
    handleFileChange,
    handleDownload,
    handleDelete,
  };
}
