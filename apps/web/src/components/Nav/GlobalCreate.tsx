'use client';

import { useCreateBand } from '../../hooks/useCreateBand';
import { createEvent, type EventType } from '../../lib/events/createEvent';
import { supabaseBrowser } from '../../lib/supabaseClient';

import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CloseIcon from '@mui/icons-material/Close';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import PendingActionsIcon from '@mui/icons-material/PendingActions';

import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  FormControl,
  FormControlLabel,
  IconButton,
  Radio,
  RadioGroup,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Trigger = 'icon' | 'button' | 'none';
type BandLite = { id: string; name: string; avatar_url?: string | null };

type Step = 'menu' | 'newBand' | 'newEvent' | 'newSong' | 'newProposal';

export type GlobalCreateProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger?: Trigger;
  onBandCreated?: (band: BandLite) => void;
};

function errMsg(e: unknown) {
  if (typeof e === 'string') return e;
  if (e && typeof e === 'object' && 'message' in e)
    return String((e as any).message);
  return 'Something went wrong';
}

function normalizeCreateEventError(e: any): string {
  const msg = String(e?.message ?? e ?? '');
  const code = e?.code ?? e?.status;
  if (code === '42501' || /row[- ]level security/i.test(msg)) {
    return "You don't have permission to create events for this band.";
  }
  if (code === 401 || code === 403) {
    return "You're not allowed to create events for this band.";
  }
  return 'Could not create the event. Please try again.';
}

