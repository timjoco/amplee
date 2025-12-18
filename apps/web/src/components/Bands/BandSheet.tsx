'use client';

import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DescriptionIcon from '@mui/icons-material/Description';
import EventIcon from '@mui/icons-material/Event';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import HomeIcon from '@mui/icons-material/HomeRounded';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import PeopleIcon from '@mui/icons-material/People';
import PublicIcon from '@mui/icons-material/Public';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabaseClient';
import EventInboxList from '../Events/EventInboxList';
import EventSheetWrapper from '../Events/EventSheetWrapper';
import AccountDock from '../Profile/AccountDock';
import AvatarImage from '../ui/AvatarImage';
import BandOverviewTab from './BandTabs/BandOverviewTab';
import BandProposalsTab from './BandTabs/BandProposalsTab';
import BandRosterTab from './BandTabs/BandRosterTab';
import BandTitleMenu from './BandTitleMenu';

type WidgetKey =
  | 'overview'
  | 'events'
  | 'proposals'
  | 'availability'
  | 'library'
  | 'roster'
  | 'public';
type MembershipRole = 'admin' | 'member';

type ProfileLite = {
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url?: string | null;
};

type MemberRow = {
  user_id: string;
  role: MembershipRole;
  profile: ProfileLite | null;
};

type Props = {
  bandId: string;
};

type InvitationRow = {
  id: string;
  email: string;
  role: MembershipRole;
  created_at: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
};

const WIDGETS = [
  { key: 'overview' as const, label: 'Overview', icon: HomeIcon },
  { key: 'events' as const, label: 'Events', icon: EventIcon },
  { key: 'proposals' as const, label: 'Proposals', icon: DescriptionIcon },
  {
    key: 'availability' as const,
    label: 'Availability',
    icon: CalendarMonthIcon,
  },
  { key: 'library' as const, label: 'Library', icon: LibraryMusicIcon },
  { key: 'roster' as const, label: 'Roster', icon: PeopleIcon },
  { key: 'public' as const, label: 'Public Page', icon: PublicIcon },
];

