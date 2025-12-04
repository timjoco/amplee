// apps/mobile/src/lib/events/getBandSameDayEvents.ts
import { supabase } from '../supabase';
import type { EventType } from './createEvents';

export type BandSameDayEvent = {
  id: string;
  title: string;
  type: EventType | string;
  startsAt: string;
};

export async function getBandSameDayEvents(params: {
  bandId: string;
  startsAt: Date;
}): Promise<BandSameDayEvent[]> {
  const { bandId, startsAt } = params;

  // If startsAt is borked, just bail
  if (!(startsAt instanceof Date) || Number.isNaN(+startsAt)) {
    return [];
  }

  // Date-only string for the chosen event
  const dateOnly = startsAt.toISOString().slice(0, 10); // YYYY-MM-DD

  // Build an exclusive upper bound: next day
  const nextDay = new Date(startsAt);
  nextDay.setDate(nextDay.getDate() + 1);
  const nextDateOnly = nextDay.toISOString().slice(0, 10); // YYYY-MM-DD

  const { data, error } = await supabase
    .from('events')
    .select('id, title, type, starts_at, is_cancelled')
    .eq('band_id', bandId)
    .gte('starts_at', `${dateOnly}T00:00:00.000Z`)
    .lt('starts_at', `${nextDateOnly}T00:00:00.000Z`);

  if (error) {
    console.error('[getBandSameDayEvents] error', error);
    return [];
  }

  const rows = (data ?? []).filter(
    (row: any) => !row.is_cancelled // ignore cancelled events
  );

  return rows.map((row: any) => ({
    id: String(row.id),
    title: String(row.title ?? 'Untitled event'),
    type: (row.type as EventType | string) ?? 'show',
    startsAt: row.starts_at as string,
  }));
}