function mergeLocalBands(
  current: BandLite[],
  incoming: BandLite[]
): BandLite[] {
  const map = new Map<string, BandLite>();
  current.forEach((b) => map.set(b.id, b));
  incoming.forEach((b) => {
    const prev = map.get(b.id);
    map.set(b.id, prev ? { ...prev, ...b } : b);
  });
  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

function mapBands(rows: any[] | null | undefined): BandLite[] {
  return (rows ?? [])
    .map((r: any) => r?.bands)
    .filter(Boolean)
    .map((b: any) => ({
      id: String(b.id),
      name: String(b.name),
      avatar_url: b.avatar_url ?? null,
    }));
}

export default function GlobalCreate({
  open: openProp,
  onOpenChange,
  trigger = 'icon',
  onBandCreated,
}: GlobalCreateProps) {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const pathname = usePathname();

  const isControlled = typeof openProp === 'boolean';
  const [openUncontrolled, setOpenUncontrolled] = useState(false);
  const open = isControlled ? (openProp as boolean) : openUncontrolled;
  const setOpen = useCallback(
    (v: boolean) => {
      if (isControlled) onOpenChange?.(v);
      else setOpenUncontrolled(v);
    },
    [isControlled, onOpenChange]
  );

  const [error, setError] = useState<string | null>(null);
  const [bands, setBands] = useState<BandLite[]>([]);
  const [loadingBands, setLoadingBands] = useState(false);
  const [lastUsedBandId, setLastUsedBandId] = useState<string | null>(null);

  // Band state
  const [bandName, setBandName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // Event state
  const [eventBand, setEventBand] = useState<BandLite | null>(null);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('show');
  const [eventStarts, setEventStarts] = useState<string>('');
  const [eventEnds, setEventEnds] = useState<string>('');
  const [eventLocation, setEventLocation] = useState('');
  const [creatingEvent, setCreatingEvent] = useState(false);

  // Song state
  const [songBand, setSongBand] = useState<BandLite | null>(null);
  const [songTitle, setSongTitle] = useState('');
  const [songOrigin, setSongOrigin] = useState<'original' | 'cover'>(
    'original'
  );
  const [songOriginalArtist, setSongOriginalArtist] = useState('');
  const [songKey, setSongKey] = useState('');
  const [songBpm, setSongBpm] = useState('');
  const [songDuration, setSongDuration] = useState('');
  const [songNotes, setSongNotes] = useState('');
  const [creatingSong, setCreatingSong] = useState(false);

  // Proposal state
  const [proposalBand, setProposalBand] = useState<BandLite | null>(null);
  const [proposalTitle, setProposalTitle] = useState('');
  const [proposalVenue, setProposalVenue] = useState('');
  const [proposalDate, setProposalDate] = useState('');
  const [proposalGuarantee, setProposalGuarantee] = useState('');
  const [proposalNotes, setProposalNotes] = useState('');
  const [creatingProposal, setCreatingProposal] = useState(false);

  const [step, setStep] = useState<Step>('menu');

  const {
    createBand: createBandWithHook,
    loading: creatingBand,
    error: createBandError,
    resetError: resetCreateBandError,
  } = useCreateBand();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    const sb = supabaseBrowser();
    sb.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const {
      data: { subscription },
    } = sb.auth.onAuthStateChange((_e, session) => setAuthed(!!session));
    return () => subscription.unsubscribe();
  }, []);

  const allowTrigger = mounted && authed && isMobile;

  useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const closeDialog = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const resetAll = useCallback(() => {
    setStep('menu');
    setError(null);
    resetCreateBandError?.();
    setBandName('');
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);
    setAvatarFile(null);
    setEventBand(null);
    setEventTitle('');
    setEventType('show');
    setEventStarts('');
    setEventEnds('');
    setEventLocation('');
    setSongBand(null);
    setSongTitle('');
    setSongOrigin('original');
    setSongOriginalArtist('');
    setSongKey('');
    setSongBpm('');
    setSongDuration('');
    setSongNotes('');
    setProposalBand(null);
    setProposalTitle('');
    setProposalVenue('');
    setProposalDate('');
    setProposalGuarantee('');
    setProposalNotes('');
  }, [avatarPreview, resetCreateBandError]);

  const prevPathRef = useRef(pathname);
  useEffect(() => {
    if (pathname !== prevPathRef.current) {
      prevPathRef.current = pathname;
      resetAll();
    }
  }, [pathname, resetAll]);

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    if (!f) return;
    if (!f.type.startsWith('image/')) return alert('Please choose an image.');
    if (f.size > 3 * 1024 * 1024) return alert('Max size is 3MB.');
    setAvatarPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setAvatarFile(f);
    setAvatarPreview(URL.createObjectURL(f));
    e.currentTarget.value = '';
  };

  const fetchBands = useCallback(async () => {
    const sb = supabaseBrowser();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return { rows: [], merged: [] as BandLite[] };

    const { data: rows, error } = await sb
      .from('band_members')
      .select('role, bands(id, name, avatar_url)')
      .eq('user_id', user.id);

    if (error) throw error;
    const mapped = mapBands(rows);
    const merged = mergeLocalBands([], mapped);
    return { rows, merged };
  }, []);

  useEffect(() => {
    if (!open) return;
    let mounted = true;
    const sb = supabaseBrowser();

    (async () => {
      try {
        setError(null);
        setLoadingBands(true);
        const {
          data: { user },
        } = await sb.auth.getUser();
        if (!mounted) return;

        if (!user) {
          setOpen(false);
          router.replace('/login?next=/dashboard');
          return;
        }
        try {
          const { error: rpcErr } = await sb.rpc('ensure_profile');
          if (rpcErr && rpcErr.code !== '42883') {
            console.warn('[ensure_profile]', rpcErr.message);
          }
        } catch {}

        const { merged } = await fetchBands();
        if (mounted) setBands(merged);
      } catch (e) {
        if (!mounted) return;
        console.error(e);
        setError(errMsg(e) || 'Failed to load data');
      } finally {
        if (mounted) setLoadingBands(false);
      }
    })();

    const { data: sub } = sb.auth.onAuthStateChange((_e, s) => {
      if (!s?.user) router.replace('/login?next=/dashboard');
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, [open, router, setOpen, fetchBands]);

  const onSubmitCreateBand = useCallback(async () => {
    const name = bandName.trim();
    if (!name) return;

    try {
      resetCreateBandError?.();
      setError(null);

      const created = await createBandWithHook({ name, avatarFile });
      if (!created?.id) throw new Error('Could not create band');

      setBands((prev) =>
        mergeLocalBands(prev, [
          {
            id: created.id,
            name: created.name,
            avatar_url: created.avatar_url ?? null,
          },
        ])
      );

      onBandCreated?.(created);
      closeDialog();
      router.push(`/bands/${created.id}`);
    } catch (e) {
      console.error('[GlobalCreate:onSubmitCreate]', e);
      setError(errMsg(e) || 'Could not create band');
    }
  }, [
    bandName,
    avatarFile,
    createBandWithHook,
    resetCreateBandError,
    onBandCreated,
    closeDialog,
    router,
  ]);

  const onSubmitCreateEvent = useCallback(async () => {
    try {
      setCreatingEvent(true);
      const starts = new Date(eventStarts);
      const ends = eventEnds ? new Date(eventEnds) : null;

      const id = await createEvent({
        bandId: eventBand!.id,
        title: eventTitle,
        type: eventType,
        startsAt: starts,
        endsAt: ends,
        location: eventLocation || null,
      });

      closeDialog();
      router.push(`/bands/${eventBand!.id}/events/${id}`);
    } catch (e: any) {
      setError(normalizeCreateEventError(e));
    } finally {
      setCreatingEvent(false);
    }
  }, [
    eventBand,
    eventTitle,
    eventType,
    eventStarts,
    eventEnds,
    eventLocation,
    closeDialog,
    router,
  ]);

  const onSubmitCreateSong = useCallback(async () => {
    if (!songBand) return;

    try {
      setCreatingSong(true);
      setError(null);

      const sb = supabaseBrowser();
      const payload: any = {
        band_id: songBand.id,
        title: songTitle.trim(),
        origin: songOrigin,
      };

      if (songOrigin === 'cover' && songOriginalArtist.trim()) {
        payload.original_artist = songOriginalArtist.trim();
      }
      if (songKey) payload.musical_key = songKey;
      if (songBpm) payload.bpm = parseInt(songBpm, 10);
      if (songDuration) payload.duration_seconds = parseInt(songDuration, 10);
      if (songNotes.trim()) payload.notes = songNotes.trim();

      const { data, error } = await sb
        .from('band_songs')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error('No song ID returned');

      closeDialog();
      router.push(`/bands/${songBand.id}/songs/${data.id}`);
    } catch (e) {
      console.error('[GlobalCreate:onSubmitCreateSong]', e);
      setError(errMsg(e) || 'Could not create song');
    } finally {
      setCreatingSong(false);
    }
  }, [
    songBand,
    songTitle,
    songOrigin,
    songOriginalArtist,
    songKey,
    songBpm,
    songDuration,
    songNotes,
    closeDialog,
    router,
  ]);

  const onSubmitCreateProposal = useCallback(async () => {
    if (!proposalBand) return;

    try {
      setCreatingProposal(true);
      setError(null);

      const sb = supabaseBrowser();
      const payload: any = {
        band_id: proposalBand.id,
        title: proposalTitle.trim(),
      };

      if (proposalVenue.trim()) payload.venue = proposalVenue.trim();
      if (proposalDate)
        payload.proposed_date = new Date(proposalDate).toISOString();
      if (proposalGuarantee) payload.guarantee = parseFloat(proposalGuarantee);
      if (proposalNotes.trim()) payload.notes = proposalNotes.trim();

      const { data, error } = await sb
        .from('band_proposals')
        .insert(payload)
        .select('id')
        .single();

      if (error) throw error;
      if (!data?.id) throw new Error('No proposal ID returned');

      closeDialog();
      router.push(`/bands/${proposalBand.id}/proposals/${data.id}`);
    } catch (e) {
      console.error('[GlobalCreate:onSubmitCreateProposal]', e);
      setError(errMsg(e) || 'Could not create proposal');
    } finally {
      setCreatingProposal(false);
    }
  }, [
    proposalBand,
    proposalTitle,
    proposalVenue,
    proposalDate,
    proposalGuarantee,
    proposalNotes,
    closeDialog,
    router,
  ]);

  useEffect(() => {
    const openHandler = () => setOpen(true);
    const closeHandler = () => setOpen(false);
    window.addEventListener('global-create:open', openHandler);
    window.addEventListener('global-create:close', closeHandler);
    return () => {
      window.removeEventListener('global-create:open', openHandler);
      window.removeEventListener('global-create:close', closeHandler);
    };
  }, [setOpen]);

  const TriggerEl = useMemo(() => {
    if (!allowTrigger || trigger === 'none') return null;

    if (trigger === 'button') {
      return (
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          color="success"
          onClick={() => setOpen(true)}
          sx={{ borderRadius: '9999px' }}
        >
          Create
        </Button>
      );
    }

    if (trigger === 'icon') {
      return (
        <Tooltip title="Create">
          <Button
            color="success"
            onClick={() => setOpen(true)}
            aria-label="Create"
            size={isMobile ? 'medium' : 'large'}
            startIcon={<AddIcon />}
            sx={{ minWidth: 0, px: 1.25, borderRadius: 9999 }}
          >
            {!isMobile && 'Create'}
          </Button>
        </Tooltip>
      );
    }

    return null;
  }, [allowTrigger, trigger, isMobile, setOpen]);

  const getStepTitle = () => {
    switch (step) {
      case 'newBand':
        return 'Create Band';
      case 'newEvent':
        return 'Create Event';
      case 'newSong':
        return 'Create Song';
      case 'newProposal':
        return 'Create Proposal';
      default:
        return 'Create';
    }
  };

  return (
    <>
      {TriggerEl}

      <Dialog
        open={open}
        onClose={closeDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: '#0a0a0f',
            backgroundImage: 'none',
            borderRadius: 2,
            minHeight: step === 'menu' ? 'auto' : 500,
            maxWidth: 440,
          },
        }}
      >
        {/* Header - Only show close button on menu */}
        {step === 'menu' ? (
          <Box
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              zIndex: 1,
            }}
          >
            <IconButton
              onClick={closeDialog}
              sx={{
                color: '#9ca3af',
                '&:hover': {
                  color: '#e5e7eb',
                  bgcolor: 'rgba(255,255,255,0.05)',
                },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        ) : (
          <Box
            sx={{
              p: 2,
              borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
              bgcolor: '#0c0c14',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            <IconButton
              onClick={() => {
                setError(null);
                setStep('menu');
              }}
              sx={{
                color: '#9ca3af',
                '&:hover': {
                  color: '#e5e7eb',
                  bgcolor: 'rgba(255,255,255,0.05)',
                },
              }}
              size="small"
            >
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                fontSize: '1rem',
                color: '#e5e7eb',
                flex: 1,
              }}
            >
              {getStepTitle()}
            </Typography>
            <IconButton
              onClick={closeDialog}
              sx={{
                color: '#9ca3af',
                '&:hover': {
                  color: '#e5e7eb',
                  bgcolor: 'rgba(255,255,255,0.05)',
                },
              }}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>
        )}

        <DialogContent sx={{ p: 3, bgcolor: '#0a0a0f' }}>
          {(error || createBandError) && (
            <Alert
              severity="error"
              sx={{
                mb: 2,
                bgcolor: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid #ef4444',
                color: '#fca5a5',
                '& .MuiAlert-icon': { color: '#ef4444' },
              }}
            >
              {error || createBandError}
            </Alert>
          )}

          {/* MENU */}
          {step === 'menu' && (
            <Stack spacing={3} alignItems="center">
              {/* Title & Description */}
              <Stack
                spacing={1}
                alignItems="center"
                sx={{ textAlign: 'center', pt: 2 }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: 700,
                    color: '#e5e7eb',
                  }}
                >
                  Create
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#9ca3af',
                    maxWidth: 360,
                  }}
                >
                  Create a band to get started, then add events, songs, and
                  proposals for your shows.
                </Typography>
              </Stack>

              {/* New Band Card */}
              <Box
                onClick={() => setStep('newBand')}
                sx={{
                  width: '100%',
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: '#1a1a2e',
                  border: '1px solid rgba(168, 85, 247, 0.2)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s',
                  '&:hover': {
                    bgcolor: '#252238',
                    borderColor: 'rgba(168, 85, 247, 0.4)',
                  },
                }}
              >
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 1.5,
                      bgcolor: 'rgba(168, 85, 247, 0.15)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MusicNoteIcon sx={{ fontSize: 24, color: '#c084fc' }} />
                  </Box>
                  <Box>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, color: '#e5e7eb' }}
                    >
                      New Band
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                      Start a new group or solo act
                    </Typography>
                  </Box>
                </Stack>
                <Box sx={{ color: '#6b7280', fontSize: 20 }}>›</Box>
              </Box>

              {bands.length > 0 && (
                <>
                  <Typography
                    variant="caption"
                    sx={{
                      color: '#6b7280',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      alignSelf: 'flex-start',
                    }}
                  >
                    For your bands
                  </Typography>

                  {/* New Event Card */}
                  <Box
                    onClick={() => {
                      const bandToUse = lastUsedBandId
                        ? bands.find((b) => b.id === lastUsedBandId) || bands[0]
                        : bands[0];
                      setEventBand(bandToUse);
                      setStep('newEvent');
                    }}
                    sx={{
                      width: '100%',
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: '#1a1a2e',
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s',
                      '&:hover': {
                        bgcolor: '#1e2f2a',
                        borderColor: 'rgba(16, 185, 129, 0.4)',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1.5,
                          bgcolor: 'rgba(16, 185, 129, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <PendingActionsIcon
                          sx={{ fontSize: 24, color: '#6ee7b7' }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 600, color: '#e5e7eb' }}
                        >
                          New Event
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                          Create a show or practice
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ color: '#6b7280', fontSize: 20 }}>›</Box>
                  </Box>

                  {/* New Song Card */}
                  <Box
                    onClick={() => {
                      const bandToUse = lastUsedBandId
                        ? bands.find((b) => b.id === lastUsedBandId) || bands[0]
                        : bands[0];
                      setSongBand(bandToUse);
                      setStep('newSong');
                    }}
                    sx={{
                      width: '100%',
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: '#1a1a2e',
                      border: '1px solid rgba(236, 72, 153, 0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s',
                      '&:hover': {
                        bgcolor: '#2a1e2e',
                        borderColor: 'rgba(236, 72, 153, 0.4)',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1.5,
                          bgcolor: 'rgba(236, 72, 153, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <LibraryMusicIcon
                          sx={{ fontSize: 24, color: '#f9a8d4' }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 600, color: '#e5e7eb' }}
                        >
                          New Song
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                          Add to your library
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ color: '#6b7280', fontSize: 20 }}>›</Box>
                  </Box>

                  {/* New Proposal Card */}
                  <Box
                    onClick={() => {
                      const bandToUse = lastUsedBandId
                        ? bands.find((b) => b.id === lastUsedBandId) || bands[0]
                        : bands[0];
                      setProposalBand(bandToUse);
                      setStep('newProposal');
                    }}
                    sx={{
                      width: '100%',
                      p: 2,
                      borderRadius: 1.5,
                      bgcolor: '#1a1a2e',
                      border: '1px solid rgba(234, 179, 8, 0.2)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s',
                      '&:hover': {
                        bgcolor: '#2a291e',
                        borderColor: 'rgba(234, 179, 8, 0.4)',
                      },
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 1.5,
                          bgcolor: 'rgba(234, 179, 8, 0.15)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AssignmentIcon
                          sx={{ fontSize: 24, color: '#fde047' }}
                        />
                      </Box>
                      <Box>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 600, color: '#e5e7eb' }}
                        >
                          New Proposal
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#9ca3af' }}>
                          Track a gig opportunity
                        </Typography>
                      </Box>
                    </Stack>
                    <Box sx={{ color: '#6b7280', fontSize: 20 }}>›</Box>
                  </Box>
                </>
              )}

              {bands.length === 0 && (
                <Typography
                  variant="body2"
                  sx={{
                    color: '#6b7280',
                    textAlign: 'center',
                    fontStyle: 'italic',
                  }}
                >
                  Create a band first to unlock events, songs, and proposals
                </Typography>
              )}
            </Stack>
          )}

          {/* NEW BAND */}
          {step === 'newBand' && (
            <Stack spacing={2.5}>
              <TextField
                autoFocus
                fullWidth
                label="Band name"
                placeholder="e.g., Teem and Tiger"
                value={bandName}
                onChange={(e) => setBandName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onSubmitCreateBand();
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: 'rgba(168, 85, 247, 0.3)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(168, 85, 247, 0.5)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#a855f7' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                  '& .MuiInputBase-input': { color: '#fff' },
                }}
              />

              <Stack direction="row" alignItems="center" spacing={2}>
                <Avatar
                  src={avatarPreview || undefined}
                  sx={{
                    width: 80,
                    height: 80,
                    fontWeight: 800,
                    bgcolor: 'rgba(168, 85, 247, 0.2)',
                    border: '2px solid rgba(168, 85, 247, 0.5)',
                    fontSize: '1.75rem',
                  }}
                >
                  {bandName.trim().slice(0, 2).toUpperCase()}
                </Avatar>

                <Button
                  variant="outlined"
                  component="label"
                  sx={{
                    borderColor: 'rgba(168, 85, 247, 0.5)',
                    color: '#c084fc',
                    '&:hover': {
                      borderColor: '#a855f7',
                      bgcolor: 'rgba(168, 85, 247, 0.1)',
                    },
                  }}
                >
                  {avatarPreview ? 'Change avatar' : 'Add avatar'}
                  <input
                    hidden
                    type="file"
                    accept="image/*"
                    onChange={onPickAvatar}
                  />
                </Button>
              </Stack>

              <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  onClick={onSubmitCreateBand}
                  disabled={!bandName.trim() || creatingBand}
                  startIcon={
                    creatingBand ? <CircularProgress size={18} /> : undefined
                  }
                  sx={{
                    bgcolor: '#a855f7',
                    '&:hover': { bgcolor: '#9333ea' },
                    fontWeight: 700,
                    boxShadow: '0 4px 20px rgba(168, 85, 247, 0.4)',
                  }}
                >
                  {creatingBand ? 'Creating…' : 'Create Band'}
                </Button>
              </Stack>
            </Stack>
          )}

          {/* NEW EVENT */}
          {step === 'newEvent' && (
            <Stack spacing={2}>
              <Autocomplete
                autoFocus
                disabled={!bands.length}
                loading={loadingBands}
                value={eventBand}
                onChange={(_, v) => {
                  setEventBand(v);
                  if (v?.id) setLastUsedBandId(v.id);
                }}
                options={bands}
                getOptionLabel={(o) => o?.name ?? ''}
                renderInput={(params: any) => (
                  <TextField
                    {...params}
                    label="Band"
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.03)',
                        '& fieldset': {
                          borderColor: 'rgba(16, 185, 129, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(16, 185, 129, 0.5)',
                        },
                        '&.Mui-focused fieldset': { borderColor: '#10b981' },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255,255,255,0.6)',
                      },
                      '& .MuiInputBase-input': { color: '#fff' },
                    }}
                  />
                )}
              />

              <TextField
                label="Title"
                size="small"
                fullWidth
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="e.g., Show @ The Rino"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.3)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(16, 185, 129, 0.5)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#10b981' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                  '& .MuiInputBase-input': { color: '#fff' },
                }}
              />

              <TextField
                label="Type"
                size="small"
                select
                SelectProps={{ native: true }}
                value={eventType}
                onChange={(e) => setEventType(e.target.value as EventType)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.3)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(16, 185, 129, 0.5)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#10b981' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                  '& .MuiInputBase-input': { color: '#fff' },
                  '& option': { bgcolor: '#1a1a2e', color: '#fff' },
                }}
              >
                <option value="show">Show</option>
                <option value="practice">Practice</option>
              </TextField>

              <TextField
                label="Starts"
                type="datetime-local"
                size="small"
                value={eventStarts}
                onChange={(e) => setEventStarts(e.target.value)}
                helperText="Local time"
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.3)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(16, 185, 129, 0.5)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#10b981' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                  '& .MuiInputBase-input': { color: '#fff' },
                  '& .MuiFormHelperText-root': {
                    color: 'rgba(255,255,255,0.4)',
                  },
                }}
              />

              <TextField
                label="Ends (optional)"
                type="datetime-local"
                size="small"
                value={eventEnds}
                onChange={(e) => setEventEnds(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.3)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(16, 185, 129, 0.5)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#10b981' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                  '& .MuiInputBase-input': { color: '#fff' },
                }}
              />

              <TextField
                label="Location (optional)"
                size="small"
                value={eventLocation}
                onChange={(e) => setEventLocation(e.target.value)}
                placeholder="123 Main St"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: 'rgba(16, 185, 129, 0.3)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(16, 185, 129, 0.5)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#10b981' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                  '& .MuiInputBase-input': { color: '#fff' },
                }}
              />

              <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={
                    !eventBand ||
                    !eventTitle.trim() ||
                    !eventStarts ||
                    creatingEvent
                  }
                  onClick={onSubmitCreateEvent}
                  sx={{
                    bgcolor: '#10b981',
                    '&:hover': { bgcolor: '#059669' },
                    fontWeight: 700,
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.4)',
                  }}
                >
                  {creatingEvent ? 'Creating…' : 'Create Event'}
                </Button>
              </Stack>
            </Stack>
          )}

          {/* NEW SONG */}
          {step === 'newSong' && (
            <Stack spacing={2}>
              <Autocomplete
                autoFocus
                disabled={!bands.length}
                loading={loadingBands}
                value={songBand}
                onChange={(_, v) => {
                  setSongBand(v);
                  if (v?.id) setLastUsedBandId(v.id);
                }}
                options={bands}
                getOptionLabel={(o) => o?.name ?? ''}
                renderInput={(params: any) => (
                  <TextField
                    {...params}
                    label="Band"
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.03)',
                        '& fieldset': {
                          borderColor: 'rgba(236, 72, 153, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(236, 72, 153, 0.5)',
                        },
                        '&.Mui-focused fieldset': { borderColor: '#ec4899' },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255,255,255,0.6)',
                      },
                      '& .MuiInputBase-input': { color: '#fff' },
                    }}
                  />
                )}
              />

              <TextField
                label="Song title"
                size="small"
                fullWidth
                value={songTitle}
                onChange={(e) => setSongTitle(e.target.value)}
                placeholder="e.g., Wonderwall"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: 'rgba(236, 72, 153, 0.3)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(236, 72, 153, 0.5)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#ec4899' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                  '& .MuiInputBase-input': { color: '#fff' },
                }}
              />

              <FormControl size="small">
                <RadioGroup
                  row
                  value={songOrigin}
                  onChange={(e) =>
                    setSongOrigin(e.target.value as 'original' | 'cover')
                  }
                  sx={{
                    '& .MuiFormControlLabel-label': {
                      color: 'rgba(255,255,255,0.8)',
                    },
                    '& .MuiRadio-root': { color: 'rgba(236, 72, 153, 0.5)' },
                    '& .Mui-checked': { color: '#ec4899' },
                  }}
                >
                  <FormControlLabel
                    value="original"
                    control={<Radio />}
                    label="Original"
                  />
                  <FormControlLabel
                    value="cover"
                    control={<Radio />}
                    label="Cover"
                  />
                </RadioGroup>
              </FormControl>

              {songOrigin === 'cover' && (
                <TextField
                  label="Original artist"
                  size="small"
                  fullWidth
                  value={songOriginalArtist}
                  onChange={(e) => setSongOriginalArtist(e.target.value)}
                  placeholder="e.g., Oasis"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.03)',
                      '& fieldset': { borderColor: 'rgba(236, 72, 153, 0.3)' },
                      '&:hover fieldset': {
                        borderColor: 'rgba(236, 72, 153, 0.5)',
                      },
                      '&.Mui-focused fieldset': { borderColor: '#ec4899' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                    '& .MuiInputBase-input': { color: '#fff' },
                  }}
                />
              )}

              <Stack direction="row" spacing={1}>
                <TextField
                  label="Key"
                  size="small"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.03)',
                      '& fieldset': { borderColor: 'rgba(236, 72, 153, 0.3)' },
                      '&:hover fieldset': {
                        borderColor: 'rgba(236, 72, 153, 0.5)',
                      },
                      '&.Mui-focused fieldset': { borderColor: '#ec4899' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                    '& .MuiInputBase-input': { color: '#fff' },
                  }}
                  value={songKey}
                  onChange={(e) => setSongKey(e.target.value)}
                  placeholder="C"
                />
                <TextField
                  label="BPM"
                  size="small"
                  type="number"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.03)',
                      '& fieldset': { borderColor: 'rgba(236, 72, 153, 0.3)' },
                      '&:hover fieldset': {
                        borderColor: 'rgba(236, 72, 153, 0.5)',
                      },
                      '&.Mui-focused fieldset': { borderColor: '#ec4899' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                    '& .MuiInputBase-input': { color: '#fff' },
                  }}
                  value={songBpm}
                  onChange={(e) => setSongBpm(e.target.value)}
                  placeholder="120"
                />
                <TextField
                  label="Duration (s)"
                  size="small"
                  type="number"
                  sx={{
                    flex: 1,
                    '& .MuiOutlinedInput-root': {
                      bgcolor: 'rgba(255,255,255,0.03)',
                      '& fieldset': { borderColor: 'rgba(236, 72, 153, 0.3)' },
                      '&:hover fieldset': {
                        borderColor: 'rgba(236, 72, 153, 0.5)',
                      },
                      '&.Mui-focused fieldset': { borderColor: '#ec4899' },
                    },
                    '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                    '& .MuiInputBase-input': { color: '#fff' },
                  }}
                  value={songDuration}
                  onChange={(e) => setSongDuration(e.target.value)}
                  placeholder="180"
                />
              </Stack>

              <TextField
                label="Notes (optional)"
                size="small"
                multiline
                rows={2}
                fullWidth
                value={songNotes}
                onChange={(e) => setSongNotes(e.target.value)}
                placeholder="Key changes, solos, etc."
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: 'rgba(236, 72, 153, 0.3)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(236, 72, 153, 0.5)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#ec4899' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                  '& .MuiInputBase-input': { color: '#fff' },
                }}
              />

              <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={!songBand || !songTitle.trim() || creatingSong}
                  onClick={onSubmitCreateSong}
                  sx={{
                    bgcolor: '#ec4899',
                    '&:hover': { bgcolor: '#db2777' },
                    fontWeight: 700,
                    boxShadow: '0 4px 20px rgba(236, 72, 153, 0.4)',
                  }}
                >
                  {creatingSong ? 'Creating…' : 'Create Song'}
                </Button>
              </Stack>
            </Stack>
          )}

          {/* NEW PROPOSAL */}
          {step === 'newProposal' && (
            <Stack spacing={2}>
              <Autocomplete
                autoFocus
                disabled={!bands.length}
                loading={loadingBands}
                value={proposalBand}
                onChange={(_, v) => {
                  setProposalBand(v);
                  if (v?.id) setLastUsedBandId(v.id);
                }}
                options={bands}
                getOptionLabel={(o) => o?.name ?? ''}
                renderInput={(params: any) => (
                  <TextField
                    {...params}
                    label="Band"
                    size="small"
                    fullWidth
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: 'rgba(255,255,255,0.03)',
                        '& fieldset': { borderColor: 'rgba(234, 179, 8, 0.3)' },
                        '&:hover fieldset': {
                          borderColor: 'rgba(234, 179, 8, 0.5)',
                        },
                        '&.Mui-focused fieldset': { borderColor: '#eab308' },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255,255,255,0.6)',
                      },
                      '& .MuiInputBase-input': { color: '#fff' },
                    }}
                  />
                )}
              />

              <TextField
                label="Proposal title"
                size="small"
                fullWidth
                value={proposalTitle}
                onChange={(e) => setProposalTitle(e.target.value)}
                placeholder="e.g., New Year's Eve @ Venue XYZ"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: 'rgba(234, 179, 8, 0.3)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(234, 179, 8, 0.5)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#eab308' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                  '& .MuiInputBase-input': { color: '#fff' },
                }}
              />

              <TextField
                label="Venue (optional)"
                size="small"
                fullWidth
                value={proposalVenue}
                onChange={(e) => setProposalVenue(e.target.value)}
                placeholder="e.g., The Fillmore"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: 'rgba(255,255,255,0.03)',
                    '& fieldset': { borderColor: 'rgba(234, 179, 8, 0.3)' },
                    '&:hover fieldset': {
                      borderColor: 'rgba(234, 179, 8, 0.5)',
                    },
                    '&.Mui-focused fieldset': { borderColor: '#eab308' },
                  },
                  '& .MuiInputLabel-root': { color: 'rgba(255,255,255,0.6)' },
                  '& .MuiInputBase-input': { color: '#fff' },
                }}
              />

              <Stack direction="row" spacing={1.5} sx={{ mt: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  disabled={
                    !proposalBand || !proposalTitle.trim() || creatingProposal
                  }
                  onClick={onSubmitCreateProposal}
                  sx={{
                    bgcolor: '#eab308',
                    color: '#000',
                    '&:hover': { bgcolor: '#ca8a04' },
                    fontWeight: 700,
                    boxShadow: '0 4px 20px rgba(234, 179, 8, 0.4)',
                  }}
                >
                  {creatingProposal ? 'Creating…' : 'Create Proposal'}
                </Button>
              </Stack>
            </Stack>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
