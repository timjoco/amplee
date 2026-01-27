import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock supabase before importing the module
vi.mock('../supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../supabase';
import { getEventAvailabilityConflicts } from './getEventAvailabilityConflicts';

// Helper to create mock query builder
function createMockQueryBuilder(data: any[] | null, error: any = null) {
  return {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    in: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    then: vi.fn().mockImplementation((resolve) =>
      resolve({ data, error })
    ),
  };
}

describe('getEventAvailabilityConflicts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when no members in band', async () => {
    const mockBuilder = createMockQueryBuilder([]);
    vi.mocked(supabase.from).mockReturnValue(mockBuilder as any);

    const conflicts = await getEventAvailabilityConflicts({
      bandId: 'band-123',
      startsAt: new Date('2026-01-27T20:00:00'),
    });

    expect(conflicts).toEqual([]);
  });

  it('should return empty array when no conflicts exist', async () => {
    // First call: band_members
    const membersBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            user_id: 'user-1',
            role: 'member',
            profiles: { display_name: 'John Doe', first_name: 'John', last_name: 'Doe' },
          },
        ],
        error: null,
      }),
    };

    // Second call: member_availability_dates
    const datesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    };

    // Third call: member_availability_rules
    const rulesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    };

    let callCount = 0;
    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'band_members') return membersBuilder as any;
      if (table === 'member_availability_dates') return datesBuilder as any;
      if (table === 'member_availability_rules') return rulesBuilder as any;
      return createMockQueryBuilder([]) as any;
    });

    const conflicts = await getEventAvailabilityConflicts({
      bandId: 'band-123',
      startsAt: new Date('2026-01-27T20:00:00'),
    });

    expect(conflicts).toEqual([]);
  });

  it('should detect conflict from explicit date entry', async () => {
    const membersBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            user_id: 'user-1',
            role: 'member',
            profiles: { display_name: 'John Doe', first_name: 'John', last_name: 'Doe' },
          },
        ],
        error: null,
      }),
    };

    const datesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            profile_id: 'user-1',
            date: '2026-01-27',
            note: 'Day job',
            all_day: true,
            start_time: null,
            end_time: null,
          },
        ],
        error: null,
      }),
    };

    const rulesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'band_members') return membersBuilder as any;
      if (table === 'member_availability_dates') return datesBuilder as any;
      if (table === 'member_availability_rules') return rulesBuilder as any;
      return createMockQueryBuilder([]) as any;
    });

    const conflicts = await getEventAvailabilityConflicts({
      bandId: 'band-123',
      startsAt: new Date('2026-01-27T20:00:00'),
    });

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      memberId: 'user-1',
      memberName: 'John Doe',
      conflictDate: '2026-01-27',
      note: 'Day job',
      allDay: true,
    });
  });

  it('should detect conflict from recurring rule', async () => {
    // January 27, 2026 is a Tuesday (day_of_week = 2)
    const eventDate = new Date('2026-01-27T20:00:00');

    const membersBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            user_id: 'user-1',
            role: 'member',
            profiles: { display_name: 'Jane Smith' },
          },
        ],
        error: null,
      }),
    };

    const datesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    };

    const rulesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            profile_id: 'user-1',
            day_of_week: 2, // Tuesday
            all_day: false,
            start_time: '09:00:00',
            end_time: '17:00:00',
            note: 'Day job',
            starts_on: '2026-01-01',
            ends_on: null,
          },
        ],
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'band_members') return membersBuilder as any;
      if (table === 'member_availability_dates') return datesBuilder as any;
      if (table === 'member_availability_rules') return rulesBuilder as any;
      return createMockQueryBuilder([]) as any;
    });

    const conflicts = await getEventAvailabilityConflicts({
      bandId: 'band-123',
      startsAt: eventDate,
    });

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0]).toMatchObject({
      memberId: 'user-1',
      memberName: 'Jane Smith',
      note: 'Day job',
      allDay: false,
      startTime: '09:00:00',
      endTime: '17:00:00',
    });
  });

  it('should prefer explicit date over recurring rule', async () => {
    const eventDate = new Date('2026-01-27T20:00:00');

    const membersBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            user_id: 'user-1',
            role: 'member',
            profiles: { display_name: 'John Doe' },
          },
        ],
        error: null,
      }),
    };

    const datesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            profile_id: 'user-1',
            date: '2026-01-27',
            note: 'Doctor appointment',
            all_day: false,
            start_time: '14:00:00',
            end_time: '16:00:00',
          },
        ],
        error: null,
      }),
    };

    const rulesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            profile_id: 'user-1',
            day_of_week: 2,
            all_day: true,
            note: 'Day job',
            starts_on: '2026-01-01',
            ends_on: null,
          },
        ],
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'band_members') return membersBuilder as any;
      if (table === 'member_availability_dates') return datesBuilder as any;
      if (table === 'member_availability_rules') return rulesBuilder as any;
      return createMockQueryBuilder([]) as any;
    });

    const conflicts = await getEventAvailabilityConflicts({
      bandId: 'band-123',
      startsAt: eventDate,
    });

    expect(conflicts).toHaveLength(1);
    // Should use explicit date entry, not the rule
    expect(conflicts[0].note).toBe('Doctor appointment');
    expect(conflicts[0].allDay).toBe(false);
  });

  it('should not include rule if outside active period', async () => {
    const eventDate = new Date('2026-01-27T20:00:00');

    const membersBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            user_id: 'user-1',
            role: 'member',
            profiles: { display_name: 'John Doe' },
          },
        ],
        error: null,
      }),
    };

    const datesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    };

    const rulesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            profile_id: 'user-1',
            day_of_week: 2,
            all_day: true,
            note: 'Old job',
            starts_on: '2025-01-01',
            ends_on: '2025-12-31', // Ended before event date
          },
        ],
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'band_members') return membersBuilder as any;
      if (table === 'member_availability_dates') return datesBuilder as any;
      if (table === 'member_availability_rules') return rulesBuilder as any;
      return createMockQueryBuilder([]) as any;
    });

    const conflicts = await getEventAvailabilityConflicts({
      bandId: 'band-123',
      startsAt: eventDate,
    });

    expect(conflicts).toHaveLength(0);
  });

  it('should only check specified userIds when provided', async () => {
    const membersBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnValue({
        data: [
          {
            user_id: 'user-1',
            role: 'member',
            profiles: { display_name: 'John Doe' },
          },
        ],
        error: null,
      }),
    };

    const datesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            profile_id: 'user-1',
            date: '2026-01-27',
            note: 'Busy',
            all_day: true,
          },
        ],
        error: null,
      }),
    };

    const rulesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'band_members') return membersBuilder as any;
      if (table === 'member_availability_dates') return datesBuilder as any;
      if (table === 'member_availability_rules') return rulesBuilder as any;
      return createMockQueryBuilder([]) as any;
    });

    await getEventAvailabilityConflicts({
      bandId: 'band-123',
      startsAt: new Date('2026-01-27T20:00:00'),
      userIds: ['user-1', 'user-2'],
    });

    // Verify that .in() was called on the members query
    expect(membersBuilder.in).toHaveBeenCalledWith('user_id', ['user-1', 'user-2']);
  });
});

