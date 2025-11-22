import type { RawAtt } from '../../hooks/useAttendance';

export type AttendanceCounts = {
  accepted: number;
  total: number;
};

export type AttendanceCacheEntry = {
  mine: RawAtt;
  counts: AttendanceCounts;
  needsSub: boolean;
  subReason: string;
  updatedAt: number;
};

type AttendanceCacheShape = {
  [key: string]: AttendanceCacheEntry;
};

const STORAGE_KEY = 'amplee:eventAttendance:v1';
export const ATTENDANCE_TTL_MS = 2 * 60 * 1000; // 2 minutes

let cache: AttendanceCacheShape | null = null;

function loadStorage() {
  if (cache !== null) return;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      cache = {};
      return;
    }
    const parsed = JSON.parse(raw) as AttendanceCacheShape;
    cache = parsed || {};
  } catch {
    cache = {};
  }
}

function saveStorage() {
  try {
    if (!cache) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function keyFor(eventId: string, userId: string) {
  return `${eventId}:${userId}`;
}

export function getAttendanceCache(
  eventId: string,
  userId: string
): AttendanceCacheEntry | null {
  loadStorage();
  if (!cache) return null;

  const k = keyFor(eventId, userId);
  const entry = cache[k];
  if (!entry) return null;

  const age = Date.now() - entry.updatedAt;
  if (age > ATTENDANCE_TTL_MS) return null;

  return entry;
}

export function setAttendanceCache(
  eventId: string,
  userId: string,
  entry: Omit<AttendanceCacheEntry, 'updatedAt'>
) {
  loadStorage();
  if (!cache) cache = {};

  const k = keyFor(eventId, userId);
  cache[k] = { ...entry, updatedAt: Date.now() };
  saveStorage();
}
