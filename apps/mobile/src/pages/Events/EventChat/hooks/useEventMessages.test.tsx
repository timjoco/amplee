import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock modules before any imports
vi.mock('../../../../lib/supabase', () => {
  const tracker = {
    created: [] as string[],
    removed: [] as string[],
  };

  // Expose tracker on globalThis for tests to access
  (globalThis as any).__msgSubscriptionTracker = tracker;

  const mockFrom = vi.fn().mockReturnValue({
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
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
    },
  };
});

// Helper to get tracker
function getTracker() {
  return (globalThis as any).__msgSubscriptionTracker as {
    created: string[];
    removed: string[];
  };
}

// Import hook after mocks
import { useEventMessages } from './useEventMessages';

// Helper to create required hook args
function createHookArgs(eventId: string) {
  return {
    eventId,
    profilesById: { current: new Map() },
    messagesRef: { current: [] },
    userRef: { current: { id: 'test-user-id' } },
    loadReactionsFor: vi.fn(),
    fetchPreviewForMessage: vi.fn(),
  };
}

describe('useEventMessages', () => {
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
    const args = createHookArgs('event-123');

    const { rerender } = renderHook(
      ({ args }) => useEventMessages(args),
      { initialProps: { args } }
    );

    await waitFor(() => {
      expect(tracker.created.length).toBe(1);
    });

    // Rerender with same args should NOT create new subscription
    rerender({ args: { ...args } });

    await waitFor(() => {
      expect(tracker.created.length).toBe(1);
    });
  });

  it('should not recreate subscription when callback props change', async () => {
    const tracker = getTracker();
    const args = createHookArgs('event-123');

    const { rerender } = renderHook(
      ({ args }) => useEventMessages(args),
      { initialProps: { args } }
    );

    await waitFor(() => {
      expect(tracker.created.length).toBe(1);
    });

    // Change callback functions (simulating parent re-render)
    const newArgs = {
      ...args,
      fetchPreviewForMessage: vi.fn(),
      loadReactionsFor: vi.fn(),
    };

    rerender({ args: newArgs });

    // Should still have only 1 subscription
    expect(tracker.created.length).toBe(1);
    expect(tracker.removed.length).toBe(0);
  });

  it('should cleanup subscription on unmount', async () => {
    const tracker = getTracker();
    const args = createHookArgs('event-123');

    const { unmount } = renderHook(() => useEventMessages(args));

    await waitFor(() => {
      expect(tracker.created.length).toBe(1);
    });

    unmount();

    expect(tracker.removed.length).toBe(1);
  });

  it('should create new subscription when eventId changes', async () => {
    const tracker = getTracker();
    const args1 = createHookArgs('event-123');
    const args2 = createHookArgs('event-456');

    const { rerender } = renderHook(
      ({ args }) => useEventMessages(args),
      { initialProps: { args: args1 } }
    );

    await waitFor(() => {
      expect(tracker.created.length).toBe(1);
    });

    rerender({ args: args2 });

    await waitFor(() => {
      expect(tracker.removed.length).toBe(1);
      expect(tracker.created.length).toBe(2);
    });
  });
});

describe('useEventMessages subscription stability', () => {
  beforeEach(() => {
    const tracker = getTracker();
    tracker.created = [];
    tracker.removed = [];
    vi.clearAllMocks();
  });

  it('should maintain stable subscription across 100 rerenders with changing callbacks', async () => {
    const tracker = getTracker();
    const args = createHookArgs('event-stable');

    const { rerender } = renderHook(
      ({ args }) => useEventMessages(args),
      { initialProps: { args } }
    );

    await waitFor(() => {
      expect(tracker.created.length).toBe(1);
    });

    // Simulate heavy rerendering with new callback refs each time
    for (let i = 0; i < 100; i++) {
      rerender({
        args: {
          ...args,
          fetchPreviewForMessage: vi.fn(),
          loadReactionsFor: vi.fn(),
        },
      });
    }

    // Should still only have 1 subscription
    expect(tracker.created.length).toBe(1);
    expect(tracker.removed.length).toBe(0);
  });
});
