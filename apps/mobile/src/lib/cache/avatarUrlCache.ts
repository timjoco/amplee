import { supabase } from '../supabase';

type CachedUrl = {
  url: string;
  expiresAt: number; // timestamp in ms
};

const STORAGE_KEY = 'amplee:avatar-url-cache';
const URL_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours (signed URLs valid for 7 days, refresh early)
const MAX_CACHE_ENTRIES = 200;

// In-memory cache (fast lookups)
const memoryCache = new Map<string, CachedUrl>();
const preloadedImages = new Set<string>();

// Load from localStorage on module init
function loadFromStorage(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const entries = JSON.parse(stored) as [string, CachedUrl][];
    const now = Date.now();

    for (const [key, value] of entries) {
      // Only load non-expired entries
      if (value.expiresAt > now) {
        memoryCache.set(key, value);
      }
    }
  } catch {
    // Ignore parse errors
  }
}

// Persist to localStorage (debounced)
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
function saveToStorage(): void {
  if (saveTimeout) return;

  saveTimeout = setTimeout(() => {
    saveTimeout = null;
    try {
      const now = Date.now();
      const entries: [string, CachedUrl][] = [];

      // Only save non-expired entries, limit size
      for (const [key, value] of memoryCache) {
        if (value.expiresAt > now) {
          entries.push([key, value]);
        }
      }

      // Keep only most recent entries if over limit
      if (entries.length > MAX_CACHE_ENTRIES) {
        entries.sort((a, b) => b[1].expiresAt - a[1].expiresAt);
        entries.length = MAX_CACHE_ENTRIES;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore storage errors (quota exceeded, etc.)
    }
  }, 1000);
}

// Initialize cache from storage
loadFromStorage();

function isFullUrl(value: string | null | undefined): boolean {
  return (
    !!value && (value.startsWith('http://') || value.startsWith('https://'))
  );
}

// Preload image to force browser caching
function preloadImage(url: string): Promise<void> {
  if (preloadedImages.has(url)) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      preloadedImages.add(url);
      resolve();
    };
    img.onerror = () => {
      // Still resolve to not block the flow
      resolve();
    };
    img.src = url;
  });
}

// Synchronous cache lookup (for components that need immediate result)
export function getAvatarUrlSync(
  bucket: string,
  path: string | null | undefined
): string | null {
  if (!bucket || !path) return null;
  if (isFullUrl(path)) return path;

  let normalizedPath = path;
  if (normalizedPath.startsWith(`${bucket}/`)) {
    normalizedPath = normalizedPath.slice(bucket.length + 1);
  }

  const key = `${bucket}:${normalizedPath}`;
  const cached = memoryCache.get(key);

  if (cached && cached.expiresAt > Date.now()) {
    return cached.url;
  }

  return null;
}

export async function getAvatarUrl(
  bucket: string,
  path: string | null | undefined
): Promise<string | null> {
  if (!bucket || !path) return null;

  // 0) If it's already a full URL, just use it
  if (isFullUrl(path)) {
    preloadImage(path);
    return path;
  }

  // 1) Normalize path so we don't send "bucket/bucket/..."
  let normalizedPath = path;
  if (normalizedPath.startsWith(`${bucket}/`)) {
    normalizedPath = normalizedPath.slice(bucket.length + 1);
  }

  const key = `${bucket}:${normalizedPath}`;
  const now = Date.now();

  // 2) Check memory cache (includes localStorage data)
  const cached = memoryCache.get(key);
  if (cached && cached.expiresAt > now) {
    preloadImage(cached.url);
    return cached.url;
  }

  // 3) Fetch signed URL from Supabase
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(normalizedPath, 60 * 60 * 24 * 7); // 7 days

  if (error || !data?.signedUrl) {
    console.warn('[avatar signedUrl error]', {
      error,
      bucket,
      rawPath: path,
      normalizedPath,
    });
    return null;
  }

  const url = data.signedUrl;
  const cacheEntry: CachedUrl = {
    url,
    expiresAt: now + URL_TTL_MS,
  };

  memoryCache.set(key, cacheEntry);
  saveToStorage();

  preloadImage(url);

  return url;
}

// Clear expired entries (can be called periodically)
export function pruneAvatarCache(): void {
  const now = Date.now();
  for (const [key, value] of memoryCache) {
    if (value.expiresAt <= now) {
      memoryCache.delete(key);
    }
  }
  saveToStorage();
}
