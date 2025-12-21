import { EventRow } from '../types';

export function getRelativeTime(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();

  // difference in days (local)
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  if (diffDays > 1 && diffDays <= 7) {
    return date.toLocaleDateString(undefined, { weekday: 'short' });
  }

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function formatEventTime(startsAt?: string | null): string | null {
  if (!startsAt) return null;

  const d = new Date(startsAt);
  const now = new Date();

  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  // Show time for events within ±1 day
  if (diffDays >= -1 && diffDays <= 1) {
    return d.toLocaleTimeString(undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  return null;
}

export function isPastEvent(startsAt?: string | null): boolean {
  if (!startsAt) return false;
  const ts = new Date(startsAt).getTime();
  return ts > 0 && ts < Date.now();
}

export function toTs(s?: string | null): number {
  return s ? new Date(s).getTime() : Number.POSITIVE_INFINITY;
}

export function checkTimeConflict(
  event: EventRow,
  allEvents: EventRow[]
): boolean {
  if (!event.starts_at) return false;

  const eventStart = new Date(event.starts_at).getTime();
  // Default to 2 hours if no end time
  const eventEnd = event.ends_at
    ? new Date(event.ends_at).getTime()
    : eventStart + 2 * 60 * 60 * 1000;

  return allEvents.some((other) => {
    // Skip self
    if (other.id === event.id) return false;

    // Skip if missing start time
    if (!other.starts_at) return false;

    const otherStart = new Date(other.starts_at).getTime();
    // Default to 2 hours if no end time
    const otherEnd = other.ends_at
      ? new Date(other.ends_at).getTime()
      : otherStart + 2 * 60 * 60 * 1000;

    // Check for time overlap
    return eventStart < otherEnd && eventEnd > otherStart;
  });
}

export function getConflictGroups(
  events: EventRow[]
): Map<string, Set<string>> {
  const directConflicts = new Map<string, Set<string>>();

  // First pass: find all direct conflicts
  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    if (!event.starts_at) continue;

    const eventStart = new Date(event.starts_at).getTime();
    const eventEnd = event.ends_at
      ? new Date(event.ends_at).getTime()
      : eventStart + 2 * 60 * 60 * 1000;

    for (let j = i + 1; j < events.length; j++) {
      const other = events[j];
      if (!other.starts_at) continue;

      const otherStart = new Date(other.starts_at).getTime();
      const otherEnd = other.ends_at
        ? new Date(other.ends_at).getTime()
        : otherStart + 2 * 60 * 60 * 1000;

      // Check for overlap
      if (eventStart < otherEnd && eventEnd > otherStart) {
        if (!directConflicts.has(event.id)) {
          directConflicts.set(event.id, new Set());
        }
        if (!directConflicts.has(other.id)) {
          directConflicts.set(other.id, new Set());
        }
        directConflicts.get(event.id)!.add(other.id);
        directConflicts.get(other.id)!.add(event.id);
      }
    }
  }

  // Second pass: merge transitive conflicts
  const groups = new Map<string, Set<string>>();
  const visited = new Set<string>();

  for (const eventId of directConflicts.keys()) {
    if (visited.has(eventId)) continue;

    // BFS to find all connected events
    const queue = [eventId];
    const group = new Set<string>();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (visited.has(current)) continue;

      visited.add(current);
      group.add(current);

      const conflicts = directConflicts.get(current);
      if (conflicts) {
        for (const conflictId of conflicts) {
          if (!visited.has(conflictId)) {
            queue.push(conflictId);
          }
        }
      }
    }

    // Only store groups with 2+ events
    if (group.size > 1) {
      for (const id of group) {
        groups.set(id, group);
      }
    }
  }

  return groups;
}
