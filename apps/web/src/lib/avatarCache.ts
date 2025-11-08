// src/lib/avatarCache.ts
import { supabaseBrowser } from './supabaseClient';

type CacheVal = { url: string; exp: number; version?: string | number };
const cache = new Map<string, CacheVal>();

function key(bucket: string, path: string, version?: string | number) {
  return `${bucket}::${path}::${version ?? ''}`;
}

/** Get a stable URL for a private Storage path with local cache. */
export async function getSignedAvatarUrl(
  bucket: string,
  path: string,
  ttlSec = 3600,
  version?: string | number
) {
  const k = key(bucket, path, version);
  const now = Date.now();
  const hit = cache.get(k);
  if (hit && hit.exp > now + 5000) return hit.url; // 5s grace

  const sb = supabaseBrowser();
  const { data, error } = await sb.storage
    .from(bucket)
    .createSignedUrl(path, ttlSec);
  if (error || !data?.signedUrl) return undefined;

  cache.set(k, { url: data.signedUrl, exp: now + ttlSec * 1000, version });
  return data.signedUrl;
}

/** Warm the cache (doesn't throw). */
export async function prewarmSignedAvatarUrl(
  bucket: string,
  path?: string | null,
  ttlSec = 3600,
  version?: string | number
) {
  if (!bucket || !path) return;
  try {
    await getSignedAvatarUrl(bucket, path, ttlSec, version);
  } catch {}
}
