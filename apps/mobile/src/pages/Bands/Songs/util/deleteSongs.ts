import { supabase } from '../../../../lib/supabase';

export async function deleteSongEverywhere(opts: {
  bandId: string;
  songId: string;
  songTitle?: string;
  myUserId: string | null;
  isAdmin: boolean;
}) {
  const { bandId, songId, songTitle, myUserId, isAdmin } = opts;

  if (!myUserId) throw new Error('Not authenticated');
  if (!isAdmin) throw new Error('Only admins can delete songs');
  if (!bandId || !songId) throw new Error('Missing bandId/songId');

  // Optional (recommended): ensure the song belongs to this band
  // Adjust column name if yours differs.
  const { data: song, error: songErr } = await supabase
    .from('songs')
    .select('id, band_id')
    .eq('id', songId)
    .maybeSingle();

  if (songErr) throw songErr;
  if (!song) throw new Error('Song not found');
  if (song.band_id && song.band_id !== bandId) {
    throw new Error('Song does not belong to this band');
  }

  // 1) Remove from ALL event setlists for THIS band
  // This assumes event_setlist_items has band_id OR you can join via event_id (see note below).
  {
    const q = supabase
      .from('event_setlist_items')
      .delete()
      .eq('song_id', songId);

    // If your table has band_id, keep this (recommended)
    q.eq?.('band_id', bandId);

    const { error } = await q;
    if (error) {
      console.warn(
        '[deleteSongEverywhere] delete event_setlist_items failed',
        error
      );
      throw error;
    }
  }

  // 2) Remove from ALL templates for THIS band
  {
    const q = supabase
      .from('setlist_template_items')
      .delete()
      .eq('song_id', songId);

    // If your table has band_id, keep this (recommended)
    q.eq?.('band_id', bandId);

    const { error } = await q;
    if (error) {
      console.warn(
        '[deleteSongEverywhere] delete setlist_template_items failed',
        error
      );
      throw error;
    }
  }

  // 3) Delete song-owned tables (only if you actually have them)
  // await supabase.from('song_notes').delete().eq('song_id', songId);
  // await supabase.from('song_sections').delete().eq('song_id', songId);
  // await supabase.from('song_files').delete().eq('song_id', songId);
  // await supabase.from('song_chords').delete().eq('song_id', songId);

  // 4) Delete the song itself (scoped)
  {
    const q = supabase.from('songs').delete().eq('id', songId);

    // If songs has band_id, keep this extra guard
    q.eq?.('band_id', bandId);

    const { error } = await q;
    if (error) {
      console.warn('[deleteSongEverywhere] delete songs row failed', error);
      throw error;
    }
  }

  window.dispatchEvent(
    new CustomEvent('amplee:song-deleted', {
      detail: { bandId, songId, title: songTitle ?? null },
    })
  );
}
