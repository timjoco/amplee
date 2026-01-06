export function computeTimeUntilEvent(startsAt: string | undefined): string | null {
  if (!startsAt) return null;

  const now = new Date();
  const eventDate = new Date(startsAt);
  const diff = eventDate.getTime() - now.getTime();

  if (diff < 0) return null;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m`;
  return 'Soon!';
}

export function formatEventDate(startsAt: string): string {
  return new Date(startsAt).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export function formatEventTime(startsAt: string): string {
  return new Date(startsAt).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}
