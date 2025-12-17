/* eslint-disable @typescript-eslint/no-explicit-any */
export type Conflict = {
  profileId?: string;
  name?: string | null;
  reason?: string | null;
  awayUntil?: string | null;
  statusNote?: string | null;
};

export const normalizeConflicts = (
  rows: any[] | undefined | null
): Conflict[] =>
  (rows ?? []).map((row, idx) => {
    const nestedProfile =
      row.profile ??
      row.profiles ??
      row.member_profile ??
      row.member?.profile ??
      row.user ??
      null;

    const rawName =
      row.name ??
      row.memberName ??
      row.profile_name ??
      row.display_name ??
      row.full_name ??
      nestedProfile?.display_name ??
      nestedProfile?.full_name ??
      nestedProfile?.name ??
      null;

    return {
      profileId:
        row.profileId ??
        row.memberId ??
        row.profile_id ??
        row.member_id ??
        row.user_id ??
        nestedProfile?.id ??
        `conflict-${idx}`,
      name: rawName,
      reason: row.reason ?? row.status ?? null,
      awayUntil: row.awayUntil ?? row.away_until ?? null,
      statusNote: row.statusNote ?? row.status_note ?? null,
    };
  });
