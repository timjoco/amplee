import type { BandLite } from '../types';

/**
 * Merge new/updated bands into an existing list, deduping by `id`.
 * “Last write wins” for name/avatar_url, then sort alphabetically.
 */
export function mergeLocalBands(
  prev: BandLite[],
  next: BandLite[]
): BandLite[] {
  const map = new Map<string, BandLite>();

  for (const b of prev ?? []) {
    if (!b?.id) continue;
    map.set(b.id, b);
  }

  for (const b of next ?? []) {
    if (!b?.id) continue;
    const existing = map.get(b.id);
    map.set(b.id, { ...(existing ?? {}), ...b });
  }

  return Array.from(map.values()).sort((a, b) =>
    (a.name ?? '').localeCompare(b.name ?? '')
  );
}
