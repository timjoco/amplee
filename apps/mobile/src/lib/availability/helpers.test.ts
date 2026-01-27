import { describe, expect, it } from 'vitest';
import {
  truncateNote,
  formatTime,
  formatTimeRange,
  formatDateKey,
  getDaysInMonth,
  getFirstDayOfMonth,
  timeRangesOverlap,
  getInitials,
  isRuleActiveOnDate,
  MAX_NOTE_LENGTH,
  TRUNCATE_LENGTH,
} from './helpers';

describe('truncateNote', () => {
  it('should return short notes unchanged', () => {
    expect(truncateNote('Short note')).toBe('Short note');
    expect(truncateNote('Exactly 30 characters long!!')).toBe('Exactly 30 characters long!!');
  });

  it('should truncate notes longer than 30 characters', () => {
    const longNote = 'This is a very long note that should be truncated';
    const result = truncateNote(longNote);
    expect(result.length).toBeLessThanOrEqual(TRUNCATE_LENGTH + 3); // +3 for "..."
    expect(result).toMatch(/\.\.\.$/);
  });

  it('should handle empty string', () => {
    expect(truncateNote('')).toBe('');
  });

  it('should trim whitespace before adding ellipsis', () => {
    const note = 'This is a note with trailing   spaces here';
    const result = truncateNote(note);
    expect(result).not.toMatch(/\s\.\.\.$/);
  });
});

describe('formatTime', () => {
  it('should format morning times correctly', () => {
    expect(formatTime('09:00:00')).toBe('9:00am');
    expect(formatTime('09:30')).toBe('9:30am');
    expect(formatTime('11:45:00')).toBe('11:45am');
  });

  it('should format afternoon times correctly', () => {
    expect(formatTime('13:00:00')).toBe('1:00pm');
    expect(formatTime('17:30')).toBe('5:30pm');
    expect(formatTime('23:59:00')).toBe('11:59pm');
  });

  it('should handle noon and midnight', () => {
    expect(formatTime('12:00:00')).toBe('12:00pm');
    expect(formatTime('00:00:00')).toBe('12:00am');
  });

  it('should return empty string for null', () => {
    expect(formatTime(null)).toBe('');
  });
});

describe('formatTimeRange', () => {
  it('should return "All day" for all-day events', () => {
    expect(formatTimeRange(true, null, null)).toBe('All day');
    expect(formatTimeRange(true, '09:00', '17:00')).toBe('All day');
  });

  it('should format time range for partial-day events', () => {
    expect(formatTimeRange(false, '09:00:00', '17:00:00')).toBe('9:00am - 5:00pm');
    expect(formatTimeRange(false, '20:00', '23:30')).toBe('8:00pm - 11:30pm');
  });

  it('should handle null times for non-all-day events', () => {
    expect(formatTimeRange(false, null, null)).toBe(' - ');
  });
});

describe('formatDateKey', () => {
  it('should format date key correctly', () => {
    expect(formatDateKey(2026, 0, 1)).toBe('2026-01-01'); // January is 0
    expect(formatDateKey(2026, 11, 25)).toBe('2026-12-25'); // December is 11
    expect(formatDateKey(2026, 0, 27)).toBe('2026-01-27');
  });

  it('should pad single-digit months and days', () => {
    expect(formatDateKey(2026, 0, 5)).toBe('2026-01-05');
    expect(formatDateKey(2026, 8, 9)).toBe('2026-09-09');
  });
});

describe('getDaysInMonth', () => {
  it('should return correct days for each month', () => {
    expect(getDaysInMonth(2026, 0)).toBe(31); // January
    expect(getDaysInMonth(2026, 1)).toBe(28); // February (non-leap year)
    expect(getDaysInMonth(2024, 1)).toBe(29); // February (leap year)
    expect(getDaysInMonth(2026, 3)).toBe(30); // April
    expect(getDaysInMonth(2026, 11)).toBe(31); // December
  });
});

describe('getFirstDayOfMonth', () => {
  it('should return correct day of week (0=Sunday)', () => {
    // January 1, 2026 is a Thursday (4)
    expect(getFirstDayOfMonth(2026, 0)).toBe(4);
    // February 1, 2026 is a Sunday (0)
    expect(getFirstDayOfMonth(2026, 1)).toBe(0);
  });
});

