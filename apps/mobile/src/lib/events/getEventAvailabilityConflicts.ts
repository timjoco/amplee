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
  userIds?: string[]; // ✅ optional: only check these invited users
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
 *
 * If userIds is provided, only checks those users (invite list).
 */
export async function getEventAvailabilityConflicts({
  bandId,
  startsAt,
  userIds,
}: GetConflictsArgs): Promise<EventAvailabilityConflict[]> {
  try {
    const dateKey = formatDateKey(startsAt);

    console.log(
      '[availability] bandId',
      bandId,
      'dateKey',
      dateKey,
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

    // ✅ Only check invited members if provided
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
        const profile = Array.isArray((m as any).profiles)
          ? (m as any).profiles[0]
          : (m as any).profiles;

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
