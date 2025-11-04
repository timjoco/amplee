/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import AvatarImage from '@/components/ui/AvatarImage';
import RolePill from '@/components/ui/RolePill';
import { supabaseBrowser } from '@/lib/supabaseClient';
import { Box, Chip, CircularProgress, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type MembershipRole = 'admin' | 'member';

export type RosterRow = {
  user_id: string;
  name: string;
  email: string | null;
  role: MembershipRole;
  avatar_url?: string | null;
  updated_at?: string | null;
  title?: string | null; // optional loose role (guitar/singer/etc)
};

export type InvitationRow = {
  id: string;
  email: string;
  role: MembershipRole;
  created_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
};

export default function BandRosterTab({
  bandId,
  invites = [],
}: {
  bandId: string;
  invites?: InvitationRow[];
}) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [rows, setRows] = useState<RosterRow[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      // 1) ordered members
      const { data: members, error: mErr } = await sb
        .from('band_members')
        .select('user_id, role, title, created_at')
        .eq('band_id', bandId)
        .order('created_at', { ascending: true });

      if (mErr) throw mErr;
      const ids = (members ?? []).map((m: any) => m.user_id);
      if (ids.length === 0) {
        setRows([]);
        return;
      }

      // 2) profiles with avatar_url (same fields you use on Overview)
      const { data: profiles, error: pErr } = await sb
        .from('profiles')
        .select(
          'id, display_name, first_name, last_name, email, avatar_url, updated_at'
        )
        .in('id', ids);

      if (pErr) throw pErr;

      // 3) merge + preserve order
      const roleByUser = new Map<string, MembershipRole>(
        (members ?? []).map((m: any) => [
          m.user_id,
          m.role === 'admin' ? 'admin' : 'member',
        ])
      );
      const titleByUser = new Map<string, string | null>(
        (members ?? []).map((m: any) => [m.user_id, m.title ?? null])
      );
      const orderIndex = new Map(ids.map((id, i) => [id, i]));

      const merged: RosterRow[] = (profiles ?? [])
        .map((p: any) => ({
          user_id: p.id,
          name:
            (p.display_name ?? `${p.first_name ?? ''}`.trim()) ||
            (p.first_name ?? 'Member'),
          email: p.email ?? null,
          role: roleByUser.get(p.id) ?? 'member',
          title: titleByUser.get(p.id) ?? null,
          avatar_url: p.avatar_url ?? null,
          updated_at: p.updated_at ?? null,
        }))
        .sort(
          (a, b) => orderIndex.get(a.user_id)! - orderIndex.get(b.user_id)!
        );

      setRows(merged);
    } catch (e: any) {
      setErr(e?.message || 'Failed to load roster');
    } finally {
      setLoading(false);
    }
  }, [sb, bandId]);

  useEffect(() => {
    void load();
  }, [load]);

  // live updates for roster changes
  useEffect(() => {
    const ch = sb
      .channel(`band:${bandId}:roster`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'band_members',
          filter: `band_id=eq.${bandId}`,
        },
        () => void load()
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        () => void load()
      )
      .subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  }, [sb, bandId, load]);

  return (
    <Box sx={{ mt: 2 }}>
      <Typography sx={{ mb: 1.5 }} color="text.secondary">
        Members
      </Typography>

      {loading ? (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ py: 1 }}>
          <CircularProgress size={18} />
          <Typography variant="body2">Loading…</Typography>
        </Stack>
      ) : err ? (
        <Typography variant="body2" color="error">
          {err}
        </Typography>
      ) : rows.length === 0 ? (
        <Typography variant="body2" sx={{ opacity: 0.85 }}>
          No members yet.
        </Typography>
      ) : (
        rows.map((m) => (
          <Stack
            key={m.user_id}
            direction="row"
            spacing={1.25}
            alignItems="center"
            sx={{
              py: 1,
              borderBottom: (t) =>
                `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
            }}
          >
            <AvatarImage
              name={m.name}
              bucket="profile-avatars"
              srcGuess={m.avatar_url || undefined} // same as Overview
              size={40}
            />

            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontWeight: 700 }} noWrap>
                {m.name}
              </Typography>
              {m.email && (
                <Typography color="text.secondary" variant="body2" noWrap>
                  {m.email}
                </Typography>
              )}
            </Box>

            <Box sx={{ flex: 1 }} />

            {m.title && (
              <Chip
                size="small"
                label={m.title}
                sx={{
                  mr: 1,
                  textTransform: 'capitalize',
                  height: 24,
                  borderRadius: 12,
                  border: (t) =>
                    `1px solid ${alpha(t.palette.primary.main, 0.24)}`,
                }}
              />
            )}

            <RolePill role={m.role} size="small" />
          </Stack>
        ))
      )}

      {invites.length > 0 && !loading && !err && (
        <>
          <Typography sx={{ mt: 3, mb: 1.5 }} color="text.secondary">
            Pending invitations
          </Typography>
          {invites.map((inv) => (
            <Stack
              key={inv.id}
              direction="row"
              spacing={1.5}
              alignItems="center"
              sx={{
                py: 1,
                borderBottom: (t) =>
                  `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
              }}
            >
              <Chip
                size="small"
                label="Invited"
                sx={{
                  height: 22,
                  borderRadius: 8,
                  mr: 0.5,
                  border: (t) =>
                    `1px solid ${alpha(t.palette.primary.main, 0.28)}`,
                }}
              />
              <Typography sx={{ fontWeight: 700 }}>{inv.email}</Typography>
              <Box sx={{ flex: 1 }} />
              <RolePill role={inv.role} size="small" />
            </Stack>
          ))}
        </>
      )}
    </Box>
  );
}
