/**
 * Availability helper functions
 * Extracted for testability
 */

export const MAX_NOTE_LENGTH = 100;
export const TRUNCATE_LENGTH = 30;

/**
 * Truncate a note to the display length
 */
export function truncateNote(note: string): string {
  if (note.length <= TRUNCATE_LENGTH) return note;
  return note.slice(0, TRUNCATE_LENGTH).trim() + '...';
}

/**
 * Format a time string (HH:MM:SS or HH:MM) to 12-hour format
 */
export function formatTime(time: string | null): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes}${ampm}`;
}

/**
 * Format a time range for display
 */
export function formatTimeRange(
  allDay: boolean,
  startTime: string | null,
  endTime: string | null
): string {
  if (allDay) return 'All day';
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Format a date key (YYYY-MM-DD) from year, month, day
 */
export function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
    2,
    '0'
  )}`;
}

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the day of week (0-6) for the first day of a month
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Check if two time ranges overlap
 * Returns true if they overlap
 */
export function timeRangesOverlap(
  eventStart: string,
  eventEnd: string | null,
  unavailStart: string | null,
  unavailEnd: string | null,
  isAllDay: boolean
): boolean {
  // If unavailability is all day, there's always a conflict
  if (isAllDay) return true;

  // If no event end time, assume any partial-day conflict matters
  if (!eventEnd) return true;

  // If no unavailability times, assume all day
  if (!unavailStart || !unavailEnd) return true;

  // Check if ranges overlap: they overlap if one starts before the other ends
  // eventStart < unavailEnd AND unavailStart < eventEnd
  return eventStart < unavailEnd && unavailStart < eventEnd;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .filter(Boolean)
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Check if a recurring rule is active on a given date
 */
export function isRuleActiveOnDate(
  ruleStartsOn: string,
  ruleEndsOn: string | null,
  targetDate: string
): boolean {
  const target = new Date(targetDate + 'T00:00:00');
  const startsOn = new Date(ruleStartsOn + 'T00:00:00');
  const endsOn = ruleEndsOn ? new Date(ruleEndsOn + 'T23:59:59') : null;

  if (target < startsOn) return false;
  if (endsOn && target > endsOn) return false;

  return true;
}