export default function BandSheet({ bandId }: Props) {
  const sb = useMemo(() => supabaseBrowser(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<MembershipRole>('member');

  const [myRole, setMyRole] = useState<MembershipRole>('member');
  const [bandName, setBandName] = useState<string>('Band');
  const [activeWidget, setActiveWidget] = useState<WidgetKey>('overview');
  const [invites, setInvites] = useState<InvitationRow[]>([]);
  const [activeEventId, setActiveEventId] = useState<string | null>(null);
  const [profile, setProfile] = useState<{
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
    display_name?: string | null;
  } | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [bandAvatarUrl, setBandAvatarUrl] = useState<string | null>(null);

  const [, setMembers] = useState<MemberRow[]>([]);
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const fetchRoster = useCallback(async () => {
    try {
      let roster: any[] | null = null;
      {
        const { data, error } = await sb
          .from('band_member_profiles')
          .select('user_id, role, email, first_name, last_name, avatar_url')
          .eq('band_id', bandId);
        if (!error) {
          roster = data ?? [];
        }
      }

      if (!roster) {
        const { data: memberships, error: mErr } = await sb
          .from('band_members')
          .select('user_id, role')
          .eq('band_id', bandId);
        if (mErr) throw mErr;

        const userIds = (memberships ?? []).map((r) => r.user_id);
        const profilesById = new Map<string, ProfileLite>();

        if (userIds.length) {
          const { data: profs } = await sb
            .from('profiles')
            .select('id, first_name, last_name, email')
            .in('id', userIds);
          (profs ?? []).forEach((p: any) =>
            profilesById.set(p.id, {
              first_name: p.first_name ?? null,
              last_name: p.last_name ?? null,
              email: p.email ?? null,
              avatar_url: p.avatar_url ?? null,
            })
          );
        }

        roster = (memberships ?? []).map((r: any) => ({
          user_id: r.user_id,
          role: r.role === 'admin' ? 'admin' : 'member',
          first_name: profilesById.get(r.user_id)?.first_name ?? null,
          last_name: profilesById.get(r.user_id)?.last_name ?? null,
          email: profilesById.get(r.user_id)?.email ?? null,
        }));
      }

      const normalized: MemberRow[] = (roster ?? []).map((r: any) => ({
        user_id: r.user_id,
        role: r.role === 'admin' ? 'admin' : 'member',
        profile: {
          first_name: r.first_name ?? null,
          last_name: r.last_name ?? null,
          email: r.email ?? null,
        },
      }));
      setMembers(normalized);

      const { data: invs } = await sb
        .from('band_invitations')
        .select('id, email, role, created_at, status')
        .eq('band_id', bandId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setInvites(invs ?? []);
    } catch (e) {
      console.error('fetchRoster error', e);
    }
  }, [sb, bandId]);

  useEffect(() => {
    let alive = true;
    (async () => {
      let step = 'init';
      try {
        setLoading(true);
        setError(null);

        step = 'auth:getUser';
        const {
          data: { user },
          error: userErr,
        } = await sb.auth.getUser();
        if (userErr) throw userErr;
        if (!alive) return;
        if (!user) {
          setError('You must be signed in to view this band.');
          return;
        }

        step = 'membership:role';
        const { data: mem, error: memErr } = await sb
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', user.id)
          .maybeSingle();
        if (memErr) throw memErr;
        if (!mem) {
          setError('You do not have access to this band (no membership).');
          return;
        }
        setMyRole((mem.role as MembershipRole) ?? 'member');

        step = 'bands:fetch';
        const { data: band, error: bandErr } = await sb
          .from('bands')
          .select('id,name, avatar_url')
          .eq('id', bandId)
          .maybeSingle();
        if (bandErr) throw bandErr;
        if (!band) {
          setError('Band not found or you do not have access.');
          return;
        }
        setBandName(band.name);
        setBandAvatarUrl(band.avatar_url ?? null);

        step = 'profile:fetch';
        const { data: profileData, error: profileErr } = await sb
          .from('profiles')
          .select('display_name, first_name, last_name, avatar_url')
          .eq('id', user.id)
          .maybeSingle();
        if (!profileErr && profileData) {
          setProfile({
            first_name: profileData.first_name ?? null,
            last_name: profileData.last_name ?? null,
            email: user.email ?? null,
            avatar_url: profileData.avatar_url ?? null,
            display_name: profileData.display_name ?? null,
          });
        }

        await fetchRoster();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('BandSheet load error at step:', step, e);
        setError(`Failed to load band (step: ${step}) — ${msg}`);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [sb, bandId, fetchRoster]);

  useEffect(() => {
    const sp = searchParams;
    if (!sp) return;

    const shouldOpen = sp.get('openInvite') === '1';
    if (shouldOpen) {
      setInviteOpen(true);

      const next = new URLSearchParams(sp.toString());
      next.delete('openInvite');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    const channel = sb
      .channel(`band:${bandId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'band_members',
          filter: `band_id=eq.${bandId}`,
        },
        () => fetchRoster()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'band_invitations',
          filter: `band_id=eq.${bandId}`,
        },
        () => fetchRoster()
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, bandId, fetchRoster]);

  // Profile event listeners for avatar/name changes
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

  const sendInvite = useCallback(async () => {
    try {
      setSending(true);

      const sb = supabaseBrowser();
      const {
        data: { session },
      } = await sb.auth.getSession();
      if (!session) throw new Error('Not signed in');

      const email = inviteEmail.trim();
      if (!email) throw new Error('Please enter an email address');

      const res = await fetch(`/api/bands/${bandId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          email,
          role: inviteRole,
          bandName,
        }),
      });

      if (!res.ok) {
        const ct = res.headers.get('content-type') || '';
        const payload = ct.includes('application/json')
          ? await res.json()
          : await res.text();
        const msg =
          typeof payload === 'string'
            ? payload
            : payload?.error || 'Invite failed';
        throw new Error(msg);
      }

      setInviteOpen(false);
      setInviteEmail('');
      setSnack({
        open: true,
        message: `Invite sent to ${email}`,
        severity: 'success',
      });

      setInvites((prev) => [
        {
          id: crypto.randomUUID?.() ?? `${Date.now()}`,
          email,
          role: inviteRole,
          created_at: new Date().toISOString(),
          status: 'pending',
        },
        ...prev,
      ]);

      fetchRoster();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Invite failed';
      setSnack({ open: true, message: msg, severity: 'error' });
    } finally {
      setSending(false);
    }
  }, [bandId, inviteEmail, inviteRole, bandName, fetchRoster]);

  const handleEventOpen = useCallback((eventId: string) => {
    setActiveEventId(eventId);
    setActiveWidget('events');
  }, []);

  const handleBackToEvents = useCallback(() => {
    setActiveEventId(null);
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={48} />
          <Typography variant="h6">Loading band…</Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100vh',
        overflow: 'hidden',
        bgcolor: 'background.default',
      }}
    >
      {/* Left Sidebar - Discord inspired */}
      <Paper
        elevation={0}
        sx={{
          width: 280,
          flexShrink: 0,
          bgcolor: '#0B0B10',
          borderRight: (t) =>
            `1px solid ${alpha(t.palette.primary.main, 0.22)}`,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Logo at top - links to home */}
        <Box sx={{ px: 2, pt: 2.5, pb: 2 }}>
          <Link
            href="/dashboard"
            style={{ textDecoration: 'none', color: 'inherit' }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Box
                component="img"
                src="/logo.png"
                alt="Amplee"
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: 1.5,
                  display: 'block',
                }}
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

        {/* Spacer to push content down */}
        <Box sx={{ height: 40 }} />

        {/* Section 1: Home & Create */}
        <Box
          sx={{
            px: 2,
            pb: 2,
            borderBottom: (t) =>
              `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
          }}
        >
          <Stack spacing={0.75}>
            <Button
              component={Link}
              href="/dashboard"
              startIcon={<HomeIcon />}
              color="inherit"
              sx={(t) => ({
                justifyContent: 'flex-start',
                borderRadius: 2,
                px: 1.25,
                minHeight: 40,
                textTransform: 'none',
                fontWeight: 600,
                letterSpacing: 0.2,
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: alpha('#7C3AED', 0.08),
                },
                '& .MuiButton-startIcon': { mr: 1 },
              })}
            >
              Home
            </Button>

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
                backgroundColor: 'transparent',
                '&:hover': {
                  backgroundColor: alpha('#7C3AED', 0.08),
                },
                '& .MuiButton-startIcon': { mr: 1 },
              })}
            >
              Create
            </Button>
          </Stack>
        </Box>

        {/* Widget Navigation */}
        <Box sx={{ flex: 1, overflow: 'auto', py: 2, px: 2 }}>
          <Stack spacing={0.75}>
            {WIDGETS.map((widget) => {
              const Icon = widget.icon;
              const isActive = activeWidget === widget.key;

              return (
                <Button
                  key={widget.key}
                  onClick={() => setActiveWidget(widget.key)}
                  startIcon={<Icon />}
                  color="inherit"
                  sx={(t) => ({
                    justifyContent: 'flex-start',
                    borderRadius: 2,
                    px: 1.25,
                    minHeight: 40,
                    textTransform: 'none',
                    fontWeight: 600,
                    letterSpacing: 0.2,
                    backgroundColor: isActive
                      ? alpha('#7C3AED', 0.12)
                      : 'transparent',
                    '&:hover': {
                      backgroundColor: alpha('#7C3AED', 0.08),
                    },
                    '& .MuiButton-startIcon': { mr: 1 },
                  })}
                >
                  {widget.label}
                </Button>
              );
            })}
          </Stack>
        </Box>

        {/* Account Dock at bottom */}
        <Box
          sx={{
            p: 2,
            borderTop: (t) =>
              `1px solid ${alpha(t.palette.primary.main, 0.18)}`,
          }}
        >
          <AccountDock placement="inline" profile={profile ?? undefined} />
        </Box>
      </Paper>

      {/* Main Content Area */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Band Header - Only show when NOT viewing an event */}
        {!(activeWidget === 'events' && activeEventId) && (
          <Box
            sx={{
              px: 3,
              py: 2,
              borderBottom: (t) =>
                `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
              bgcolor: 'background.paper',
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <AvatarImage
                name={bandName}
                bucket="band-avatars"
                srcGuess={bandAvatarUrl || undefined}
                size={56}
              />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <BandTitleMenu
                  bandId={bandId}
                  bandName={bandName}
                  onInvite={() => setInviteOpen(true)}
                  isAdmin={myRole === 'admin'}
                />
              </Box>
            </Stack>
          </Box>
        )}
        {error && (
          <Box sx={{ p: 3 }}>
            <Alert
              severity="error"
              sx={(t) => ({
                borderRadius: 2,
                border: '1px solid',
                borderColor: alpha(t.palette.error.main, 0.35),
                backgroundColor: alpha(t.palette.error.main, 0.06),
              })}
            >
              {error}
            </Alert>
          </Box>
        )}

        {/* Widget Content - Scrollable */}
        <Box
          sx={{
            flex: 1,
            overflow: 'auto',
            p: activeWidget === 'events' && activeEventId ? 0 : 3,
          }}
        >
          {activeWidget === 'overview' && <BandOverviewTab bandId={bandId} />}

          {activeWidget === 'events' && (
            <>
              {activeEventId ? (
                <EventSheetWrapper
                  bandId={bandId}
                  eventId={activeEventId}
                  onBack={handleBackToEvents}
                />
              ) : (
                <EventInboxList
                  bandId={bandId}
                  isAdmin={myRole === 'admin'}
                  onEventOpen={handleEventOpen}
                />
              )}
            </>
          )}

          {activeWidget === 'proposals' && (
            <BandProposalsTab bandId={bandId} isAdmin={myRole === 'admin'} />
          )}

          {activeWidget === 'availability' && (
            <Paper
              sx={{
                p: 4,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: (t) =>
                  `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
              }}
            >
              <Typography variant="h5" sx={{ mb: 2 }}>
                Availability Calendar
              </Typography>
              <Typography color="text.secondary">
                Coming soon - track member availability for gigs and rehearsals
              </Typography>
            </Paper>
          )}

          {activeWidget === 'library' && <BandOverviewTab bandId={bandId} />}

          {activeWidget === 'roster' && (
            <BandRosterTab bandId={bandId} invites={invites} />
          )}

          {activeWidget === 'public' && (
            <Paper
              sx={{
                p: 4,
                borderRadius: 2,
                bgcolor: 'background.paper',
                border: (t) =>
                  `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
              }}
            >
              <Typography variant="h5" sx={{ mb: 2 }}>
                Public Band Page
              </Typography>
              <Typography color="text.secondary">
                Coming soon - your band's public profile and booking page
              </Typography>
            </Paper>
          )}
        </Box>
      </Box>

      {/* Invite Dialog */}
      <Dialog
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        fullWidth
        maxWidth="xs"
        disableRestoreFocus
        PaperProps={{
          sx: (t) => ({
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha(t.palette.primary.main, 0.28),
            backdropFilter: 'blur(8px)',
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          }),
        }}
      >
        <DialogTitle>Invite Member</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              autoFocus
            />
            <TextField
              label="Role"
              select
              fullWidth
              value={inviteRole}
              onChange={(e) =>
                setInviteRole((e.target.value as MembershipRole) ?? 'member')
              }
            >
              <MenuItem value="member">Member (view)</MenuItem>
              <MenuItem value="admin">Admin (manage)</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInviteOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={sendInvite}
            disabled={sending || !inviteEmail.trim()}
            startIcon={
              sending ? <CircularProgress size={18} /> : <GroupAddIcon />
            }
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
            }}
          >
            {sending ? 'Sending…' : 'Send Invite'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          severity={snack.severity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
