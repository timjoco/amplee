// apps/mobile/src/utils/bands.ts
export type Role = 'admin' | 'member';

export type BandWithRole = {
  id: string;
  name: string;
  avatar_url: string | null;
  role: Role;
};

type BandRef = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export type BandMemberRow = {
  role: string | null;
  bands: BandRef | BandRef[] | null;
};

export function normalizeRole(input: string | null | undefined): Role {
  const r = (input || '').toLowerCase();
  return r === 'admin' ? 'admin' : 'member';
}

export function mapMembershipRowsToBands(
  rows: BandMemberRow[] | null
): BandWithRole[] {
  if (!rows) return [];
  const out: BandWithRole[] = [];
  for (const r of rows) {
    if (!r?.bands) continue;
    const b = Array.isArray(r.bands) ? r.bands[0] : r.bands;
    if (!b) continue;
    out.push({
      id: String(b.id),
      name: String(b.name),
      avatar_url: b.avatar_url ?? null,
      role: normalizeRole(r.role),
    });
  }
  return out;
}

export function sortBandsByRolePriority(bands: BandWithRole[]): BandWithRole[] {
  const prio = (r: Role) => (r === 'admin' ? 0 : 1);
  return [...bands].sort((a, b) => {
    const p = prio(a.role) - prio(b.role);
    if (p !== 0) return p;
    return a.name.localeCompare(b.name);
  });
}

export function mergeBands(current: BandWithRole[], incoming: BandWithRole[]) {
  const map = new Map<string, BandWithRole>();
  current.forEach((b) => map.set(b.id, b));
  incoming.forEach((b) => {
    const prev = map.get(b.id);
    map.set(b.id, prev ? { ...prev, ...b } : b);
  });
  return sortBandsByRolePriority(Array.from(map.values()));
}
