import { useCallback, useMemo, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { SetlistTemplateItemRow, SongOption } from '../types/setlistTypes';

/**
 * Song library + song picker hook for setlist templates.
 * Manages song picker modal state, loads songs for the band, filters via search,
 * and inserts selected songs as new template items in Supabase.
 */
export function useSetlistSongs(args: {
  bandId?: string;
  setlistId?: string;
  items: SetlistTemplateItemRow[];
  setItems: React.Dispatch<React.SetStateAction<SetlistTemplateItemRow[]>>;
  triggerHaptic: () => Promise<void> | void;
}) {
  const { bandId, setlistId, items, setItems, triggerHaptic } = args;

  const [songPickerOpen, setSongPickerOpen] = useState(false);
  const [songs, setSongs] = useState<SongOption[]>([]);
  const [loadingSongs, setLoadingSongs] = useState(false);
  const [songSearch, setSongSearch] = useState('');

  const filteredSongs = useMemo(
    () =>
      songs.filter((s) =>
        s.title.toLowerCase().includes(songSearch.toLowerCase())
      ),
    [songs, songSearch]
  );

  const loadSongs = useCallback(async () => {
    if (!bandId) return;
    setLoadingSongs(true);
    try {
      const { data, error } = await supabase
        .from('songs')
        .select(
          'id,title,default_key,default_bpm,duration,origin,original_artist'
        )
        .eq('band_id', bandId)
        .order('title', { ascending: true });

      if (error) {
        console.error('[SetlistTemplate] load songs error', error);
        setSongs([]);
      } else {
        setSongs((data || []) as SongOption[]);
      }
    } finally {
      setLoadingSongs(false);
    }
  }, [bandId]);

  const openSongPicker = useCallback(() => {
    setSongPickerOpen(true);
    setSongSearch('');
    if (!songs.length) void loadSongs();
  }, [songs.length, loadSongs]);

  const closeSongPicker = useCallback(() => setSongPickerOpen(false), []);

  const handleSelectSongs = useCallback(
    async (selectedSongs: SongOption[]) => {
      if (!setlistId || selectedSongs.length === 0) return;

      void triggerHaptic();

      const startIndex = items.length;
      const inserts = selectedSongs.map((song, i) => ({
        template_id: setlistId,
        title: song.title,
        musical_key: song.default_key,
        bpm: song.default_bpm,
        duration_seconds: song.duration ?? null,
        notes: null as string | null,
        order_index: startIndex + i,
      }));

      const { data, error } = await supabase
        .from('setlist_template_items')
        .insert(inserts)
        .select('*');

      if (error) {
        console.error('[SetlistTemplate] add songs error', error);
        return;
      }

      setItems((prev) => [...prev, ...(data as SetlistTemplateItemRow[])]);
      setSongPickerOpen(false);
    },
    [items.length, setItems, setlistId, triggerHaptic]
  );

  return {
    songs,
    loadingSongs,
    songSearch,
    setSongSearch,
    filteredSongs,
    songPickerOpen,
    openSongPicker,
    closeSongPicker,
    handleSelectSongs,
  };
}
