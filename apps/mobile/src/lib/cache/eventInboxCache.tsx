type LastMsg = { event_id: string; body: string; created_at: string };

export type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice';
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  is_cancelled: boolean;
  is_booked: boolean;
  my_event_status: 'pending' | 'confirmed' | 'cancelled';
  bands: { id: string; name: string; avatar_url: string | null } | null;
  archived_at?: string | null;
};

// 🔧 allow null path
type AvatarEntry = { path: string | null; signedUrl?: string; exp?: number };

type CacheShape = {
  events: EventRow[];
  lastMsgs: Record<string, LastMsg | undefined>;
  avatars: Record<string, AvatarEntry>;
  updatedAt: number; // ms
};

// 🔧 bump key to flush old bad data (optional but recommended)
const STORAGE_KEY = 'amplee:eventInbox:v2';

export const EVENTS_TTL_MS = 2 * 60 * 1000;
let cache: CacheShape = { events: [], lastMsgs: {}, avatars: {}, updatedAt: 0 };

// ---- storage helpers ----
function loadStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as CacheShape;
    if (parsed && Array.isArray(parsed.events)) cache = parsed;
  } catch {}
}
function saveStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {}
}

export function getCache(): CacheShape {
  if (cache.updatedAt === 0) loadStorage();
  return cache;
}

export function setEvents(list: EventRow[]) {
  cache.events = list;
  cache.updatedAt = Date.now();
  saveStorage();
}

export function upsertLastMsg(msg: LastMsg) {
  const cur = cache.lastMsgs[msg.event_id];
  if (!cur || new Date(msg.created_at) > new Date(cur.created_at)) {
    cache.lastMsgs[msg.event_id] = msg;
    saveStorage();
  }
}

export function setLastMsgsBulk(map: Record<string, LastMsg>) {
  cache.lastMsgs = { ...cache.lastMsgs, ...map };
  saveStorage();
}

// 🔧 PATH-AWARE: reset signedUrl when the path changes
export function setAvatarPath(bandId: string, path: string | null) {
  // no path → drop avatar entry entirely
  if (!path) {
    if (cache.avatars[bandId]) {
      delete cache.avatars[bandId];
      saveStorage();
    }
    return;
  }

  const prev = cache.avatars[bandId];

  // If path is unchanged, keep the existing signedUrl
  if (prev && prev.path === path) {
    return;
  }

  // Path changed → clear signedUrl so it will be recomputed
  cache.avatars[bandId] = {
    path,
    signedUrl: undefined,
    exp: 0,
  };
  saveStorage();
}

export function setAvatarSigned(
  bandId: string,
  path: string,
  signedUrl: string,
  ttlSeconds: number
) {
  const exp = Date.now() + ttlSeconds * 1000 - 3_000;

  cache.avatars[bandId] = {
    path, //  always store the path this signed URL corresponds to
    signedUrl,
    exp,
  };
  saveStorage();
}

//  path-aware getter: only returns if it matches the current path
export function getAvatarSigned(
  bandId: string,
  path?: string | null
): string | undefined {
  const a = cache.avatars[bandId];
  if (!a?.signedUrl) return undefined;

  // If caller provides a path, enforce match (prevents stale avatar after change)
  if (path && a.path && a.path !== path) return undefined;

  if (!a.exp || Date.now() > a.exp) {
    // expired → clear signedUrl but keep path
    cache.avatars[bandId] = {
      path: a.path ?? null,
      signedUrl: undefined,
      exp: 0,
    };
    saveStorage();
    return undefined;
  }

  return a.signedUrl;
}

export function needsEventRefresh(): boolean {
  return (
    Date.now() - cache.updatedAt > EVENTS_TTL_MS || cache.events.length === 0
  );
}
