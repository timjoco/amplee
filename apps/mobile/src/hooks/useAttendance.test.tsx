import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Inline subscription tracker to avoid dynamic require issues
const subscriptionTracker = {
  created: [] as string[],
  removed: [] as string[],
  reset() {
    this.created = [];
    this.removed = [];
  },
  getCreateCount() {
    return this.created.length;
  },
  getRemoveCount() {
    return this.removed.length;
  },
  getActiveSubscriptionCount() {
    return this.created.length - this.removed.length;
  },
};

// Mock modules before any imports
vi.mock('../lib/supabase', () => {
  const tracker = {
    created: [] as string[],
    removed: [] as string[],
  };

  // Expose tracker on globalThis for tests to access
  (globalThis as any).__subscriptionTracker = tracker;

  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({
      data: { status: 'pending', needs_sub: false, sub_reason: '' },
      error: null,
    }),
    maybeSingle: vi.fn().mockResolvedValue({
      data: { status: 'pending', needs_sub: false, sub_reason: '' },
      error: null,
    }),
  });

  return {
    supabase: {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'test-user-id' } },
          error: null,
        }),
      },
      from: mockFrom,
      channel: vi.fn((name: string) => {
        tracker.created.push(name);
        return {
          _name: name,
          on: vi.fn().mockReturnThis(),
          subscribe: vi.fn().mockReturnThis(),
        };
      }),
      removeChannel: vi.fn((channel: any) => {
        tracker.removed.push(channel._name || 'unknown');
      }),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    },
  };
});

vi.mock('../lib/cache/eventAttendanceCache', () => ({
  getAttendanceCache: vi.fn().mockReturnValue(null),
  setAttendanceCache: vi.fn(),
}));

// Helper to get tracker from globalThis
function getTracker() {
  return (globalThis as any).__subscriptionTracker as {
    created: string[];
    removed: string[];
  };
}

// Import hook after mocks
import { useAttendance } from './useAttendance';

describe('useAttendance', () => {
  beforeEach(() => {
    const tracker = getTracker();
    tracker.created = [];
    tracker.removed = [];
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create only one subscription per eventId', async () => {
    const tracker = getTracker();

    const { rerender } = renderHook(
      ({ eventId }) => useAttendance(eventId),
      { initialProps: { eventId: 'event-123' } }
    );

    await waitFor(() => {
      expect(tracker.created.length).toBe(1);
    });

    // Rerender with same eventId should NOT create new subscription
    rerender({ eventId: 'event-123' });

    await waitFor(() => {
      expect(tracker.created.length).toBe(1);
    });
  });

  it('should cleanup subscription on unmount', async () => {
    const tracker = getTracker();

    const { unmount } = renderHook(() => useAttendance('event-123'));

    await waitFor(() => {
      expect(tracker.created.length).toBe(1);
    });

    unmount();

    expect(tracker.removed.length).toBe(1);
  });

  it('should not recreate subscription on multiple rerenders', async () => {
    const tracker = getTracker();

    const { rerender } = renderHook(() => useAttendance('event-123'));

    await waitFor(() => {
      expect(tracker.created.length).toBe(1);
    });

    // Force multiple rerenders
    for (let i = 0; i < 5; i++) {
      rerender();
    }

    // Should still only have 1 subscription
    expect(tracker.created.length).toBe(1);
    expect(tracker.removed.length).toBe(0);
  });

  it('should create new subscription when eventId changes', async () => {
    const tracker = getTracker();

    const { rerender } = renderHook(
      ({ eventId }) => useAttendance(eventId),
      { initialProps: { eventId: 'event-123' } }
    );

    await waitFor(() => {
      expect(tracker.created.length).toBe(1);
    });

    // Change eventId
    rerender({ eventId: 'event-456' });

    await waitFor(() => {
      expect(tracker.removed.length).toBe(1);
      expect(tracker.created.length).toBe(2);
    });
  });
});

describe('useAttendance subscription stability', () => {
  beforeEach(() => {
    const tracker = getTracker();
    tracker.created = [];
    tracker.removed = [];
    vi.clearAllMocks();
  });

  it('should maintain stable subscription across 100 rerenders', async () => {
    const tracker = getTracker();

    const { rerender } = renderHook(() => useAttendance('event-stable'));

    await waitFor(() => {
      expect(tracker.created.length).toBe(1);
    });

    for (let i = 0; i < 100; i++) {
      rerender();
    }

    expect(tracker.created.length).toBe(1);
    expect(tracker.removed.length).toBe(0);
  });
});
