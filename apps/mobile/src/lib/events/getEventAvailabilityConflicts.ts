import { supabase } from '../supabase';

export type EventAvailabilityConflict = {
  memberId: string;
  memberName: string;
  role: string | null;
  conflictDate: string; // 'YYYY-MM-DD'
  note: string | null;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
};

type GetConflictsArgs = {
  bandId: string;
  startsAt: Date;
  endsAt?: Date; // Optional end time for time-range checking
  userIds?: string[]; // Optional: only check these invited users
};

function formatDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 0-based → 1-based
  const day = d.getDate();
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(
    2,
    '0'
  )}`;
}

function formatTimeKey(d: Date): string {
  const hours = d.getHours();
  const minutes = d.getMinutes();
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
}

/**
 * Check if two time ranges overlap
 * Returns true if they overlap
 */
function timeRangesOverlap(
  eventStart: string,
  eventEnd: string | null,
  unavailStart: string | null,
  unavailEnd: string | null,
  isAllDay: boolean
): boolean {
  // If unavailability is all day, there's always a conflict
  if (isAllDay) return true;

  // If no event end time, assume any partial-day conflict matters
  if (!eventEnd) return true;

  // If no unavailability times, assume all day
  if (!unavailStart || !unavailEnd) return true;

  // Check if ranges overlap: they overlap if one starts before the other ends
  // eventStart < unavailEnd AND unavailStart < eventEnd
  return eventStart < unavailEnd && unavailStart < eventEnd;
}

/**
 * For a given band + event start date, find members who have that
 * exact date blocked in member_availability_dates OR have a matching
 * recurring rule in member_availability_rules.
 *
 * If userIds is provided, only checks those users (invite list).
 */
export async function getEventAvailabilityConflicts({
  bandId,
  startsAt,
  endsAt,
  userIds,
}: GetConflictsArgs): Promise<EventAvailabilityConflict[]> {
  try {
    const dateKey = formatDateKey(startsAt);
    const eventStartTime = formatTimeKey(startsAt);
    const eventEndTime = endsAt ? formatTimeKey(endsAt) : null;
    const dayOfWeek = startsAt.getDay(); // 0=Sunday, 1=Monday, etc.

    console.log(
      '[availability] bandId',
      bandId,
      'dateKey',
      dateKey,
      'dayOfWeek',
      dayOfWeek,
      'userIds?',
      userIds?.length
    );

    // 1) Get band members (user_id + names/roles)
    let membersQuery = supabase
      .from('band_members')
      .select(
        `
          user_id,
          role,
          profiles:user_id (
            display_name,
            first_name,
            last_name
          )
        `
      )
      .eq('band_id', bandId);

    // Only check invited members if provided
    if (userIds && userIds.length > 0) {
      membersQuery = membersQuery.in('user_id', userIds);
    }

    const { data: members, error: membersErr } = await membersQuery;

    if (membersErr) {
      console.error('[getEventAvailabilityConflicts] membersErr', membersErr);
      return [];
    }

    if (!members || members.length === 0) {
      return [];
    }

    const profileIds = members.map((m: any) => m.user_id).filter(Boolean);

    if (profileIds.length === 0) {
      return [];
    }

    // 2) Look up blocked dates and rules in parallel
    const [blockedResult, rulesResult] = await Promise.all([
      supabase
        .from('member_availability_dates')
        .select('profile_id, date, note, all_day, start_time, end_time')
        .in('profile_id', profileIds)
        .eq('date', dateKey),
      supabase
        .from('member_availability_rules')
        .select('profile_id, day_of_week, all_day, start_time, end_time, note, starts_on, ends_on')
        .in('profile_id', profileIds)
        .eq('day_of_week', dayOfWeek),
    ]);

    if (blockedResult.error) {
      console.error('[getEventAvailabilityConflicts] blockedErr', blockedResult.error);
      return [];
    }

    if (rulesResult.error) {
      console.error('[getEventAvailabilityConflicts] rulesErr', rulesResult.error);
      // Continue with just blocked dates if rules fail
    }

    // Build a map of conflicts: profileId -> conflict info
    const conflictMap = new Map<string, {
      note: string | null;
      allDay: boolean;
      startTime: string | null;
      endTime: string | null;
    }>();

    // 3) Process explicit date entries
    const blocked = blockedResult.data ?? [];
    for (const b of blocked) {
      const allDay = b.all_day ?? true;
      const startTime = b.start_time;
      const endTime = b.end_time;

      // Check if the time ranges overlap (if event has specific time)
      if (timeRangesOverlap(eventStartTime, eventEndTime, startTime, endTime, allDay)) {
        conflictMap.set(b.profile_id, {
          note: b.note,
          allDay,
          startTime,
          endTime,
        });
      }
    }

    // 4) Process recurring rules (only if no explicit entry exists)
    const rules = rulesResult.data ?? [];
    const eventDate = new Date(dateKey + 'T00:00:00');

    for (const rule of rules) {
      // Skip if there's already an explicit entry for this profile
      if (conflictMap.has(rule.profile_id)) continue;

      // Check if rule is active on this date
      const startsOn = new Date(rule.starts_on + 'T00:00:00');
      const endsOn = rule.ends_on ? new Date(rule.ends_on + 'T23:59:59') : null;

      if (eventDate < startsOn) continue;
      if (endsOn && eventDate > endsOn) continue;

      const allDay = rule.all_day ?? true;
      const startTime = rule.start_time;
      const endTime = rule.end_time;

      // Check if the time ranges overlap
      if (timeRangesOverlap(eventStartTime, eventEndTime, startTime, endTime, allDay)) {
        conflictMap.set(rule.profile_id, {
          note: rule.note,
          allDay,
          startTime,
          endTime,
        });
      }
    }

    // 5) Build conflicts list
    const conflicts: EventAvailabilityConflict[] = members
      .filter((m: any) => conflictMap.has(m.user_id))
      .map((m: any) => {
        const profile = Array.isArray((m as any).profiles)
          ? (m as any).profiles[0]
          : (m as any).profiles;

        const name =
          profile?.display_name ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
          'Unknown';

        const conflict = conflictMap.get(m.user_id)!;

        return {
          memberId: m.user_id,
          memberName: name,
          role: m.role ?? null,
          conflictDate: dateKey,
          note: conflict.note,
          allDay: conflict.allDay,
          startTime: conflict.startTime,
          endTime: conflict.endTime,
        };
      });

    return conflicts;
  } catch (err) {
    console.error('[getEventAvailabilityConflicts] unexpected error', err);
    return [];
  }
}
