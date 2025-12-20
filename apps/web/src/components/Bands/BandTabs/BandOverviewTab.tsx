'use client';

import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import EventIcon from '@mui/icons-material/Event';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PeopleIcon from '@mui/icons-material/People';
import PlaceIcon from '@mui/icons-material/Place';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import NextLink from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '../../../lib/supabaseClient';
import AvatarImage from '../../ui/AvatarImage';

type EventRow = {
  is_cancelled: any;
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice' | string;
  starts_at: string | null;
  location: string | null;
};

type ProposalRow = {
  id: string;
  title: string;
  created_at: string;
  vote_count?: number;
};

type MemberRow = {
  user_id: string;
  name: string;
  avatar_url?: string | null;
  role: 'admin' | 'member';
  title?: string | null;
};

type ActivityItem = {
  id: string;
  type: 'event' | 'proposal' | 'song' | 'practice';
  title: string;
  subtitle: string;
  timestamp: string;
  user_name?: string;
  user_avatar?: string;
};

export default function BandOverviewTab({ bandId }: { bandId: string }) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<EventRow[]>([]);
  const [proposals, setProposals] = useState<ProposalRow[]>([]);
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [recentActivity, setRecentActivity] = useState<ActivityItem[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalProposals: 0,
    totalSongs: 0,
    totalMembers: 0,
  });
  const [err, setErr] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    []
  );

  const getRelativeTime = (timestamp: string) => {
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return then.toLocaleDateString();
  };

  const handleEventOpen = useCallback((eventId: string) => {
    window.dispatchEvent(
      new CustomEvent('amplee:open-event', { detail: { eventId } })
    );
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);

    try {
      const {
        data: { user },
      } = await sb.auth.getUser();

      let admin = false;
      if (user) {
        const { data: bm } = await sb
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', user.id)
          .maybeSingle();
        admin = bm?.role === 'admin';
      }
      setIsAdmin(admin);

      // Fetch upcoming events
      const { data: events, error: eErr } = await sb
        .from('events')
        .select('id, band_id, title, type, starts_at, location, is_cancelled')
        .eq('band_id', bandId)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(10);
      if (eErr) throw eErr;
      setUpcomingEvents((events ?? []) as EventRow[]);

      // Fetch proposals
      const { data: proposalsData } = await sb
        .from('proposals')
        .select('id, title, created_at, status')
        .eq('band_id', bandId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);
      setProposals(
        (proposalsData ?? []).map((p: any) => ({
          id: p.id,
          title: p.title,
          created_at: p.created_at,
        }))
      );

      // Fetch members
      const { data: membersData } = await sb
        .from('band_members')
        .select('user_id, role, title')
        .eq('band_id', bandId);

      const userIds = (membersData ?? []).map((m: any) => m.user_id);
      if (userIds.length > 0) {
        const { data: profiles } = await sb
          .from('profiles')
          .select('id, display_name, first_name, avatar_url')
          .in('id', userIds);

        const profilesById = new Map(
          (profiles ?? []).map((p: any) => [p.id, p])
        );

        setMembers(
          (membersData ?? []).map((m: any) => {
            const profile = profilesById.get(m.user_id);
            return {
              user_id: m.user_id,
              name: profile?.display_name ?? profile?.first_name ?? 'Member',
              avatar_url: profile?.avatar_url,
              role: m.role,
              title: m.title,
            };
          })
        );
      }

      // Build stats
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count: monthEvents } = await sb
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('band_id', bandId)
        .gte('starts_at', monthStart.toISOString());

      const { count: totalProposals } = await sb
        .from('proposals')
        .select('*', { count: 'exact', head: true })
        .eq('band_id', bandId)
        .eq('status', 'active');

      const { count: totalSongs } = await sb
        .from('band_songs')
        .select('*', { count: 'exact', head: true })
        .eq('band_id', bandId);

      setStats({
        totalEvents: monthEvents ?? 0,
        totalProposals: totalProposals ?? 0,
        totalSongs: totalSongs ?? 0,
        totalMembers: userIds.length,
      });

      // Build activity feed
      const activity: ActivityItem[] = [];
      (proposalsData ?? []).slice(0, 3).forEach((p: any) => {
        activity.push({
          id: `proposal-${p.id}`,
          type: 'proposal',
          title: p.title,
          subtitle: 'New proposal created',
          timestamp: p.created_at,
        });
      });

      (events ?? []).slice(0, 3).forEach((e: any) => {
        activity.push({
          id: `event-${e.id}`,
          type: 'event',
          title: e.title,
          subtitle: e.type === 'show' ? 'Show scheduled' : 'Practice scheduled',
          timestamp: e.starts_at || new Date().toISOString(),
        });
      });

      activity.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      setRecentActivity(activity.slice(0, 10));
    } catch (e: any) {
      setErr(e?.message || 'Failed to load overview');
    } finally {
      setLoading(false);
    }
  }, [sb, bandId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress size={48} />
          <Typography>Loading overview…</Typography>
        </Stack>
      </Box>
    );
  }

  if (err) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{err}</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Main Content Area */}
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Top Bar */}
        <Box
          sx={{
            px: 3,
            py: 2.5,
            borderBottom: (t) =>
              `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <PeopleIcon sx={{ fontSize: 24, opacity: 0.7 }} />
              <Typography variant="h6" fontWeight={700} letterSpacing={0.3}>
                Overview
              </Typography>
            </Stack>

            {isAdmin && (
              <Stack direction="row" spacing={1}>
                <Button
                  component={NextLink}
                  href={`/bands/${bandId}/events/new`}
                  size="small"
                  variant="contained"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    bgcolor: '#10B981',
                    '&:hover': { bgcolor: '#059669' },
                  }}
                >
                  New Event
                </Button>
              </Stack>
            )}
          </Stack>
        </Box>

        {/* Content Area - Scrollable */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          {/* Upcoming Events Section */}
          <Box sx={{ px: 3, py: 3 }}>
            <Typography
              variant="overline"
              sx={{
                fontWeight: 700,
                letterSpacing: 1,
                opacity: 0.6,
                fontSize: '0.75rem',
                mb: 2,
                display: 'block',
              }}
            >
              Upcoming Events — {upcomingEvents.length}
            </Typography>

            {upcomingEvents.length === 0 ? (
              <Box
                sx={(t) => ({
                  py: 6,
                  textAlign: 'center',
                  border: `1px dashed ${alpha(t.palette.primary.main, 0.2)}`,
                  borderRadius: 2,
                })}
              >
                <EventIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" sx={{ opacity: 0.6 }}>
                  No upcoming events scheduled
                </Typography>
              </Box>
            ) : (
              <Stack spacing={0}>
                {upcomingEvents.slice(0, 5).map((event, idx) => (
                  <Box key={event.id}>
                    <Box
                      onClick={() => handleEventOpen(event.id)}
                      sx={(t) => ({
                        px: 2,
                        py: 2.5,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        borderRadius: 2,
                        '&:hover': {
                          bgcolor: alpha(t.palette.primary.main, 0.04),
                        },
                      })}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: alpha('#10B981', 0.15),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <EventIcon sx={{ color: '#10B981', fontSize: 24 }} />
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body1"
                            fontWeight={700}
                            sx={{ mb: 0.5 }}
                            noWrap
                          >
                            {event.title}
                          </Typography>
                          <Stack
                            direction="row"
                            spacing={2}
                            sx={{ flexWrap: 'wrap' }}
                          >
                            {event.starts_at && (
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                              >
                                <CalendarMonthIcon
                                  sx={{ fontSize: 16, opacity: 0.6 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ opacity: 0.7 }}
                                >
                                  {timeFmt.format(new Date(event.starts_at))}
                                </Typography>
                              </Stack>
                            )}
                            {event.location && (
                              <Stack
                                direction="row"
                                spacing={0.5}
                                alignItems="center"
                              >
                                <PlaceIcon
                                  sx={{ fontSize: 16, opacity: 0.6 }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ opacity: 0.7 }}
                                >
                                  {event.location}
                                </Typography>
                              </Stack>
                            )}
                          </Stack>
                        </Box>

                        <Chip
                          label={event.type}
                          size="small"
                          sx={{
                            textTransform: 'capitalize',
                            bgcolor: alpha('#10B981', 0.1),
                            color: '#10B981',
                            fontWeight: 600,
                            border: `1px solid ${alpha('#10B981', 0.2)}`,
                          }}
                        />
                      </Stack>
                    </Box>
                    {idx < upcomingEvents.slice(0, 5).length - 1 && (
                      <Divider sx={{ opacity: 0.1 }} />
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Divider sx={{ opacity: 0.12 }} />

          {/* Active Proposals Section */}
          <Box sx={{ px: 3, py: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1,
                  opacity: 0.6,
                  fontSize: '0.75rem',
                }}
              >
                Active Proposals — {proposals.length}
              </Typography>
              {isAdmin && proposals.length > 0 && (
                <Button
                  component={NextLink}
                  href={`/bands/${bandId}/proposals`}
                  size="small"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                  }}
                >
                  View All
                </Button>
              )}
            </Stack>

            {proposals.length === 0 ? (
              <Box
                sx={(t) => ({
                  py: 6,
                  textAlign: 'center',
                  border: `1px dashed ${alpha(t.palette.primary.main, 0.2)}`,
                  borderRadius: 2,
                })}
              >
                <HowToVoteIcon sx={{ fontSize: 48, opacity: 0.3, mb: 1 }} />
                <Typography variant="body2" sx={{ opacity: 0.6 }}>
                  No active proposals
                </Typography>
              </Box>
            ) : (
              <Stack spacing={0}>
                {proposals.slice(0, 3).map((proposal, idx) => (
                  <Box key={proposal.id}>
                    <Box
                      component={NextLink}
                      href={`/bands/${bandId}/proposals/${proposal.id}`}
                      sx={(t) => ({
                        px: 2,
                        py: 2.5,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                        borderRadius: 2,
                        textDecoration: 'none',
                        color: 'inherit',
                        display: 'block',
                        '&:hover': {
                          bgcolor: alpha(t.palette.primary.main, 0.04),
                        },
                      })}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: alpha('#F59E0B', 0.15),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <HowToVoteIcon
                            sx={{ color: '#F59E0B', fontSize: 24 }}
                          />
                        </Box>

                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            variant="body1"
                            fontWeight={700}
                            sx={{ mb: 0.5 }}
                            noWrap
                          >
                            {proposal.title}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.7 }}>
                            Created {getRelativeTime(proposal.created_at)} •
                            Pending votes
                          </Typography>
                        </Box>

                        <Chip
                          label="Active"
                          size="small"
                          sx={{
                            bgcolor: alpha('#F59E0B', 0.1),
                            color: '#F59E0B',
                            fontWeight: 600,
                            border: `1px solid ${alpha('#F59E0B', 0.2)}`,
                          }}
                        />
                      </Stack>
                    </Box>
                    {idx < proposals.slice(0, 3).length - 1 && (
                      <Divider sx={{ opacity: 0.1 }} />
                    )}
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          <Divider sx={{ opacity: 0.12 }} />

          {/* Band Members Section */}
          <Box sx={{ px: 3, py: 3 }}>
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Typography
                variant="overline"
                sx={{
                  fontWeight: 700,
                  letterSpacing: 1,
                  opacity: 0.6,
                  fontSize: '0.75rem',
                }}
              >
                Band Members — {members.length}
              </Typography>
              {members.length > 5 && (
                <Button
                  size="small"
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '0.8125rem',
                  }}
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('amplee:band-tab', {
                        detail: { tab: 'roster' },
                      })
                    )
                  }
                >
                  View All
                </Button>
              )}
            </Stack>

            <Stack spacing={0}>
              {members.slice(0, 5).map((member, idx) => (
                <Box key={member.user_id}>
                  <Box
                    sx={(t) => ({
                      px: 2,
                      py: 2,
                      transition: 'all 0.15s ease',
                      borderRadius: 2,
                      '&:hover': {
                        bgcolor: alpha(t.palette.primary.main, 0.04),
                      },
                    })}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box sx={{ position: 'relative' }}>
                        <AvatarImage
                          name={member.name}
                          bucket="profile-avatars"
                          srcGuess={member.avatar_url || undefined}
                          size={40}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            width: 14,
                            height: 14,
                            borderRadius: '50%',
                            bgcolor: '#10B981',
                            border: '3px solid',
                            borderColor: 'background.default',
                          }}
                        />
                      </Box>

                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" fontWeight={700} noWrap>
                          {member.name}
                        </Typography>
                        {member.title && (
                          <Typography
                            variant="body2"
                            sx={{ opacity: 0.7 }}
                            noWrap
                          >
                            {member.title}
                          </Typography>
                        )}
                      </Box>

                      {member.role === 'admin' && (
                        <Chip
                          label="Admin"
                          size="small"
                          sx={{
                            bgcolor: alpha('#A78BFA', 0.1),
                            color: '#A78BFA',
                            fontWeight: 600,
                            height: 24,
                            fontSize: '0.75rem',
                          }}
                        />
                      )}
                    </Stack>
                  </Box>
                  {idx < members.slice(0, 5).length - 1 && (
                    <Divider sx={{ opacity: 0.1 }} />
                  )}
                </Box>
              ))}
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Right Sidebar - Active Now */}
      <Box
        sx={{
          width: 320,
          flexShrink: 0,
          borderLeft: (t) => `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
          display: { xs: 'none', xl: 'flex' },
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        <ActiveNowSidebar
          stats={stats}
          recentActivity={recentActivity.slice(0, 5)}
          getRelativeTime={getRelativeTime}
        />
      </Box>
    </Box>
  );
}

