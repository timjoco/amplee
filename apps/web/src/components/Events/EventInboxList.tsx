'use client';

import ArchiveIcon from '@mui/icons-material/Archive';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CloseIcon from '@mui/icons-material/Close';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '../../lib/supabaseClient';
import AvatarImage from '../ui/AvatarImage';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice';
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  notes: string | null;
  is_booked: boolean;
  is_cancelled: boolean;
  archived_at: string | null;
  my_event_status: 'pending' | 'going' | 'not_going' | 'maybe';
  bands: {
    id: string;
    name: string;
    avatar_url: string | null;
  } | null;
};

type LastMsg = {
  event_id: string;
  body: string;
  created_at: string;
};

type ArchivedEventData = {
  id: string;
  title: string;
  type: 'show' | 'practice';
  starts_at: string | null;
  location: string | null;
  archived_at: string | null;
  archive_notes: string | null;
  merch_gross: number | null;
  payout_total: number | null;
  attendance: number | null;
};

export default function EventInboxList({
  bandId,
  isAdmin,
  onEventOpen,
  onLoaded,
}: {
  bandId?: string;
  isAdmin: boolean;
  onEventOpen: (eventId: string) => void;
  onLoaded?: (count: number) => void;
}) {
  const sb = useMemo(() => supabaseBrowser(), []);
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [lastMsgs, setLastMsgs] = useState<Record<string, LastMsg>>({});
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [showArchivedView, setShowArchivedView] = useState(false);

  // Archive modal state
  const [archiveModalOpen, setArchiveModalOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<EventRow | null>(null);
  const [archiveNotes, setArchiveNotes] = useState('');
  const [archiveMerch, setArchiveMerch] = useState('');
  const [archivePayout, setArchivePayout] = useState('');
  const [archiveAttendance, setArchiveAttendance] = useState('');
  const [archiving, setArchiving] = useState(false);

  // Summary modal state
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<ArchivedEventData | null>(
    null
  );

  // Context menu state
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [menuTarget, setMenuTarget] = useState<EventRow | null>(null);

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

  const getRelativeTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString(undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays > 1 && diffDays <= 7) {
      return date.toLocaleDateString(undefined, { weekday: 'short' });
    } else {
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) return;

      // Get band IDs to query
      let bandIds: string[] = [];
      if (bandId) {
        bandIds = [bandId];
      } else {
        // Dashboard view - get all bands for user
        const { data: mems } = await sb
          .from('band_members')
          .select('band_id')
          .eq('user_id', user.id);
        bandIds = (mems ?? []).map((m: any) => String(m.band_id));
      }

      if (bandIds.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const { data: eventsData, error: eventsErr } = await sb
        .from('events_with_my_attendance')
        .select(
          'id, band_id, title, type, starts_at, ends_at, location, notes, is_booked, is_cancelled, my_event_status, bands(id, name, avatar_url)'
        )
        .in('band_id', bandIds)
        .order('starts_at', { ascending: true })
        .limit(200);

      if (eventsErr) throw eventsErr;

      const base: EventRow[] = (eventsData ?? []).map((e: any) => ({
        id: String(e.id),
        band_id: String(e.band_id),
        title: String(e.title ?? ''),
        type: e.type === 'practice' ? 'practice' : 'show',
        starts_at: e.starts_at ?? null,
        ends_at: e.ends_at ?? null,
        location: e.location ?? null,
        notes: e.notes ?? null,
        is_booked: Boolean(e.is_booked),
        is_cancelled: Boolean(e.is_cancelled),
        archived_at: null,
        my_event_status: e.my_event_status ?? 'pending',
        bands: e.bands
          ? {
              id: String(e.bands.id),
              name: String(e.bands.name ?? ''),
              avatar_url: e.bands.avatar_url ?? null,
            }
          : null,
      }));

      const ids = base.map((r) => r.id);

      // Fetch archived_at separately
      const archivedMap: Record<string, string | null> = {};
      if (ids.length) {
        const { data: archRows } = await sb
          .from('events')
          .select('id, archived_at')
          .in('id', ids);

        for (const r of archRows ?? []) {
          archivedMap[String(r.id)] = r.archived_at ?? null;
        }
      }

      const normalized = base.map((r) => ({
        ...r,
        archived_at: archivedMap[r.id] ?? null,
      }));

      // Filter by archived status only - don't filter out past events
      const filtered = normalized.filter((e) =>
        showArchivedView ? Boolean(e.archived_at) : !e.archived_at
      );

      console.log(
        '[EventInboxList] Total events:',
        normalized.length,
        'Filtered:',
        filtered.length,
        'Archived view:',
        showArchivedView
      );

      // Sort: upcoming first (chronological), then past (reverse chronological)
      const now = Date.now();
      const toTs = (s?: string | null) =>
        s ? new Date(s).getTime() : Number.POSITIVE_INFINITY;

      const upcoming = filtered
        .filter((e) => e.starts_at && toTs(e.starts_at) >= now)
        .sort((a, b) => toTs(a.starts_at) - toTs(b.starts_at));

      const past = filtered
        .filter((e) => !e.starts_at || toTs(e.starts_at) < now)
        .sort((a, b) => toTs(b.starts_at) - toTs(a.starts_at)); // Most recent past first

      console.log(
        '[EventInboxList] Upcoming:',
        upcoming.length,
        'Past:',
        past.length
      );

      const sorted = showArchivedView
        ? [...past, ...upcoming] // For archived: show oldest to newest
        : [...upcoming, ...past]; // For active: upcoming first, then recent past
      setEvents(sorted);

      // Notify parent of event count
      onLoaded?.(sorted.length);

      // Fetch last messages
      if (sorted.length > 0) {
        const targetIds = sorted.map((e) => e.id);
        const { data: msgs } = await sb
          .from('event_messages')
          .select('event_id, body, created_at')
          .in('event_id', targetIds)
          .order('created_at', { ascending: false })
          .limit(1000);

        const map: Record<string, LastMsg> = {};
        for (const m of msgs ?? []) {
          const existing = map[m.event_id];
          if (
            !existing ||
            new Date(m.created_at) > new Date(existing.created_at)
          ) {
            map[m.event_id] = m as LastMsg;
          }
        }
        setLastMsgs(map);
      }
    } catch (e) {
      console.error('Failed to load events:', e);
    } finally {
      setLoading(false);
    }
  }, [sb, bandId, showArchivedView, onLoaded]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  // Real-time subscriptions for event changes
  useEffect(() => {
    const channel = sb
      .channel(`events-inbox-${bandId || 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
        },
        () => {
          // Reload events when any event changes
          void loadEvents();
        }
      )
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, [sb, bandId, loadEvents]);

  const openArchiveModal = (event: EventRow) => {
    setArchiveTarget(event);
    setArchiveNotes('');
    setArchiveMerch('');
    setArchivePayout('');
    setArchiveAttendance('');
    setArchiveModalOpen(true);
    setAnchorEl(null);
  };

  const closeArchiveModal = () => {
    setArchiveModalOpen(false);
    setArchiveTarget(null);
  };

  const handleArchive = async () => {
    if (!archiveTarget) return;

    const {
      data: { user },
    } = await sb.auth.getUser();
    const userId = user?.id ?? null;

    const toNum = (s: string) => {
      const n = Number(String(s).replace(/[^\d.-]/g, ''));
      return Number.isFinite(n) ? n : null;
    };

    const patch: any = {
      archived_at: new Date().toISOString(),
      archived_by: userId,
      archive_notes: archiveNotes.trim() || null,
    };

    if (archiveTarget.type === 'show') {
      patch.attendance = toNum(archiveAttendance);
      patch.merch_gross = toNum(archiveMerch);
      patch.payout_total = toNum(archivePayout);
    }

    setArchiving(true);
    try {
      const { error } = await sb
        .from('events')
        .update(patch)
        .eq('id', archiveTarget.id);

      if (error) throw error;

      // Remove from list
      setEvents((prev) => prev.filter((e) => e.id !== archiveTarget.id));
      closeArchiveModal();
    } catch (e) {
      console.error('Failed to archive event:', e);
    } finally {
      setArchiving(false);
    }
  };

  const openArchivedSummary = async (event: EventRow) => {
    setSummaryModalOpen(true);
    setSummaryLoading(true);
    setSummaryData(null);

    try {
      const { data, error } = await sb
        .from('events')
        .select(
          'id, title, type, starts_at, location, archived_at, archive_notes, merch_gross, payout_total, attendance'
        )
        .eq('id', event.id)
        .maybeSingle();

      if (error) throw error;
      setSummaryData(data as ArchivedEventData);
    } catch (e) {
      console.error('Failed to load archived summary:', e);
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleContextMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    event: EventRow
  ) => {
    e.stopPropagation();
    setAnchorEl(e.currentTarget);
    setMenuTarget(event);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setMenuTarget(null);
  };

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
          <Typography>Loading events…</Typography>
        </Stack>
      </Box>
    );
  }

  if (events.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 400,
        }}
      >
        <EventIcon sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
        <Typography variant="h6" sx={{ mb: 1, opacity: 0.7 }}>
          {showArchivedView ? 'No archived events' : 'No upcoming events'}
        </Typography>
        {isAdmin && !showArchivedView && bandId && (
          <Button
            variant="contained"
            href={`/bands/${bandId}/events/new`}
            sx={{
              mt: 2,
              borderRadius: 2,
              fontWeight: 700,
              textTransform: 'none',
              bgcolor: '#10B981',
              '&:hover': { bgcolor: '#059669' },
            }}
          >
            Create Event
          </Button>
        )}
      </Box>
    );
  }

  return (
    <Box>
      {/* Archive Toggle - Only show in band context */}
      {bandId && (
        <Box
          sx={{
            px: 2,
            py: 2,
            borderBottom: (t) =>
              `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
          }}
        >
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant={!showArchivedView ? 'contained' : 'outlined'}
              onClick={() => setShowArchivedView(false)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Active
            </Button>
            <Button
              size="small"
              variant={showArchivedView ? 'contained' : 'outlined'}
              onClick={() => setShowArchivedView(true)}
              sx={{
                borderRadius: 2,
                textTransform: 'none',
                fontWeight: 600,
              }}
            >
              Archived
            </Button>
          </Stack>
        </Box>
      )}

      <Stack spacing={0}>
        {events.map((event, idx) => {
          const when = getRelativeTime(event.starts_at);
          const lm = lastMsgs[event.id];
          const fallbackPreview =
            event.location || `${event.type === 'show' ? 'Show' : 'Practice'}`;
          const isPast = event.starts_at
            ? new Date(event.starts_at).getTime() < Date.now()
            : false;
          const canArchive = isAdmin && isPast && !event.archived_at;

          return (
            <Box key={event.id}>
              <Box
                onClick={() => {
                  if (event.archived_at) {
                    void openArchivedSummary(event);
                  } else {
                    onEventOpen(event.id);
                  }
                }}
                onMouseEnter={() => setHoveredId(event.id)}
                onMouseLeave={() => setHoveredId(null)}
                sx={(t) => ({
                  px: 2,
                  py: 2.5,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  borderRadius: 2,
                  position: 'relative',
                  '&:hover': {
                    bgcolor: alpha(t.palette.primary.main, 0.04),
                  },
                })}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  {/* Avatar */}
                  {event.bands && (
                    <Box sx={{ position: 'relative' }}>
                      <AvatarImage
                        name={event.bands.name}
                        bucket="band-avatars"
                        srcGuess={event.bands.avatar_url || undefined}
                        size={48}
                      />
                    </Box>
                  )}

                  {/* Content */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      sx={{ mb: 0.5 }}
                    >
                      <Typography
                        variant="body1"
                        fontWeight={700}
                        noWrap
                        sx={{ flex: 1 }}
                      >
                        {event.title}
                      </Typography>

                      {when && (
                        <Typography
                          variant="caption"
                          sx={{ opacity: 0.6, flexShrink: 0 }}
                        >
                          {when}
                        </Typography>
                      )}
                    </Stack>

                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        label={event.type}
                        size="small"
                        sx={{
                          textTransform: 'capitalize',
                          bgcolor: alpha(
                            event.type === 'show' ? '#A78BFA' : '#60A5FA',
                            0.15
                          ),
                          color: event.type === 'show' ? '#A78BFA' : '#60A5FA',
                          fontWeight: 600,
                          height: 20,
                          fontSize: '0.75rem',
                        }}
                      />

                      <Typography
                        variant="body2"
                        sx={{
                          opacity: 0.7,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {lm?.body || fallbackPreview}
                      </Typography>
                    </Stack>
                  </Box>

                  {/* Actions Menu - Show for past events if admin */}
                  {canArchive && (
                    <IconButton
                      size="small"
                      onClick={(e) => handleContextMenu(e, event)}
                      sx={{
                        flexShrink: 0,
                        opacity: hoveredId === event.id ? 1 : 0,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  )}
                </Stack>
              </Box>
              {idx < events.length - 1 && <Divider sx={{ opacity: 0.1 }} />}
            </Box>
          );
        })}
      </Stack>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem
          onClick={() => {
            if (menuTarget) openArchiveModal(menuTarget);
          }}
        >
          <ArchiveIcon sx={{ mr: 1, fontSize: 20 }} />
          Archive
        </MenuItem>
      </Menu>

      {/* Archive Modal */}
      <Dialog
        open={archiveModalOpen}
        onClose={closeArchiveModal}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: (t) => ({
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha(t.palette.primary.main, 0.28),
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          }),
        }}
      >
        <DialogTitle>
          Archive {archiveTarget?.type === 'show' ? 'Show' : 'Practice'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {archiveTarget?.type === 'show' && (
              <Box
                sx={(t) => ({
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
                  background: alpha(t.palette.primary.main, 0.03),
                })}
              >
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    color: '#A78BFA',
                    letterSpacing: 0.5,
                    mb: 2,
                    display: 'block',
                  }}
                >
                  Show Stats
                </Typography>

                <Stack spacing={2}>
                  <TextField
                    label="Merch Sales"
                    type="text"
                    value={archiveMerch}
                    onChange={(e) => setArchiveMerch(e.target.value)}
                    placeholder="0.00"
                    InputProps={{
                      startAdornment: (
                        <Typography sx={{ mr: 0.5, opacity: 0.7 }}>
                          $
                        </Typography>
                      ),
                    }}
                    fullWidth
                  />

                  <TextField
                    label="Payout"
                    type="text"
                    value={archivePayout}
                    onChange={(e) => setArchivePayout(e.target.value)}
                    placeholder="0.00"
                    InputProps={{
                      startAdornment: (
                        <Typography sx={{ mr: 0.5, opacity: 0.7 }}>
                          $
                        </Typography>
                      ),
                    }}
                    fullWidth
                  />

                  <TextField
                    label="Attendance"
                    type="number"
                    value={archiveAttendance}
                    onChange={(e) => setArchiveAttendance(e.target.value)}
                    placeholder="0"
                    fullWidth
                  />
                </Stack>
              </Box>
            )}

            <TextField
              label="Notes"
              multiline
              rows={3}
              value={archiveNotes}
              onChange={(e) => setArchiveNotes(e.target.value)}
              placeholder="How did it go? Any memorable moments?"
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeArchiveModal}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleArchive}
            disabled={archiving}
            startIcon={
              archiving ? <CircularProgress size={18} /> : <ArchiveIcon />
            }
            sx={{
              borderRadius: 2,
              textTransform: 'none',
              fontWeight: 600,
              bgcolor: '#7C3AED',
              '&:hover': { bgcolor: '#6D28D9' },
            }}
          >
            {archiving ? 'Archiving…' : 'Archive'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Summary Modal */}
      <Dialog
        open={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: (t) => ({
            borderRadius: 3,
            border: '1px solid',
            borderColor: alpha(t.palette.primary.main, 0.28),
            background:
              'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          }),
        }}
      >
        <DialogTitle>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6" fontWeight={700}>
              {summaryData?.title ?? 'Event Summary'}
            </Typography>
            <IconButton onClick={() => setSummaryModalOpen(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Stack>
        </DialogTitle>
        <DialogContent>
          {summaryLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : !summaryData ? (
            <Typography sx={{ textAlign: 'center', py: 4, opacity: 0.6 }}>
              Couldn't load this summary
            </Typography>
          ) : (
            <Stack spacing={2}>
              {/* Event Details */}
              <Box
                sx={(t) => ({
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
                  background: alpha(t.palette.primary.main, 0.03),
                })}
              >
                <Stack spacing={1.5}>
                  {summaryData.starts_at && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarMonthIcon
                        sx={{ fontSize: 18, color: '#22C55E' }}
                      />
                      <Typography variant="body2">
                        {timeFmt.format(new Date(summaryData.starts_at))}
                      </Typography>
                    </Stack>
                  )}

                  <Stack direction="row" spacing={1} alignItems="center">
                    <MusicNoteIcon
                      sx={{
                        fontSize: 18,
                        color:
                          summaryData.type === 'show' ? '#A78BFA' : '#60A5FA',
                      }}
                    />
                    <Typography
                      variant="body2"
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {summaryData.type}
                    </Typography>
                  </Stack>

                  {summaryData.location && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LocationOnIcon sx={{ fontSize: 18, color: '#8B5CF6' }} />
                      <Typography variant="body2">
                        {summaryData.location}
                      </Typography>
                    </Stack>
                  )}

                  {summaryData.archived_at && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <ArchiveIcon sx={{ fontSize: 18, opacity: 0.6 }} />
                      <Typography variant="body2" sx={{ opacity: 0.6 }}>
                        Archived{' '}
                        {new Date(summaryData.archived_at).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  )}
                </Stack>
              </Box>

              {/* Show Stats */}
              {summaryData.type === 'show' && (
                <Box
                  sx={(t) => ({
                    p: 2,
                    borderRadius: 2,
                    border: `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
                    background: alpha(t.palette.primary.main, 0.03),
                  })}
                >
                  <Typography
                    variant="overline"
                    sx={{
                      fontWeight: 700,
                      color: '#A78BFA',
                      letterSpacing: 0.5,
                      mb: 2,
                      display: 'block',
                    }}
                  >
                    Show Stats
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={2}
                    sx={{ justifyContent: 'space-around' }}
                  >
                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        sx={{ color: '#22C55E' }}
                      >
                        {summaryData.merch_gross
                          ? `$${summaryData.merch_gross}`
                          : '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>
                        Merch
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center' }}>
                      <Typography
                        variant="h5"
                        fontWeight={700}
                        sx={{ color: '#22C55E' }}
                      >
                        {summaryData.payout_total
                          ? `$${summaryData.payout_total}`
                          : '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>
                        Payout
                      </Typography>
                    </Box>

                    <Box sx={{ textAlign: 'center' }}>
                      <Typography variant="h5" fontWeight={700}>
                        {summaryData.attendance ?? '—'}
                      </Typography>
                      <Typography variant="caption" sx={{ opacity: 0.6 }}>
                        Attendance
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              )}

              {/* Notes */}
              <Box
                sx={(t) => ({
                  p: 2,
                  borderRadius: 2,
                  border: `1px solid ${alpha(t.palette.primary.main, 0.12)}`,
                  background: alpha(t.palette.primary.main, 0.03),
                })}
              >
                <Typography
                  variant="overline"
                  sx={{
                    fontWeight: 700,
                    opacity: 0.6,
                    letterSpacing: 0.5,
                    mb: 1,
                    display: 'block',
                  }}
                >
                  Notes
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    whiteSpace: 'pre-wrap',
                    opacity: summaryData.archive_notes ? 0.9 : 0.5,
                    fontStyle: summaryData.archive_notes ? 'normal' : 'italic',
                  }}
                >
                  {summaryData.archive_notes || 'No notes added'}
                </Typography>
              </Box>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
