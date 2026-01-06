import type { Option } from './types';

export function toLocalInputValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';

  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());

  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function sortOptionsByDate(options: Option[]): Option[] {
  return [...options].sort((a, b) => {
    const dateA = new Date(a.starts_at).getTime();
    const dateB = new Date(b.starts_at).getTime();
    return dateA - dateB;
  });
}

export function formatDateLabel(iso: string): string {
  const dt = new Date(iso);
  return dt.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatShortDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
