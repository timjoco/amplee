import {
  checkmarkCircleOutline,
  closeCircleOutline,
  helpCircleOutline,
} from 'ionicons/icons';

export function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

export function fromLocalToIso(val: string | null): string | null {
  if (!val) return null;
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function initialsFromName(
  first?: string | null,
  last?: string | null,
  fallback?: string | null
) {
  const a = (first ?? '').trim();
  const b = (last ?? '').trim();
  const s = [a, b].filter(Boolean).join(' ').trim() || (fallback ?? '').trim();
  if (!s) return '?';
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase() || '?';
}

export function displayNameFromProfile(p: {
  first_name?: string | null;
  last_name?: string | null;
  display_name?: string | null;
}) {
  const firstLast = [p.first_name, p.last_name]
    .filter(Boolean)
    .join(' ')
    .trim();
  const primary = firstLast || p.display_name || 'Unknown';
  const secondary =
    firstLast && p.display_name && p.display_name !== firstLast
      ? p.display_name
      : null;
  return { primary, secondary };
}

export function statusMeta(status: string) {
  if (status === 'accepted') {
    return {
      label: 'Confirmed',
      icon: checkmarkCircleOutline,
      color: 'rgba(52, 211, 153, 0.95)',
      bg: 'rgba(52, 211, 153, 0.08)',
      border: 'rgba(52, 211, 153, 0.25)',
    };
  }
  if (status === 'declined') {
    return {
      label: 'Declined',
      icon: closeCircleOutline,
      color: 'rgba(248, 113, 113, 0.95)',
      bg: 'rgba(248, 113, 113, 0.08)',
      border: 'rgba(248, 113, 113, 0.25)',
    };
  }
  return {
    label: 'Pending',
    icon: helpCircleOutline,
    color: 'rgba(251, 191, 36, 0.95)',
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.25)',
  };
}
