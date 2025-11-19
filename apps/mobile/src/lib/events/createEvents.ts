// apps/mobile/src/lib/events/createEvent.ts
import { supabase } from '../supabase';

export type EventType = 'show' | 'practice';

export type CreateEventInput = {
  bandId: string;
  title: string;
  type: EventType;
  startsAt: Date;
  endsAt?: Date | null;
  location?: string | null;
  notes?: string | null;
  dispatchEvent?: boolean;
};

/** Nice-to-read errors for UI */
function fmtErr(e: unknown): string {
  if (!e) return 'Unknown error';
  if (typeof e === 'string') return e;
  if (typeof e === 'object') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const anyE = e as any;
    return (
      anyE.message ||
      anyE.error_description ||
      anyE.error ||
      anyE.hint ||
      JSON.stringify(anyE)
    );
  }
  return String(e);
}

/** Create an event and return its id */
export async function createEvent(input: CreateEventInput): Promise<string> {
  const {
    bandId,
    title,
    type,
    startsAt,
    endsAt = null,
    location = null,
    notes = null,
    dispatchEvent = true,
  } = input;

  // auth check
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  const trimmed = title.trim();
  if (!trimmed) throw new Error('Title is required.');
  if (!bandId) throw new Error('bandId is required.');
  if (!(startsAt instanceof Date) || Number.isNaN(+startsAt)) {
    throw new Error('startsAt must be a valid Date.');
  }
  if (endsAt && (!(endsAt instanceof Date) || Number.isNaN(+endsAt))) {
    throw new Error('endsAt must be a valid Date if provided.');
  }

  const payload = {
    band_id: bandId,
    title: trimmed,
    type, // enum: 'show' | 'practice'
    starts_at: startsAt.toISOString(),
    ends_at: endsAt ? endsAt.toISOString() : null,
    location,
    notes,
    created_by: user.id,
  };

  const { data, error } = await supabase
    .from('events')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw new Error(fmtErr(error));

  const id = String(data!.id);

  // Optional broadcast to local app
  if (dispatchEvent && typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('events:created', { detail: { id, ...payload } })
    );
  }

  return id;
}