describe('timeRangesOverlap logic', () => {
  // Test the overlap logic through the main function
  it('should detect overlap when event is during unavailable time', async () => {
    const membersBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            user_id: 'user-1',
            role: 'member',
            profiles: { display_name: 'John Doe' },
          },
        ],
        error: null,
      }),
    };

    const datesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            profile_id: 'user-1',
            date: '2026-01-27',
            note: 'Busy',
            all_day: false,
            start_time: '09:00:00',
            end_time: '17:00:00',
          },
        ],
        error: null,
      }),
    };

    const rulesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'band_members') return membersBuilder as any;
      if (table === 'member_availability_dates') return datesBuilder as any;
      if (table === 'member_availability_rules') return rulesBuilder as any;
      return createMockQueryBuilder([]) as any;
    });

    // Event at 2pm (14:00) - during unavailable period
    const conflicts = await getEventAvailabilityConflicts({
      bandId: 'band-123',
      startsAt: new Date('2026-01-27T14:00:00'),
      endsAt: new Date('2026-01-27T16:00:00'),
    });

    expect(conflicts).toHaveLength(1);
  });

  it('should not detect conflict when event is outside unavailable time', async () => {
    const membersBuilder = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            user_id: 'user-1',
            role: 'member',
            profiles: { display_name: 'John Doe' },
          },
        ],
        error: null,
      }),
    };

    const datesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [
          {
            profile_id: 'user-1',
            date: '2026-01-27',
            note: 'Day job',
            all_day: false,
            start_time: '09:00:00',
            end_time: '17:00:00',
          },
        ],
        error: null,
      }),
    };

    const rulesBuilder = {
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnValue({
        data: [],
        error: null,
      }),
    };

    vi.mocked(supabase.from).mockImplementation((table: string) => {
      if (table === 'band_members') return membersBuilder as any;
      if (table === 'member_availability_dates') return datesBuilder as any;
      if (table === 'member_availability_rules') return rulesBuilder as any;
      return createMockQueryBuilder([]) as any;
    });

    // Event at 8pm (20:00) - after unavailable period ends at 5pm
    const conflicts = await getEventAvailabilityConflicts({
      bandId: 'band-123',
      startsAt: new Date('2026-01-27T20:00:00'),
      endsAt: new Date('2026-01-27T23:00:00'),
    });

    expect(conflicts).toHaveLength(0);
  });
});