// Active Now Sidebar
function ActiveNowSidebar({
  stats,
  recentActivity,
  getRelativeTime,
}: {
  stats: {
    totalEvents: number;
    totalProposals: number;
    totalSongs: number;
    totalMembers: number;
  };
  recentActivity: ActivityItem[];
  getRelativeTime: (ts: string) => string;
}) {
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'event':
        return <EventIcon sx={{ fontSize: 16 }} />;
      case 'proposal':
        return <HowToVoteIcon sx={{ fontSize: 16 }} />;
      case 'song':
        return <MusicNoteIcon sx={{ fontSize: 16 }} />;
      default:
        return <EventIcon sx={{ fontSize: 16 }} />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'event':
        return '#10B981';
      case 'proposal':
        return '#F59E0B';
      case 'song':
        return '#EC4899';
      default:
        return '#6B7280';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          letterSpacing: 0.5,
          opacity: 0.7,
          mb: 2,
        }}
      >
        ACTIVE NOW
      </Typography>

      {/* Quick Stats */}
      <Stack spacing={2} sx={{ mb: 3 }}>
        <StatRow
          icon={<EventIcon />}
          label="Events This Month"
          value={stats.totalEvents}
          color="#10B981"
        />
        <StatRow
          icon={<HowToVoteIcon />}
          label="Active Proposals"
          value={stats.totalProposals}
          color="#F59E0B"
        />
        <StatRow
          icon={<LibraryMusicIcon />}
          label="Songs in Library"
          value={stats.totalSongs}
          color="#EC4899"
        />
        <StatRow
          icon={<PeopleIcon />}
          label="Band Members"
          value={stats.totalMembers}
          color="#A78BFA"
        />
      </Stack>

      <Divider sx={{ my: 2, opacity: 0.1 }} />

      {/* Recent Activity */}
      <Typography
        variant="subtitle2"
        sx={{
          fontWeight: 700,
          letterSpacing: 0.5,
          opacity: 0.7,
          mb: 2,
        }}
      >
        RECENT ACTIVITY
      </Typography>

      <Stack spacing={2}>
        {recentActivity.map((item) => (
          <Stack key={item.id} direction="row" spacing={1.5}>
            <Box
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                bgcolor: alpha(getActivityColor(item.type), 0.15),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: getActivityColor(item.type),
                flexShrink: 0,
              }}
            >
              {getActivityIcon(item.type)}
            </Box>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight={700}
                noWrap
                sx={{ fontSize: '0.8125rem' }}
              >
                {item.title}
              </Typography>
              <Typography
                variant="caption"
                sx={{ opacity: 0.6, fontSize: '0.75rem' }}
              >
                {getRelativeTime(item.timestamp)}
              </Typography>
            </Box>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function StatRow({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  color: string;
}) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box
        sx={{
          width: 32,
          height: 32,
          borderRadius: 1.5,
          bgcolor: alpha(color, 0.15),
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={700} noWrap>
          {value}
        </Typography>
        <Typography
          variant="caption"
          sx={{ opacity: 0.6, fontSize: '0.75rem' }}
          noWrap
        >
          {label}
        </Typography>
      </Box>
    </Stack>
  );
}
