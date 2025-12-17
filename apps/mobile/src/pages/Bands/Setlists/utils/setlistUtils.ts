// apps/mobile/src/pages/Bands/Setlists/utils/setlistUtils.ts

import type {
  DetectedLinkType,
  SetlistTemplateItemRow,
} from '../types/setlistTypes';

/**
 * Very small helper to figure out what kind of streaming link this is,
 * plus a nice label for chips/buttons.
 */
export function detectLinkType(url: string): DetectedLinkType {
  const lowerUrl = (url || '').toLowerCase();

  if (lowerUrl.includes('spotify'))
    return { kind: 'spotify', label: 'Spotify' };
  if (lowerUrl.includes('music.apple') || lowerUrl.includes('apple.com'))
    return { kind: 'apple', label: 'Apple Music' };
  if (lowerUrl.includes('tidal')) return { kind: 'tidal', label: 'Tidal' };
  if (lowerUrl.includes('youtube') || lowerUrl.includes('youtu.be'))
    return { kind: 'youtube', label: 'YouTube' };
  if (lowerUrl.includes('soundcloud'))
    return { kind: 'soundcloud', label: 'SoundCloud' };
  if (lowerUrl.includes('deezer')) return { kind: 'deezer', label: 'Deezer' };

  return { kind: 'generic', label: 'Link' };
}

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

/**
 * Format seconds as M:SS (e.g. 245 => "4:05")
 */
export function formatDurationSeconds(seconds?: number | null): string | null {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}
