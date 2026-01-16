import { supabase } from '../supabase';

export type ProfileLite = {
  id: string;
  display_name?: string | null;
  avatar_url?: string | null;
  updated_at?: string | null;
};

const STORAGE_KEY = 'amplee:profile-cache';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_ENTRIES = 100;

type CachedProfile = ProfileLite & { cachedAt: number };

// In-memory cache
const memoryCache = new Map<string, CachedProfile>();

// Pending fetches to avoid duplicate requests
const pendingFetches = new Map<string, Promise<ProfileLite | null>>();

// Load from localStorage on module init
function loadFromStorage(): void {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;

    const entries = JSON.parse(stored) as [string, CachedProfile][];
    const now = Date.now();

    for (const [key, value] of entries) {
      if (now - value.cachedAt < CACHE_TTL_MS) {
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
      const entries: [string, CachedProfile][] = [];

      for (const [key, value] of memoryCache) {
        if (now - value.cachedAt < CACHE_TTL_MS) {
          entries.push([key, value]);
        }
      }

      // Keep only most recent entries if over limit
      if (entries.length > MAX_CACHE_ENTRIES) {
        entries.sort((a, b) => b[1].cachedAt - a[1].cachedAt);
        entries.length = MAX_CACHE_ENTRIES;
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    } catch {
      // Ignore storage errors
    }
  }, 1000);
}

// Initialize cache from storage
loadFromStorage();

// Get profile from cache (sync)
export function getProfileSync(userId: string): ProfileLite | null {
  const cached = memoryCache.get(userId);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return cached;
  }
  return null;
}

// Set profile in cache
export function setProfile(profile: ProfileLite): void {
  const cached: CachedProfile = {
    ...profile,
    cachedAt: Date.now(),
  };
  memoryCache.set(profile.id, cached);
  saveToStorage();
}

// Set multiple profiles at once (from initial load)
export function setProfiles(profiles: ProfileLite[]): void {
  const now = Date.now();
  for (const profile of profiles) {
    memoryCache.set(profile.id, { ...profile, cachedAt: now });
  }
  saveToStorage();
}

// Fetch single profile (with deduplication)
export async function fetchProfile(userId: string): Promise<ProfileLite | null> {
  // Check cache first
  const cached = getProfileSync(userId);
  if (cached) return cached;

  // Check if already fetching
  const pending = pendingFetches.get(userId);
  if (pending) return pending;

  // Fetch from DB
  const fetchPromise = (async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, avatar_url, updated_at')
        .eq('id', userId)
        .single();

      if (error || !data) return null;

      const profile: ProfileLite = data;
      setProfile(profile);
      return profile;
    } finally {
      pendingFetches.delete(userId);
    }
  })();

  pendingFetches.set(userId, fetchPromise);
  return fetchPromise;
}

// Batch fetch profiles (for preloading)
export async function fetchProfiles(userIds: string[]): Promise<Map<string, ProfileLite>> {
  const result = new Map<string, ProfileLite>();
  const idsToFetch: string[] = [];

  // Check cache first
  for (const id of userIds) {
    const cached = getProfileSync(id);
    if (cached) {
      result.set(id, cached);
    } else {
      idsToFetch.push(id);
    }
  }

  if (idsToFetch.length === 0) return result;

  // Batch fetch from DB
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url, updated_at')
    .in('id', idsToFetch);

  if (!error && data) {
    for (const profile of data) {
      setProfile(profile);
      result.set(profile.id, profile);
    }
  }

  return result;
}
