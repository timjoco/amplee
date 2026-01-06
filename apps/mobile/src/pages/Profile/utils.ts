/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ProfileRow } from './types';

export function computeDisplayName(
  row: ProfileRow | null,
  authUser: any | null
): string {
  const metaName = authUser?.user_metadata?.full_name as string | undefined;
  const email = authUser?.email as string | undefined;

  if (row?.display_name && row.display_name.trim()) return row.display_name;
  const parts = [row?.first_name, row?.last_name]
    .filter(Boolean)
    .map((p) => p!.trim())
    .filter((p) => p.length > 0);
  if (parts.length) return parts.join(' ');
  if (metaName && metaName.trim()) return metaName;
  if (email) return email;
  return 'Your profile';
}

export function computeFullName(profile: ProfileRow | null): string {
  return (
    [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') ||
    'Add your name'
  );
}
