import { vi, beforeEach } from 'vitest';
import '@testing-library/react';

// Track subscription creation for testing
export const subscriptionTracker = {
  created: [] as string[],
  removed: [] as string[],
  reset() {
    this.created = [];
    this.removed = [];
  },
};

// Create a chainable mock for Supabase realtime
export function createMockChannel(channelName: string) {
  subscriptionTracker.created.push(channelName);

  const channelInstance = {
    _name: channelName,
    on: vi.fn().mockReturnThis(),
    subscribe: vi.fn().mockReturnThis(),
  };

  return channelInstance;
}

// Reset mocks before each test
beforeEach(() => {
  subscriptionTracker.reset();
  vi.clearAllMocks();
});
