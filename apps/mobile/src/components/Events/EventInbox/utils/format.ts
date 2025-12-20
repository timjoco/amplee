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
