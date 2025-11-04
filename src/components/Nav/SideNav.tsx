'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/HomeRounded';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import AccountDock from '../Profile/AccountDock';

const NAV_WIDTH = 240;
const primaryItems = [{ href: '/dashboard', label: 'Home', Icon: HomeIcon }];

type ProfileLite = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  display_name?: string | null;
};

export default function SideNav() {
  const pathname = usePathname();

  const [authed, setAuthed] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<ProfileLite | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // one stable client so listeners aren't recreated
  const sb = useMemo(() => supabaseBrowser(), []);

  const loadProfile = useCallback(
    async (uid: string) => {
      try {
        const [{ data: row, error: pErr }, { data: u, error: uErr }] =
          await Promise.all([
            sb
              .from('profiles')
              .select('display_name, first_name, last_name, avatar_url')
              .eq('id', uid)
              .maybeSingle(),
            sb.auth.getUser(),
          ]);
        if (pErr) throw pErr;
        if (uErr) throw uErr;

        const email = u.user?.email ?? null;
        setProfile({
          first_name: row?.first_name ?? null,
          last_name: row?.last_name ?? null,
          email,
          avatar_url: row?.avatar_url ?? null,
          display_name: row?.display_name ?? null,
        });
      } catch (e) {
        console.error('[SideNav] loadProfile error:', e);
        // don't leave stale profile on errors
        setProfile((p) => p ?? null);
      }
    },
    [sb]
  );

  // 1) Session + auth listener
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const {
          data: { session },
        } = await sb.auth.getSession();
        if (!alive) return;
        setAuthed(!!session);
        const uid = session?.user?.id ?? null;
        setUserId(uid);
        // fire-and-forget so UI never blocks
        if (uid) loadProfile(uid);
        else setProfile(null);
      } catch (e) {
        console.error('[SideNav] getSession error:', e);
        if (!alive) return;
        setAuthed(false);
        setUserId(null);
        setProfile(null);
      }
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      setAuthed(!!session);
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) loadProfile(uid); // fire-and-forget
      else setProfile(null);
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [sb, loadProfile]);

  // 2) Realtime: subscribe when we know the userId
  useEffect(() => {
    if (!userId) return;

    const ch = sb
      .channel(`self:profile:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const next = payload.new as {
            display_name?: string | null;
            first_name?: string | null;
            last_name?: string | null;
            avatar_url?: string | null;
          };
          setProfile((p) =>
            p
              ? {
                  ...p,
                  display_name: next.display_name ?? p.display_name ?? null,
                  first_name: next.first_name ?? p.first_name ?? null,
                  last_name: next.last_name ?? p.last_name ?? null,
                  avatar_url: next.avatar_url ?? p.avatar_url ?? null,
                }
              : p
          );
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(ch);
    };
  }, [sb, userId]);

  useEffect(() => {
    const onName = (e: Event) => {
      const ce = e as CustomEvent<{ display_name: string }>;
      setProfile((p) =>
        p ? { ...p, display_name: ce.detail.display_name } : p
      );
    };

    const onAvatar = (e: Event) => {
      const ce = e as CustomEvent<{
        avatar_url: string;
        updated_at?: string;
        isPreview?: boolean;
      }>;
      setProfile((p) => (p ? { ...p, avatar_url: ce.detail.avatar_url } : p));
    };

    window.addEventListener('profiles:display_name_changed', onName);
    window.addEventListener('profiles:avatar_changed', onAvatar);
    return () => {
      window.removeEventListener('profiles:display_name_changed', onName);
      window.removeEventListener('profiles:avatar_changed', onAvatar);
    };
  }, []);

  if (authed !== true) return null;

  return (
    <Box
      component="nav"
      sx={(t) => ({
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column',
        position: 'fixed',
        zIndex: 1000,
        top: 0,
        left: 0,
        width: NAV_WIDTH,
        height: '100dvh',
        bgcolor: '#0B0B10',
        color: 'common.white',
        borderRight: '1px solid',
        borderColor: alpha(t.palette.primary.main, 0.22),
        p: 2,
        gap: 1.5,
      })}
    >
      {/* Logo */}
      <Box sx={{ px: 1, pb: 1 }}>
        <Link
          href="/dashboard"
          prefetch={false}
          aria-label="Amplee Home"
          style={{ textDecoration: 'none', color: 'inherit' }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pr: 0.5 }}
          >
            <Image
              src="/logo.png"
              alt="Amplee"
              width={28}
              height={28}
              priority
              style={{ display: 'block', borderRadius: 6 }}
            />
            <Typography
              variant="h6"
              sx={{ fontWeight: 700, letterSpacing: 0.5 }}
            >
              AMPLEE
            </Typography>
          </Box>
        </Link>
      </Box>

      <Divider
        sx={(t) => ({ borderColor: alpha(t.palette.primary.main, 0.18) })}
      />

      {/* Primary nav */}
      <Stack spacing={0.75} sx={{ mt: 1 }}>
        {primaryItems.map(({ href, label, Icon }) => {
          const active = pathname?.startsWith(href);
          return (
            <Button
              key={href}
              component={Link}
              href={href}
              startIcon={<Icon />}
              color="inherit"
              prefetch={false}
              sx={(t) => ({
                justifyContent: 'flex-start',
                borderRadius: 2,
                px: 1.25,
                minHeight: 40,
                textTransform: 'none',
                fontWeight: 600,
                letterSpacing: 0.2,
                border: '1px solid',
                borderColor: active
                  ? alpha(t.palette.primary.main, 0.35)
                  : alpha(t.palette.primary.main, 0.18),
                backgroundColor: active
                  ? alpha('#7C3AED', 0.12)
                  : 'transparent',
                '&:hover': {
                  backgroundColor: alpha('#7C3AED', 0.08),
                  borderColor: alpha(t.palette.primary.main, 0.35),
                },
                '& .MuiButton-startIcon': { mr: 1 },
              })}
            >
              {label}
            </Button>
          );
        })}

        <Button
          onClick={() => {
            (document.activeElement as HTMLElement | null)?.blur?.();
            window.dispatchEvent(new CustomEvent('global-create:open'));
          }}
          startIcon={<AddIcon />}
          color="inherit"
          sx={(t) => ({
            justifyContent: 'flex-start',
            borderRadius: 2,
            px: 1.25,
            minHeight: 40,
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: 0.2,
            border: '1px solid',
            borderColor: alpha(t.palette.primary.main, 0.18),
            backgroundColor: 'transparent',
            '&:hover': {
              backgroundColor: alpha('#7C3AED', 0.08),
              borderColor: alpha(t.palette.primary.main, 0.35),
            },
            '& .MuiButton-startIcon': { mr: 1 },
          })}
        >
          Create
        </Button>
      </Stack>

      <Box sx={{ flex: 1 }} />

      <Box sx={{ mt: 1 }}>
        <AccountDock placement="inline" profile={profile ?? undefined} />
      </Box>
    </Box>
  );
}

export const SIDE_NAV_WIDTH = NAV_WIDTH;
