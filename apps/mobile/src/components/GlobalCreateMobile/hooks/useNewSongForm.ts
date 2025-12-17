/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { ShowToast } from './useNewBandForm';

export function useNewSongForm(opts: {
  showToast: ShowToast;
  onError?: (msg: string | null) => void;
}) {
  const { showToast, onError } = opts;

  const [bandId, setBandId] = useState('');
  const [title, setTitle] = useState('');
  const [key, setKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [origin, setOrigin] = useState<'original' | 'cover'>('original');
  const [originalArtist, setOriginalArtist] = useState('');
  const [duration, setDuration] = useState('');
  const [showKeyPicker, setShowKeyPicker] = useState(false);

  const parseDuration = useCallback((str: string): number | null => {
    if (!str.trim()) return null;

    if (!str.includes(':')) {
      const secs = parseInt(str, 10);
      return Number.isNaN(secs) ? null : secs;
    }

    const [m, s] = str.split(':');
    const mins = parseInt(m, 10);
    const secs = parseInt(s, 10);
    if (Number.isNaN(mins) || Number.isNaN(secs)) return null;
    return mins * 60 + secs;
  }, []);

  const reset = useCallback(() => {
    setTitle('');
    setKey('');
    setBpm('');
    setOrigin('original');
    setOriginalArtist('');
    setDuration('');
    setShowKeyPicker(false);
  }, []);

  const submit = useCallback(async () => {
    if (!bandId) return showToast('Choose a band.'), null;
    if (!title.trim()) return showToast('Add a song title.'), null;
    if (origin === 'cover' && !originalArtist.trim()) {
      return showToast('Add the original artist for this cover.'), null;
    }

    try {
      onError?.(null);

      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user)
        return showToast('Please sign in first.'), null;

      const durationSeconds = parseDuration(duration);

      const { data, error } = await supabase
        .from('songs')
        .insert({
          band_id: bandId,
          title: title.trim(),
          default_key: key.trim() || null,
          default_bpm: bpm ? Number(bpm) : null,
          duration: durationSeconds,
          origin,
          original_artist:
            origin === 'cover' ? originalArtist.trim() || null : null,
          created_by: userData.user.id,
        } as any)
        .select('id')
        .single();

      if (error) throw error;
      return data.id as string;
    } catch (e: any) {
      onError?.(String(e?.message ?? 'Could not create song'));
      return null;
    }
  }, [
    bandId,
    title,
    key,
    bpm,
    duration,
    origin,
    originalArtist,
    parseDuration,
    onError,
    showToast,
  ]);

  return {
    bandId,
    title,
    key,
    bpm,
    duration,
    origin,
    originalArtist,
    showKeyPicker,

    setBandId,
    setTitle,
    setKey,
    setBpm,
    setDuration,
    setOrigin,
    setOriginalArtist,
    setShowKeyPicker,

    reset,
    submit,
  };
}
