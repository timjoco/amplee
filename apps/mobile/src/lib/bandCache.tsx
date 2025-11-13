import type { BandWithRole } from '../types/bands';
import { setAvatarPath } from './eventInboxCache';

type CacheShape = {
  bands: BandWithRole[];
  updatedAt: number; // ms
};

const STORAGE_KEY = 'amplee:bands:v1';
export const BANDS_TTL_MS = 2 * 60 * 1000; // 2 minutes

let cache: CacheShape = { bands: [], updatedAt: 0 };

function loadStorage() {
  try {
    if (typeof window === 'undefined') return;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as CacheShape;
    if (parsed && Array.isArray(parsed.bands)) cache = parsed;
  } catch {}
}

function saveStorage() {
  try {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {}
}

export function getBandsCache(): CacheShape {
  if (cache.updatedAt === 0) loadStorage();
  return cache;
}

export function setBandsCache(bands: BandWithRole[]) {
  cache.bands = bands;
  cache.updatedAt = Date.now();

  // seed avatar storage paths into avatar cache for lazy signing
  for (const b of bands) {
    if (b.avatar_url) setAvatarPath(b.id, b.avatar_url);
  }

  saveStorage();
}

export function needsBandsRefresh(): boolean {
  if (cache.updatedAt === 0) loadStorage();
  return (
    cache.bands.length === 0 || Date.now() - cache.updatedAt > BANDS_TTL_MS
  );
}
