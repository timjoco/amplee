import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import type { SetlistTemplateRow, SetlistTemplateItemRow, SongOption } from '../../Setlists/types/setlistTypes';

type SetlistItemWithSongId = SetlistTemplateItemRow & {
  song_id?: string | null;
};

type SetlistWithItems = SetlistTemplateRow & {
  items: SetlistItemWithSongId[];
};

export function useTourStopSetlist(bandId: string | undefined, setlistId: string | null | undefined) {
  const [availableSetlists, setAvailableSetlists] = useState<SetlistTemplateRow[]>([]);
  const [assignedSetlist, setAssignedSetlist] = useState<SetlistWithItems | null>(null);
  const [songs, setSongs] = useState<SongOption[]>([]);
  const [loading, setLoading] = useState(false);

  // Load available setlists and songs for the band
  useEffect(() => {
    if (!bandId) return;

    let alive = true;

    (async () => {
      // Load setlists
      const { data: setlistData, error: setlistError } = await supabase
        .from('setlist_templates')
        .select('*')
        .eq('band_id', bandId)
        .order('name');

      if (!alive) return;

      if (setlistError) {
        console.error('Failed to load setlists:', setlistError);
      } else {
        setAvailableSetlists(setlistData || []);
      }

      // Load songs for matching
      const { data: songData, error: songError } = await supabase
        .from('songs')
        .select('id,title,default_key,default_bpm,duration,origin,original_artist')
        .eq('band_id', bandId);

      if (!alive) return;

      if (songError) {
        console.error('Failed to load songs:', songError);
      } else {
        setSongs((songData || []) as SongOption[]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  // Load the assigned setlist with its items
  useEffect(() => {
    if (!setlistId) {
      setAssignedSetlist(null);
      return;
    }

    let alive = true;
    setLoading(true);

    (async () => {
      // Get the setlist
      const { data: setlist, error: setlistError } = await supabase
        .from('setlist_templates')
        .select('*')
        .eq('id', setlistId)
        .maybeSingle();

      if (!alive) return;

      if (setlistError || !setlist) {
        console.error('Failed to load setlist:', setlistError);
        setAssignedSetlist(null);
        setLoading(false);
        return;
      }

      // Get the setlist items
      const { data: items, error: itemsError } = await supabase
        .from('setlist_template_items')
        .select('*')
        .eq('template_id', setlistId)
        .order('order_index');

      if (!alive) return;

      if (itemsError) {
        console.error('Failed to load setlist items:', itemsError);
        setAssignedSetlist({ ...setlist, items: [] });
      } else {
        // Match items to songs by title to get song_id
        const itemsWithSongId: SetlistItemWithSongId[] = (items || []).map((item) => {
          const matchingSong = songs.find(
            (s) => s.title.toLowerCase() === item.title.toLowerCase()
          );
          return {
            ...item,
            song_id: matchingSong?.id || null,
          };
        });
        setAssignedSetlist({ ...setlist, items: itemsWithSongId });
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [setlistId, songs]);

  // Format duration from seconds to mm:ss
  const formatDuration = useCallback((seconds: number | null) => {
    if (!seconds) return null;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate total setlist duration
  const totalDuration = assignedSetlist?.items.reduce((total, item) => {
    return total + (item.duration_seconds || 0);
  }, 0) || 0;

  const formatTotalDuration = useCallback(() => {
    if (totalDuration === 0) return null;
    const mins = Math.floor(totalDuration / 60);
    if (mins < 60) return `${mins} min`;
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return remainingMins > 0 ? `${hours}h ${remainingMins}m` : `${hours}h`;
  }, [totalDuration]);

  return {
    availableSetlists,
    assignedSetlist,
    loading,
    formatDuration,
    totalDuration,
    formatTotalDuration,
  };
}
