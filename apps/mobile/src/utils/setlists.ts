// apps/mobile/src/utils/setlists.ts

// ---------- Core row types from Supabase ----------

export type SetlistTemplateRow = {
  id: string;
  band_id: string;
  name: string;
  created_at: string | null;
};

export type SetlistTemplateItemRow = {
  id: string;
  template_id: string;
  order_index: number;
  title: string;
  musical_key: string | null;
  bpm: number | null;
  notes: string | null;
};

export type SetlistTemplateLinkRow = {
  id: string;
  template_id: string;
  url: string;
  label: string | null;
  created_at: string | null;
};

export type SongOption = {
  id: string;
  title: string;
  default_key: string | null;
  default_bpm: number | null;
};

// ---------- Link helpers ----------

export type LinkProvider =
  | 'spotify'
  | 'apple'
  | 'tidal'
  | 'youtube'
  | 'soundcloud'
  | 'deezer'
  | 'generic';

export type DetectedLinkType = {
  kind: LinkProvider;
  label: string;
};

/**
 * Very small helper to figure out what kind of streaming link this is,
 * plus a nice label for chips/buttons.
 */
export function detectLinkType(url: string): DetectedLinkType {
  const lowerUrl = (url || '').toLowerCase();

  if (lowerUrl.includes('spotify')) {
    return { kind: 'spotify', label: 'Spotify' };
  }
  if (lowerUrl.includes('music.apple') || lowerUrl.includes('apple.com')) {
    return { kind: 'apple', label: 'Apple Music' };
  }
  if (lowerUrl.includes('tidal')) {
    return { kind: 'tidal', label: 'Tidal' };
  }
  if (lowerUrl.includes('youtube') || lowerUrl.includes('youtu.be')) {
    return { kind: 'youtube', label: 'YouTube' };
  }
  if (lowerUrl.includes('soundcloud')) {
    return { kind: 'soundcloud', label: 'SoundCloud' };
  }
  if (lowerUrl.includes('deezer')) {
    return { kind: 'deezer', label: 'Deezer' };
  }

  return { kind: 'generic', label: 'Link' };
}

// ---------- Items helpers ----------

/**
 * Ensure items are ordered by order_index and re-numbered sequentially.
 * Good to use after inserts/deletes.
 */
export function normalizeTemplateItems(
  rows: SetlistTemplateItemRow[] | null
): SetlistTemplateItemRow[] {
  if (!rows || rows.length === 0) return [];
  return [...rows]
    .sort((a, b) => a.order_index - b.order_index)
    .map((row, i) => ({
      ...row,
      order_index: i,
    }));
}

/**
 * Rough estimate for total set duration by song count.
 * Defaults to ~4 min/song and rounds to nearest 5 minutes.
 */
export function estimateSetDurationMinutes(
  songCount: number,
  avgSongMinutes = 4
): number {
  if (songCount <= 0) return 0;
  const raw = songCount * avgSongMinutes;
  return Math.round(raw / 5) * 5;
}
