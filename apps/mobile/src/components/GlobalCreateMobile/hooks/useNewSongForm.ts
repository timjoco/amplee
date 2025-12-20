/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type { ShowToast } from './useNewBandForm';

/**
 * useNewSongForm (GlobalCreateMobile)
 *
 * This hook powers the "New Song" step inside GlobalCreateMobile.
 *
 * How GlobalCreateMobile uses it:
 * - <NewSongStep /> reads fields (title, key, bpm, origin, etc.) to render inputs
 * - <NewSongStep /> calls setters (setTitle, setKey, setOrigin, ...) on user input
 * - GlobalCreateMobile.handleSubmitCreateSong() calls submit() on "Create"
 * - GlobalCreateMobile.closeAll() calls reset() on close or after successful submit
 *
 */
export function useNewSongForm(opts: {
  showToast: ShowToast;
  onError?: (msg: string | null) => void;
}) {
  const { showToast, onError } = opts;

  // ─────────────────────────────────────────────────────────────
  // Core song fields (bound to inputs in <NewSongStep />)
  // ─────────────────────────────────────────────────────────────
  const [bandId, setBandId] = useState(''); // selected band the song belongs to
  const [title, setTitle] = useState('');
  const [key, setKey] = useState(''); // musical key (stored as text in DB)
  const [bpm, setBpm] = useState(''); // string in UI, parsed/validated on submit
  const [origin, setOrigin] = useState<'original' | 'cover'>('original');
  const [originalArtist, setOriginalArtist] = useState('');

  // Duration is stored as seconds in DB.
  // We support two UX paths:
  // 1) a numeric picker/selector that sets durationSeconds directly
  // 2) a legacy "mm:ss" text input that we parse at submit time (duration)
  const [durationSeconds, setDurationSeconds] = useState<number | null>(null);

  // UI toggle for the key picker modal (controlled by <NewSongStep />)
  const [showKeyPicker, setShowKeyPicker] = useState(false);

  // Legacy string-based duration (kept for backwards compatibility / older UI)
  const [duration, setDuration] = useState('');

  // ─────────────────────────────────────────────────────────────
  // Helpers (KISS: small, local, and validated)
  // ─────────────────────────────────────────────────────────────

  /**
   * Parse + validate BPM.
   * - Accepts decimals but stores an integer (rounded)
   * - Returns null for blank or invalid values
   * - Enforces reasonable bounds to avoid junk data (tweak if desired)
   */
  const parseBpm = useCallback((raw: string): number | null => {
    const s = raw.trim();
    if (!s) return null;

    const n = Number(s);
    if (!Number.isFinite(n)) return null;

    const rounded = Math.round(n);
    // Choose sane bounds; adjust if you want
    if (rounded < 20 || rounded > 300) return null;

    return rounded;
  }, []);

  /**
   * Parse + validate duration.
   * Supports:
   * - "mm:ss" (seconds must be 0..59)
   * - raw seconds (integer >= 0)
   *
   * Returns null if blank or invalid.
   */
  const parseDuration = useCallback((str: string): number | null => {
    const trimmed = str.trim();
    if (!trimmed) return null;

    // Raw seconds (e.g. "225")
    if (!trimmed.includes(':')) {
      const secs = Number(trimmed);
      if (!Number.isFinite(secs)) return null;

      const rounded = Math.floor(secs);
      if (rounded < 0) return null;

      return rounded;
    }

    // "mm:ss"
    const parts = trimmed.split(':');
    if (parts.length !== 2) return null;

    const mins = Number(parts[0]);
    const secs = Number(parts[1]);
    if (!Number.isFinite(mins) || !Number.isFinite(secs)) return null;

    const m = Math.floor(mins);
    const s = Math.floor(secs);

    // enforce real time format
    if (m < 0) return null;
    if (s < 0 || s > 59) return null;

    return m * 60 + s;
  }, []);

  /**
   * Resets local form state back to defaults.
   *
   * Used by GlobalCreateMobile.closeAll() when:
   * - modal is dismissed
   * - creation succeeds and we want a clean slate next open
   *
   * NOTE:
   * - We intentionally do NOT reset bandId here by default because GlobalCreateMobile
   *   often sets a default band when entering this step (goToStep).
   *   If you want band selection to reset on close, add: setBandId('');
   */
  const reset = useCallback(() => {
    setTitle('');
    setKey('');
    setBpm('');
    setOrigin('original');
    setOriginalArtist('');
    setDuration('');
    setDurationSeconds(null);
    setShowKeyPicker(false);
  }, []);

  /**
   * Creates the song row in Supabase.
   *
   * Called by GlobalCreateMobile.handleSubmitCreateSong():
   * - Returns songId (string) on success
   * - Returns null on validation failure or server error
   */
  const submit = useCallback(async () => {
    // ── Fast local validation (keeps UX snappy)
    if (!bandId) return showToast('Choose a band.'), null;
    if (!title.trim()) return showToast('Add a song title.'), null;

    // Cover songs must include original artist
    if (origin === 'cover' && !originalArtist.trim()) {
      return showToast('Add the original artist for this cover.'), null;
    }

    // Validate BPM (prevents NaN from being inserted)
    const bpmNum = parseBpm(bpm);
    if (bpm.trim() && bpmNum == null) {
      return showToast('BPM must be a number (20–300).'), null;
    }

    // Duration resolution:
    // - If durationSeconds is set (preferred), use it
    // - Otherwise parse legacy duration string
    const parsedLegacyDuration = parseDuration(duration);
    const finalDuration = durationSeconds ?? parsedLegacyDuration;

    // If user typed something in duration string but it doesn't parse, show a helpful toast
    if (
      durationSeconds == null &&
      duration.trim() &&
      parsedLegacyDuration == null
    ) {
      return showToast('Duration must be "mm:ss" or seconds.'), null;
    }

    try {
      // Clear shared modal error banner before attempting submit
      onError?.(null);

      // Auth required (created_by is set)
      const { data: userData, error: userErr } = await supabase.auth.getUser();
      if (userErr || !userData.user) {
        return showToast('Please sign in first.'), null;
      }

      // Insert into songs
      const { data, error } = await supabase
        .from('songs')
        .insert({
          band_id: bandId,
          title: title.trim(),
          default_key: key.trim() || null,
          default_bpm: bpmNum, // validated integer or null
          duration: finalDuration, // seconds (or null)
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
      // Route errors into the shared modal error banner
      onError?.(String(e?.message ?? 'Could not create song'));
      return null;
    }
  }, [
    bandId,
    title,
    key,
    bpm,
    duration,
    durationSeconds,
    origin,
    originalArtist,
    parseBpm,
    parseDuration,
    onError,
    showToast,
  ]);

  /**
   * Returned API is consumed by:
   * - <NewSongStep /> for rendering/binding inputs (reads fields, calls setters)
   * - GlobalCreateMobile for submit/reset + navigation decisions
   */
  return {
    // fields (UI reads)
    bandId,
    title,
    key,
    bpm,
    duration,
    durationSeconds,
    origin,
    originalArtist,
    showKeyPicker,

    // setters (UI writes)
    setBandId,
    setTitle,
    setKey,
    setBpm,
    setDuration,
    setDurationSeconds,
    setOrigin,
    setOriginalArtist,
    setShowKeyPicker,

    // lifecycle
    reset,
    submit,
  };
}
