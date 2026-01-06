import { vi } from 'vitest';

export type SubscriptionEvent = {
  channelName: string;
  action: 'create' | 'remove';
  timestamp: number;
};

export type RealtimeCallback = (payload: any) => void;

class SupabaseMockTracker {
  private subscriptionEvents: SubscriptionEvent[] = [];
  private channels: Map<string, { callbacks: Map<string, RealtimeCallback> }> = new Map();

  reset() {
    this.subscriptionEvents = [];
    this.channels.clear();
  }

  recordCreate(channelName: string) {
    this.subscriptionEvents.push({
      channelName,
      action: 'create',
      timestamp: Date.now(),
    });
  }

  recordRemove(channelName: string) {
    this.subscriptionEvents.push({
      channelName,
      action: 'remove',
      timestamp: Date.now(),
    });
  }

  getSubscriptionEvents() {
    return [...this.subscriptionEvents];
  }

  getCreateCount(channelName?: string) {
    return this.subscriptionEvents.filter(
      (e) => e.action === 'create' && (!channelName || e.channelName === channelName)
    ).length;
  }

  getRemoveCount(channelName?: string) {
    return this.subscriptionEvents.filter(
      (e) => e.action === 'remove' && (!channelName || e.channelName === channelName)
    ).length;
  }

  getActiveSubscriptionCount() {
    const creates = this.getCreateCount();
    const removes = this.getRemoveCount();
    return creates - removes;
  }

  // Trigger a realtime event for testing
  triggerRealtimeEvent(channelName: string, table: string, payload: any) {
    const channel = this.channels.get(channelName);
    if (channel) {
      const callback = channel.callbacks.get(table);
      if (callback) {
        callback(payload);
      }
    }
  }

  registerCallback(channelName: string, table: string, callback: RealtimeCallback) {
    if (!this.channels.has(channelName)) {
      this.channels.set(channelName, { callbacks: new Map() });
    }
    this.channels.get(channelName)!.callbacks.set(table, callback);
  }
}

export const mockTracker = new SupabaseMockTracker();

// Create mock channel that tracks subscriptions
export function createTrackedMockChannel(channelName: string) {
  mockTracker.recordCreate(channelName);

  const channelInstance = {
    _name: channelName,
    _handlers: new Map<string, RealtimeCallback>(),

    on(
      event: string,
      config: { event: string; schema: string; table: string; filter?: string },
      callback: RealtimeCallback
    ) {
      this._handlers.set(config.table, callback);
      mockTracker.registerCallback(channelName, config.table, callback);
      return this;
    },

    subscribe(callback?: (status: string) => void) {
      if (callback) callback('SUBSCRIBED');
      return this;
    },
  };

  return channelInstance;
}

// Create the mock supabase object
export function createMockSupabase() {
  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: 'test-user-id' } },
        error: null,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: { user: { id: 'test-user-id' } } },
        error: null,
      }),
    },

    from: vi.fn((table: string) => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
      maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),

    channel: vi.fn((name: string) => createTrackedMockChannel(name)),

    removeChannel: vi.fn((channel: any) => {
      mockTracker.recordRemove(channel._name || 'unknown');
    }),

    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}
