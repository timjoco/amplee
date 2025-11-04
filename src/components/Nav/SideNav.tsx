'use client';

import { supabaseBrowser } from '@/lib/supabaseClient';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/HomeRounded';
import { Box, Button, Divider, Stack, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import AccountDock from '../Profile/AccountDock';

const NAV_WIDTH = 240;
const primaryItems = [{ href: '/dashboard', label: 'Home', Icon: HomeIcon }];

type ProfileLite = {
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  avatar_url?: string | null;
  avatar_path?: string | null; // add when you introduce private storage
  display_name?: string;
};

export default function SideNav() {
  const pathname = usePathname();
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [profile, setProfile] = useState<ProfileLite | null>(null);

  useEffect(() => {
    let alive = true;

    const sb = supabaseBrowser();

    // helper to derive display name
    const buildDisplayName = (
      row: { first_name?: string | null; last_name?: string | null } | null,
      user: {
        email?: string | null;
        user_metadata?: Record<string, unknown>;
      } | null
    ) => {
      const full =
        [row?.first_name, row?.last_name].filter(Boolean).join(' ').trim() ||
        ((user?.user_metadata?.name as string | undefined) ?? '') ||
        (user?.email ?? '') ||
        '';
      return full || 'Account';
    };

    // initial auth + profile load
    sb.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      const session = data.session;
      setAuthed(Boolean(session));
      const userId = session?.user?.id;
      if (!userId) {
        setProfile(null);
        return;
      }

      const [{ data: row }, { data: u }] = await Promise.all([
        sb
          .from('profiles')
          .select('first_name, last_name, avatar_url')
          .eq('id', userId)
          .maybeSingle(),
        sb.auth.getUser(),
      ]);

      if (!alive) return;
      const email = u.user?.email ?? null;
      setProfile({
        first_name: row?.first_name ?? null,
        last_name: row?.last_name ?? null,
        email,
        avatar_url: row?.avatar_url ?? null,
        display_name: buildDisplayName(row, u.user ?? null),
      });
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setAuthed(Boolean(session));
      const userId = session?.user?.id;

      if (!userId) {
        setProfile(null);
        return;
      }

      (async () => {
        const [{ data: row }, { data: u }] = await Promise.all([
          sb
            .from('profiles')
            .select('first_name, last_name, avatar_url')
            .eq('id', userId)
            .maybeSingle(),
          sb.auth.getUser(),
        ]);

        if (!alive) return;
        const email = u.user?.email ?? null;
        setProfile({
          first_name: row?.first_name ?? null,
          last_name: row?.last_name ?? null,
          email,
          avatar_url: row?.avatar_url ?? null,
          display_name: buildDisplayName(row, u.user ?? null),
        });
      })();
    });

    return () => {
      alive = false;
      sub?.subscription?.unsubscribe?.();
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

      {/* Primary nav (Home) */}
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