describe('timeRangesOverlap', () => {
  it('should always overlap when unavailability is all day', () => {
    expect(timeRangesOverlap('09:00:00', '17:00:00', null, null, true)).toBe(true);
    expect(timeRangesOverlap('20:00:00', '23:00:00', '09:00:00', '17:00:00', true)).toBe(true);
  });

  it('should always overlap when event has no end time', () => {
    expect(timeRangesOverlap('14:00:00', null, '09:00:00', '17:00:00', false)).toBe(true);
  });

  it('should always overlap when unavailability has no times', () => {
    expect(timeRangesOverlap('14:00:00', '16:00:00', null, null, false)).toBe(true);
    expect(timeRangesOverlap('14:00:00', '16:00:00', null, '17:00:00', false)).toBe(true);
    expect(timeRangesOverlap('14:00:00', '16:00:00', '09:00:00', null, false)).toBe(true);
  });

  it('should detect overlapping time ranges', () => {
    // Event 2pm-4pm, unavailable 1pm-5pm -> overlap
    expect(timeRangesOverlap('14:00:00', '16:00:00', '13:00:00', '17:00:00', false)).toBe(true);
    // Event 2pm-4pm, unavailable 3pm-5pm -> overlap
    expect(timeRangesOverlap('14:00:00', '16:00:00', '15:00:00', '17:00:00', false)).toBe(true);
    // Event 2pm-4pm, unavailable 12pm-3pm -> overlap
    expect(timeRangesOverlap('14:00:00', '16:00:00', '12:00:00', '15:00:00', false)).toBe(true);
  });

  it('should detect non-overlapping time ranges', () => {
    // Event 8pm-11pm, unavailable 9am-5pm -> no overlap
    expect(timeRangesOverlap('20:00:00', '23:00:00', '09:00:00', '17:00:00', false)).toBe(false);
    // Event 6am-8am, unavailable 9am-5pm -> no overlap
    expect(timeRangesOverlap('06:00:00', '08:00:00', '09:00:00', '17:00:00', false)).toBe(false);
  });

  it('should handle edge cases at boundaries', () => {
    // Event ends exactly when unavailability starts -> no overlap
    expect(timeRangesOverlap('06:00:00', '09:00:00', '09:00:00', '17:00:00', false)).toBe(false);
    // Event starts exactly when unavailability ends -> no overlap
    expect(timeRangesOverlap('17:00:00', '20:00:00', '09:00:00', '17:00:00', false)).toBe(false);
  });
});

describe('getInitials', () => {
  it('should get initials from full name', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Jane Mary Smith')).toBe('JM'); // Limited to 2
  });

  it('should handle single names', () => {
    expect(getInitials('John')).toBe('J');
  });

  it('should handle empty strings', () => {
    expect(getInitials('')).toBe('');
  });

  it('should uppercase initials', () => {
    expect(getInitials('john doe')).toBe('JD');
  });
});

describe('isRuleActiveOnDate', () => {
  it('should return true when date is after start and no end', () => {
    expect(isRuleActiveOnDate('2026-01-01', null, '2026-01-27')).toBe(true);
    expect(isRuleActiveOnDate('2026-01-01', null, '2030-12-31')).toBe(true);
  });

  it('should return true when date is within active period', () => {
    expect(isRuleActiveOnDate('2026-01-01', '2026-12-31', '2026-06-15')).toBe(true);
    expect(isRuleActiveOnDate('2026-01-01', '2026-01-31', '2026-01-27')).toBe(true);
  });

  it('should return false when date is before start', () => {
    expect(isRuleActiveOnDate('2026-02-01', null, '2026-01-27')).toBe(false);
  });

  it('should return false when date is after end', () => {
    expect(isRuleActiveOnDate('2025-01-01', '2025-12-31', '2026-01-27')).toBe(false);
  });

  it('should include dates on boundaries', () => {
    expect(isRuleActiveOnDate('2026-01-27', '2026-01-27', '2026-01-27')).toBe(true);
    expect(isRuleActiveOnDate('2026-01-27', null, '2026-01-27')).toBe(true);
  });
});

describe('constants', () => {
  it('should have correct values', () => {
    expect(MAX_NOTE_LENGTH).toBe(100);
    expect(TRUNCATE_LENGTH).toBe(30);
  });
});
