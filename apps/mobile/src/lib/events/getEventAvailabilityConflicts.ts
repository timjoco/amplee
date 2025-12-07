import { supabase } from '../supabase';

export type EventAvailabilityConflict = {
  memberId: string;
  memberName: string;
  role: string | null;
  conflictDate: string; // 'YYYY-MM-DD'
};

type GetConflictsArgs = {
  bandId: string;
  startsAt: Date;
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

/**
 * For a given band + event start date, find members who have that
 * exact date blocked in member_availability_dates.
 */
export async function getEventAvailabilityConflicts({
  bandId,
  startsAt,
}: GetConflictsArgs): Promise<EventAvailabilityConflict[]> {
  try {
    const dateKey = formatDateKey(startsAt);

    // 1) Get band members (user_id + names/roles)
    const { data: members, error: membersErr } = await supabase
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

    // 2) Look up blocked dates for this exact date
    const { data: blocked, error: blockedErr } = await supabase
      .from('member_availability_dates')
      .select('profile_id, date')
      .in('profile_id', profileIds)
      .eq('date', dateKey);

    if (blockedErr) {
      console.error('[getEventAvailabilityConflicts] blockedErr', blockedErr);
      return [];
    }

    if (!blocked || blocked.length === 0) {
      return [];
    }

    const blockedSet = new Set(blocked.map((b: any) => b.profile_id));

    // 3) Build conflicts list
    const conflicts: EventAvailabilityConflict[] = members
      .filter((m: any) => blockedSet.has(m.user_id))
      .map((m: any) => {
        const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
        const name =
          profile?.display_name ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
          'Unknown';

        return {
          memberId: m.user_id,
          memberName: name,
          role: m.role ?? null,
          conflictDate: dateKey,
        };
      });

    return conflicts;
  } catch (err) {
    console.error('[getEventAvailabilityConflicts] unexpected error', err);
    return [];
  }
}
