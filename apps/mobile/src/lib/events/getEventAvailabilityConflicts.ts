// apps/mobile/src/lib/events/getEventAvailabilityConflicts.ts
import { supabase } from '../supabase';

export type AvailabilityStatus = 'open' | 'limited' | 'unavailable';

export type EventAvailabilityConflictReason =
  | 'status_unavailable'
  | 'away_until';

export type EventAvailabilityConflict = {
  profileId: string;
  name: string;
  status: AvailabilityStatus;
  statusNote: string | null;
  awayUntil: string | null;
  reason: EventAvailabilityConflictReason;
};

/**
 * Given a band and an event start time, return any members who might have conflicts
 * based on their profile availability.
 */
export async function getEventAvailabilityConflicts(params: {
  bandId: string;
  startsAt: Date;
}): Promise<EventAvailabilityConflict[]> {
  const { bandId, startsAt } = params;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');

  // 1) Band members → user_ids
  const { data: members, error: membersErr } = await supabase
    .from('band_members')
    .select('user_id')
    .eq('band_id', bandId);

  if (membersErr) throw membersErr;
  if (!members || members.length === 0) return [];

  const profileIds = members
    .map((m) => m.user_id as string | null)
    .filter(Boolean) as string[];

  if (profileIds.length === 0) return [];

  // 2) Profiles for names
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id, display_name, first_name, last_name')
    .in('id', profileIds);

  if (profilesErr) throw profilesErr;

  const profileMap = new Map<
    string,
    {
      display_name: string | null;
      first_name: string | null;
      last_name: string | null;
    }
  >();
  for (const p of profiles ?? []) {
    profileMap.set(p.id as string, {
      display_name: (p as any).display_name ?? null,
      first_name: (p as any).first_name ?? null,
      last_name: (p as any).last_name ?? null,
    });
  }

  // 3) Availability rows
  const { data: availabilityRows, error: availErr } = await supabase
    .from('profile_availability')
    .select('profile_id, status, status_note, away_until')
    .in('profile_id', profileIds);

  if (availErr) throw availErr;
  if (!availabilityRows || availabilityRows.length === 0) return [];

  const eventDateStr = startsAt.toISOString().slice(0, 10); // 'YYYY-MM-DD'
  const conflicts: EventAvailabilityConflict[] = [];

  for (const row of availabilityRows) {
    const profileId = row.profile_id as string;
    const status = row.status as AvailabilityStatus;
    const statusNote = (row as any).status_note ?? null;
    const awayRaw = (row as any).away_until as string | null;

    const profile = profileMap.get(profileId);
    const computedName =
      profile?.display_name?.trim() ||
      [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
      'Unknown member';

    const awayDateOnly =
      awayRaw && awayRaw.includes('T') ? awayRaw.slice(0, 10) : awayRaw;

    // If they have an away_until, treat them as unavailable ONLY through that date.
    if (awayDateOnly) {
      if (eventDateStr <= awayDateOnly) {
        conflicts.push({
          profileId,
          name: computedName,
          status,
          statusNote,
          awayUntil: awayDateOnly,
          reason: 'away_until',
        });
        continue;
      } else {
        // event is after away_until → no conflict from away flag
      }
    }

    // If no away_until, and they are marked hard-unavailable,
    // treat that as "always conflict until they change it".
    if (status === 'unavailable' && !awayDateOnly) {
      conflicts.push({
        profileId,
        name: computedName,
        status,
        statusNote,
        awayUntil: null,
        reason: 'status_unavailable',
      });
      continue;
    }
  }

  return conflicts;
}
