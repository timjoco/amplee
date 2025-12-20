import type { EventRow } from '../../../lib/cache/eventInboxCache';

export type { EventRow };

// Keep this here so UI + hook share the same shape
export type LastMsg = { event_id: string; body: string; created_at: string };

export type InboxScope = 'home' | 'band';
