// apps/mobile/src/lib/events/getEventAvailabilityConflicts.ts
import { supabase } from '../supabase';

export type AvailabilityStatus = 'open' | 'limited' | 'unavailable';

export type EventAvailabilityConflictReason =
  | 'status_unavailable'
  | 'away_until'
  | 'blocked_range';

export type EventAvailabilityConflict = {
  profileId: string;
  name: string;
  status: AvailabilityStatus;
  statusNote: string | null;
  awayUntil: string | null;
  reason: EventAvailabilityConflictReason;
  blockStartDate?: string | null;
  blockEndDate?: string | null;
  blockNote?: string | null;
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

  const eventDateStr = startsAt.toISOString().slice(0, 10); // 'YYYY-MM-DD'

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

  // 4) Blocked ranges that cover the event date
  const { data: blockRows, error: blocksErr } = await supabase
    .from('profile_availability_blocks')
    .select('profile_id, start_date, end_date, note')
    .in('profile_id', profileIds)
    .lte('start_date', eventDateStr) // start_date <= event date
    .gte('end_date', eventDateStr); // end_date >= event date

  if (blocksErr) throw blocksErr;

  // Group blocks by profile_id
  const blocksByProfile = new Map<
    string,
    { start_date: string; end_date: string; note: string | null }[]
  >();
  for (const b of blockRows ?? []) {
    const pid = b.profile_id as string;
    const arr = blocksByProfile.get(pid) ?? [];
    arr.push({
      start_date: b.start_date as string,
      end_date: b.end_date as string,
      note: (b as any).note ?? null,
    });
    blocksByProfile.set(pid, arr);
  }

  if (!availabilityRows || availabilityRows.length === 0) {
    // Even if there is no profile_availability row, a block still matters.
    // So handle purely-block-based conflicts here:
    const conflictsFromBlocksOnly: EventAvailabilityConflict[] = [];
    for (const [pid, blocks] of blocksByProfile.entries()) {
      const profile = profileMap.get(pid);
      const computedName =
        profile?.display_name?.trim() ||
        [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
        'Unknown member';

      for (const blk of blocks) {
        conflictsFromBlocksOnly.push({
          profileId: pid,
          name: computedName,
          status: 'open', // default / fallback
          statusNote: null,
          awayUntil: null,
          reason: 'blocked_range',
          blockStartDate: blk.start_date,
          blockEndDate: blk.end_date,
          blockNote: blk.note,
        });
      }
    }
    return conflictsFromBlocksOnly;
  }

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

    // 4a) Blocked ranges → always treated as "conflict-on-that-date"
    const blocks = blocksByProfile.get(profileId) ?? [];
    for (const blk of blocks) {
      conflicts.push({
        profileId,
        name: computedName,
        status,
        statusNote,
        awayUntil: awayDateOnly ?? null,
        reason: 'blocked_range',
        blockStartDate: blk.start_date,
        blockEndDate: blk.end_date,
        blockNote: blk.note,
      });
    }

    // 4b) Away-until: unavailable only up to and including that date
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
        continue; // no need to also add status_unavailable for this date
      }
    }

    // 4c) Hard "unavailable" with no away_until = always conflict
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

    // open/limited without blocks or away_until = no conflict
  }

  return conflicts;
}
