/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSelect,
  IonSelectOption,
  IonSpinner,
  IonTitle,
  IonToast,
  IonToolbar,
} from '@ionic/react';
import {
  calendarOutline,
  chevronForwardOutline,
  clipboardOutline,
  close as closeIcon,
  gridOutline,
  musicalNotesOutline,
} from 'ionicons/icons';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateBand } from '../../src/hooks/useCreateBand';
import { createEvent, type EventType } from '../../src/lib/events/createEvents';
import { supabase } from '../lib/supabase';

type BandLite = { id: string; name: string; avatar_url?: string | null };

export type GlobalCreateMobileProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onBandCreated?: (band: BandLite) => void;
};

type Step = 'menu' | 'newBand' | 'newEvent' | 'newSong' | 'newProposal';

const normalizeCreateEventError = (e: any) => {
  const msg = String(e?.message ?? e ?? '');
  const code = e?.code ?? e?.status;
  if (code === '42501' || /row[- ]level security/i.test(msg)) {
    return "You don't have permission to create events for this band.";
  }
  if (code === 401 || code === 403) {
    return "You're not allowed to create events for this band.";
  }
  return 'Could not create the event. Please try again.';
};

const mergeLocalBands = (a: BandLite[], b: BandLite[]) => {
  const map = new Map<string, BandLite>();
  [...a, ...b].forEach((x) =>
    map.set(x.id, map.get(x.id) ? { ...map.get(x.id)!, ...x } : x)
  );
  return Array.from(map.values()).sort((x, y) => x.name.localeCompare(y.name));
};

const mapBands = (rows: any[] | null | undefined): BandLite[] =>
  (rows ?? [])
    .map((r: any) => r?.bands)
    .filter(Boolean)
    .map((b: any) => ({
      id: String(b.id),
      name: String(b.name ?? ''),
      avatar_url: b.avatar_url ?? null,
    }));

export default function GlobalCreateMobile({
  open: openProp,
  onOpenChange,
  onBandCreated,
}: GlobalCreateMobileProps) {
  const nav = useNavigate();

  const isControlled = typeof openProp === 'boolean';
  const [openUnc, setOpenUnc] = React.useState(false);
  const open = isControlled ? (openProp as boolean) : openUnc;
  const setOpen = React.useCallback(
    (v: boolean) => (isControlled ? onOpenChange?.(v) : setOpenUnc(v)),
    [isControlled, onOpenChange]
  );

  const [step, setStep] = React.useState<Step>('menu');

  const [error, setError] = React.useState<string | null>(null);
  const [toast, setToast] = React.useState<{ open: boolean; msg: string }>({
    open: false,
    msg: '',
  });

  // ---- Bands for event/song/proposal creation ----
  const [bands, setBands] = React.useState<BandLite[]>([]);
  const [loadingBands, setLoadingBands] = React.useState(false);

  // ---- New Band form ----
  const [bandName, setBandName] = React.useState('');
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

  // ---- New Event form ----
  const [eventBandId, setEventBandId] = React.useState<string>('');
  const [eventTitle, setEventTitle] = React.useState('');
  const [eventType, setEventType] = React.useState<EventType>('show');
  const [eventStarts, setEventStarts] = React.useState('');
  const [eventEnds, setEventEnds] = React.useState('');
  const [eventLocation, setEventLocation] = React.useState('');

  // ---- New Song form ----
  const [songBandId, setSongBandId] = React.useState<string>('');
  const [songTitle, setSongTitle] = React.useState('');
  const [songKey, setSongKey] = React.useState('');
  const [songBpm, setSongBpm] = React.useState('');
  const [songOrigin, setSongOrigin] = React.useState<'original' | 'cover'>(
    'original'
  );
  const [songOriginalArtist, setSongOriginalArtist] = React.useState('');

  // ---- New Proposal form ----
  const [proposalBandId, setProposalBandId] = React.useState<string>('');
  const [proposalTitle, setProposalTitle] = React.useState('');
  const [proposalVenue, setProposalVenue] = React.useState('');

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const {
    createBand,
    loading: creatingBand,
    error: createBandErr,
    resetError,
  } = useCreateBand();

  const longPressTimeoutRef = React.useRef<number | null>(null);
  const pressStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const [pressedId, setPressedId] = React.useState<string | null>(null);
  const MOVE_THRESHOLD = 12;

  const triggerHaptic = React.useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('[global create haptic error]', e);
    }
  }, []);

  const handlePressStart = React.useCallback(
    (
      id: string,
      e:
        | React.TouchEvent<HTMLDivElement>
        | React.MouseEvent<HTMLDivElement, MouseEvent>
    ) => {
      if (longPressTimeoutRef.current != null) {
        window.clearTimeout(longPressTimeoutRef.current);
      }

      let clientX = 0;
      let clientY = 0;

      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      }

      pressStartRef.current = { x: clientX, y: clientY };

      longPressTimeoutRef.current = window.setTimeout(() => {
        setPressedId(id);
        void triggerHaptic();
      }, 350);
    },
    [triggerHaptic]
  );

  const handlePressMove = React.useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!pressStartRef.current || longPressTimeoutRef.current == null) return;
      if (e.touches.length !== 1) return;

      const { x, y } = pressStartRef.current;
      const t = e.touches[0];
      const dx = t.clientX - x;
      const dy = t.clientY - y;

      if (Math.abs(dx) > MOVE_THRESHOLD || Math.abs(dy) > MOVE_THRESHOLD) {
        window.clearTimeout(longPressTimeoutRef.current);
        longPressTimeoutRef.current = null;
      }
    },
    []
  );

  const handlePressEnd = React.useCallback(() => {
    if (longPressTimeoutRef.current != null) {
      window.clearTimeout(longPressTimeoutRef.current);
      longPressTimeoutRef.current = null;
    }
    pressStartRef.current = null;

    if (pressedId != null) {
      setTimeout(() => setPressedId(null), 130);
    }
  }, [pressedId]);

  // -------- Global open/close + custom event handler --------
  React.useEffect(() => {
    const onOpen = () => {
      setStep('menu');
      setOpen(true);
    };

    const onClose = () => setOpen(false);

    const onAmpleeGlobalCreate = (evt: Event) => {
      const custom = evt as CustomEvent<
        { kind?: string; type?: string; bandId?: string } | undefined
      >;
      const detail = custom.detail || {};
      const kind = detail.kind ?? detail.type;

      if (kind === 'event') {
        setStep('newEvent');
        if (detail.bandId) {
          setEventBandId(detail.bandId);
        }
      } else if (kind === 'song') {
        setStep('newSong');
        if (detail.bandId) {
          setSongBandId(detail.bandId);
        }
      } else if (kind === 'proposal') {
        setStep('newProposal');
        if (detail.bandId) {
          setProposalBandId(detail.bandId);
        }
      } else {
        setStep('menu');
      }

      setOpen(true);
    };

    window.addEventListener('global-create:open', onOpen);
    window.addEventListener('global-create:close', onClose);
    window.addEventListener(
      'amplee:global-create',
      onAmpleeGlobalCreate as any
    );

    return () => {
      window.removeEventListener('global-create:open', onOpen);
      window.removeEventListener('global-create:close', onClose);
      window.removeEventListener(
        'amplee:global-create',
        onAmpleeGlobalCreate as any
      );
    };
  }, [setOpen]);

  React.useEffect(() => {
    return () => {
      if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    };
  }, [avatarPreview]);

  const closeAll = React.useCallback(() => {
    setOpen(false);
    setStep('menu');
    setError(null);
    resetError?.();

    setBandName('');
    setAvatarFile(null);
    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
    setAvatarPreview(null);

    setEventBandId('');
    setEventTitle('');
    setEventType('show');
    setEventStarts('');
    setEventEnds('');
    setEventLocation('');

    setSongBandId('');
    setSongTitle('');
    setSongKey('');
    setSongBpm('');
    setSongOrigin('original');
    setSongOriginalArtist('');

    setProposalBandId('');
    setProposalTitle('');
    setProposalVenue('');
  }, [avatarPreview, resetError, setOpen]);

  const pickAvatar: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    try {
      const input = e.currentTarget;
      const files = input.files;
      if (!files || files.length === 0) return;

      const f = files[0];
      if (!f) return;

      // Strong guard: some platforms give no type
      if (!f.type || !f.type.startsWith('image/')) {
        setToast({ open: true, msg: 'Please choose an image file.' });
        input.value = '';
        return;
      }

      if (f.size > 3 * 1024 * 1024) {
        setToast({ open: true, msg: 'Max file size is 3MB.' });
        input.value = '';
        return;
      }

      if (avatarPreview) {
        try {
          URL.revokeObjectURL(avatarPreview);
        } catch {
          // ignore revoke error
        }
      }

      const url = URL.createObjectURL(f);
      setAvatarFile(f);
      setAvatarPreview(url);

      // Allow picking the same file again
      input.value = '';
    } catch (err) {
      console.error('pickAvatar error', err);
      setToast({ open: true, msg: 'Could not load image.' });
    }
  };

  const ensureBandsLoaded = React.useCallback(async () => {
    setLoadingBands(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setToast({ open: true, msg: 'Please sign in first.' });
        setLoadingBands(false);
        return;
      }
      try {
        const { error: rpcErr } = await supabase.rpc('ensure_profile');
        if (rpcErr && rpcErr.code !== '42883') {
          console.warn('[ensure_profile]', rpcErr.message);
        }
      } catch {}

      const { data, error: bmErr } = await supabase
        .from('band_members')
        .select('role, bands(id, name, avatar_url)')
        .eq('user_id', user.id);
      if (bmErr) throw bmErr;

      const mapped = mapBands(data);
      setBands((prev) => mergeLocalBands(prev, mapped));

      if (mapped.length && !eventBandId) {
        setEventBandId(mapped[0].id);
      }
      if (mapped.length && !songBandId) {
        setSongBandId(mapped[0].id);
      }
      if (mapped.length && !proposalBandId) {
        setProposalBandId(mapped[0].id);
      }
    } catch (e: any) {
      setError(String(e?.message ?? 'Failed to load your bands'));
    } finally {
      setLoadingBands(false);
    }
  }, [eventBandId, songBandId, proposalBandId]);

  React.useEffect(() => {
    if (!open) return;
    if (!bands.length && !loadingBands) {
      ensureBandsLoaded();
    }
  }, [open, bands.length, loadingBands, ensureBandsLoaded]);

  React.useEffect(() => {
    if (open) {
      setError(null);
      resetError?.();
    }
  }, [open, resetError]);

  const submitCreateBand = React.useCallback(async () => {
    const name = bandName.trim();
    if (!name) {
      setToast({ open: true, msg: 'Enter a band name.' });
      return;
    }
    try {
      setError(null);
      const created = await createBand({ name, avatarFile });
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
      closeAll();
      nav(`/bands/${created.id}`);
    } catch (e: any) {
      setError(e?.message ?? 'Could not create band');
    }
  }, [bandName, avatarFile, createBand, onBandCreated, nav, closeAll]);

  const submitCreateEvent = React.useCallback(async () => {
    if (!eventBandId) {
      setToast({ open: true, msg: 'Choose a band.' });
      return;
    }
    if (!eventTitle.trim()) {
      setToast({ open: true, msg: 'Add a title.' });
      return;
    }
    if (!eventStarts) {
      setToast({ open: true, msg: 'Pick a start date/time.' });
      return;
    }
    try {
      const id = await createEvent({
        bandId: eventBandId,
        title: eventTitle.trim(),
        type: eventType,
        startsAt: new Date(eventStarts),
        endsAt: eventEnds ? new Date(eventEnds) : null,
        location: eventLocation || null,
      });
      closeAll();
      nav(`/bands/${eventBandId}/events/${id}`);
    } catch (e: any) {
      setError(normalizeCreateEventError(e));
    }
  }, [
    eventBandId,
    eventTitle,
    eventType,
    eventStarts,
    eventEnds,
    eventLocation,
    nav,
    closeAll,
  ]);

  const submitCreateSong = React.useCallback(async () => {
    if (!songBandId) {
      setToast({ open: true, msg: 'Choose a band.' });
      return;
    }
    if (!songTitle.trim()) {
      setToast({ open: true, msg: 'Add a song title.' });
      return;
    }
    if (songOrigin === 'cover' && !songOriginalArtist.trim()) {
      setToast({ open: true, msg: 'Add the original artist for this cover.' });
      return;
    }

    try {
      setError(null);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setToast({ open: true, msg: 'Please sign in first.' });
        return;
      }

      // NEW: build notes if cover
      let notes: string | null = null;
      const artist = songOriginalArtist.trim();
      if (songOrigin === 'cover' && artist) {
        notes = `Cover of ${artist}`;
      }

      const { data, error } = await supabase
        .from('songs')
        .insert({
          band_id: songBandId,
          title: songTitle.trim(),
          default_key: songKey.trim() || null,
          default_bpm: songBpm ? Number(songBpm) : null,
          origin: songOrigin,
          original_artist:
            songOrigin === 'cover' ? songOriginalArtist.trim() || null : null,
          created_by: user.id,
        } as any)
        .select('id')
        .single();

      if (error) throw error;
      const newId = data.id as string;

      closeAll();
      nav(`/bands/${songBandId}/songs/${newId}`);
    } catch (e: any) {
      setError(String(e?.message ?? 'Could not create song'));
    }
  }, [
    songBandId,
    songTitle,
    songKey,
    songBpm,
    songOrigin, // NEW
    songOriginalArtist, // NEW
    nav,
    closeAll,
  ]);

  const submitCreateProposal = React.useCallback(async () => {
    if (!proposalBandId) {
      setToast({ open: true, msg: 'Choose a band.' });
      return;
    }
    if (!proposalTitle.trim()) {
      setToast({ open: true, msg: 'Add a proposal title.' });
      return;
    }

    try {
      setError(null);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        setToast({ open: true, msg: 'Please sign in first.' });
        return;
      }

      const trimmedTitle = proposalTitle.trim();

      const { data, error: propErr } = await supabase
        .from('gig_proposals')
        .insert({
          band_id: proposalBandId,
          title: trimmedTitle,
          venue: proposalVenue.trim() || null,
          created_by: user.id,
        } as any)
        .select('id')
        .single();

      if (propErr) throw propErr;

      const proposalId = data?.id as string;

      closeAll();
      nav(`/bands/${proposalBandId}/proposals/${proposalId}`);
    } catch (e: any) {
      console.error('[submitCreateProposal]', e);
      setError(String(e?.message ?? 'Could not create proposal'));
    }
  }, [proposalBandId, proposalTitle, proposalVenue, nav, closeAll]);

  return (
    <>
      <style>{`
        @keyframes neonPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.7; }
        }

        @keyframes gridSlide {
          0% { transform: translateY(0); }
          100% { transform: translateY(40px); }
        }

        /* 🌌 animated purple gradient for title */
        @keyframes gcTitleGradientShift {
          0% {
            background-position: 0% 50%;
            text-shadow: 0 0 10px rgba(168, 85, 247, 0.6),
              0 0 22px rgba(76, 29, 149, 0.6);
          }
          50% {
            background-position: 100% 50%;
            text-shadow: 0 0 16px rgba(196, 181, 253, 0.9),
              0 0 30px rgba(168, 85, 247, 0.8);
          }
          100% {
            background-position: 0% 50%;
            text-shadow: 0 0 10px rgba(168, 85, 247, 0.6),
              0 0 22px rgba(76, 29, 149, 0.6);
          }
        }

        .gc-modal-root {
          --gc-bg: #0a0e1a;
          --gc-purple: #a855f7;
          --gc-green: #10b981;
          --gc-pink: #ec4899;
          --gc-yellow: #eab308;
        }

        .gc-modal-toolbar {
          background: linear-gradient(180deg, rgba(10, 14, 26, 0.98) 0%, rgba(10, 14, 26, 0.95) 100%);
          border-bottom: 2px solid rgba(168, 85, 247, 0.3);
          box-shadow: 0 4px 20px rgba(168, 85, 247, 0.15);
          position: relative;
          overflow: hidden;
        }

        .gc-modal-toolbar::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 2px;
          background: linear-gradient(90deg, transparent, #a855f7, transparent);
          animation: scanline 3s linear infinite;
        }

        @keyframes scanline {
          0% { left: -100%; }
          100% { left: 100%; }
        }

        .gc-title {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          background-image: linear-gradient(
            120deg,
            #4c1d95,
            #7c3aed,
            #a855f7,
            #c4b5fd,
            #a855f7,
            #4c1d95
          );
          background-size: 220% 220%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation:
            gcTitleGradientShift 4s ease-in-out infinite,
            neonPulse 3s ease-in-out infinite;
        }

        .gc-content {
          background: #0a0e1a;
          position: relative;
          overflow: hidden;
        }

        .gc-content::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            linear-gradient(0deg, transparent 24%, rgba(168, 85, 247, 0.05) 25%, rgba(168, 85, 247, 0.05) 26%, transparent 27%, transparent 74%, rgba(168, 85, 247, 0.05) 75%, rgba(168, 85, 247, 0.05) 76%, transparent 77%, transparent),
            linear-gradient(90deg, transparent 24%, rgba(168, 85, 247, 0.05) 25%, rgba(168, 85, 247, 0.05) 26%, transparent 27%, transparent 74%, rgba(168, 85, 247, 0.05) 75%, rgba(168, 85, 247, 0.05) 76%, transparent 77%, transparent);
          background-size: 40px 40px;
          animation: gridSlide 2s linear infinite;
          pointer-events: none;
          opacity: 0.4;
        }

        .gc-menu-container {
          padding: 12px 12px 24px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          position: relative;
          z-index: 1;
        }

        .gc-menu-heading {
          text-align: center;
          margin-bottom: 8px;
          font-size: 14px;
          letter-spacing: 0.25em;
          text-transform: uppercase;
          color: #a855f7;
          font-weight: 700;
        }

        .gc-card-icon {
            width: 42px;
            height: 42px;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(15, 23, 42, 0.95); /* slightly softer */
            border: 1.5px solid rgba(148, 163, 184, 0.4); /* neutral base */
            position: relative;
            z-index: 1;
            overflow: hidden;
          }

          /* Keep color identity, remove neon glow */
          .gc-card-band .gc-card-icon {
            border-color: rgba(168, 85, 247, 0.8);
            color: #c4b5fd;
            box-shadow: none;
          }

          .gc-card-event .gc-card-icon {
            border-color: rgba(16, 185, 129, 0.8);
            color: #6ee7b7;
            box-shadow: none;
          }

          .gc-card-proposal .gc-card-icon {
            border-color: rgba(234, 179, 8, 0.8);
            color: #fde68a;
            box-shadow: none;
          }

          .gc-card-song .gc-card-icon {
            border-color: rgba(236, 72, 153, 0.8);
            color: #f9a8d4;
            box-shadow: none;
          }


        .gc-card-title {
          font-size: 16px;
          font-weight: 800;
          letter-spacing: 0.02em;
        }

        .gc-card-sub {
          font-size: 13px;
          color: rgba(226, 232, 240, 0.9);
          margin-top: 4px;
        }

        .gc-list {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 2px solid rgba(148, 163, 184, 0.2);
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
        }

        .gc-label {
          font-weight: 700;
          margin-bottom: 4px;
          font-size: 12px;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          color: #a855f7;
        }

        .gc-buttons {
          display: flex;
          gap: 10px;
          margin-top: 20px;
        }

        .gc-btn-back {
          --background: rgba(15, 23, 42, 0.8);
          --border-color: rgba(148, 163, 184, 0.5);
          --color: #e2e8f0;
          --border-radius: 8px;
          --border-width: 2px;
          text-transform: uppercase;
          font-weight: 700;
          letter-spacing: 0.05em;
          font-size: 13px;
        }

        .gc-btn-primary {
          --border-radius: 8px;
          text-transform: uppercase;
          font-weight: 800;
          letter-spacing: 0.08em;
          font-size: 13px;
          position: relative;
          overflow: hidden;
        }

        .gc-btn-primary-band {
          --background: #a855f7;
          --background-activated: #9333ea;
          --color: #ffffff;
          box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.3);
        }

        .gc-btn-primary-event {
          --background: #10b981;
          --background-activated: #059669;
          --color: #ffffff;
          box-shadow: 0 4px 20px rgba(16, 185, 129, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.3);
        }

        .gc-btn-primary-proposal {
          --background: #eab308;
          --background-activated: #ca8a04;
          --color: #0f172a;
          box-shadow: 0 4px 20px rgba(234, 179, 8, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.3);
        }

        .gc-btn-primary-song {
          --background: #ec4899;
          --background-activated: #db2777;
          --color: #ffffff;
          box-shadow: 0 4px 20px rgba(236, 72, 153, 0.4), inset 0 -2px 8px rgba(0, 0, 0, 0.3);
        }

        .gc-error-box {
          margin: 12px 16px 0;
          padding: 12px 14px;
          border-radius: 8px;
          border: 2px solid #ef4444;
          background: rgba(239, 68, 68, 0.1);
          backdrop-filter: blur(10px);
          color: #fca5a5;
          font-size: 13px;
          font-weight: 600;
          box-shadow: 0 0 20px rgba(239, 68, 68, 0.3);
        }

        .gc-modal-root input,
.gc-modal-root textarea,
.gc-modal-root .native-input {
  font-size: 16px !important;
}

/* Optional: keep text-size-adjust stable */
.gc-modal-root {
  -webkit-text-size-adjust: 100%;
}
      `}</style>

      <IonModal
        isOpen={open}
        onDidDismiss={() => setOpen(false)}
        presentingElement={undefined}
        className="gc-modal-root"
      >
        <IonHeader>
          <IonToolbar
            style={{
              '--background': 'rgba(8,8,12,0.98)',
              borderBottom: '0.5px solid rgba(255,255,255,0.06)',
            }}
          >
            <IonTitle
              style={{
                color: '#F9FAFB',
                fontWeight: 700,
                fontSize: 17,
                letterSpacing: 0.25,
              }}
            >
              Create
            </IonTitle>

            <IonButtons slot="end">
              <IonButton
                onClick={closeAll}
                aria-label="Close"
                style={{ '--color': '#F9FAFB' }}
              >
                <IonIcon icon={closeIcon} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>

        <IonContent
          className="gc-content"
          style={{
            ['--padding-top' as any]: 'env(safe-area-inset-top)',
          }}
        >
          {(error || createBandErr) && (
            <div className="gc-error-box">{error || createBandErr}</div>
          )}

          {step === 'menu' && (
            <div className="gc-menu-container">
              {/* New Band */}
              <IonItem
                button
                detail={false}
                lines="none"
                onClick={() => setStep('newBand')}
                style={{
                  ['--background' as any]: 'transparent',
                  ['--background-hover' as any]: 'transparent',
                  ['--background-activated' as any]: 'transparent',
                  ['--ripple-color' as any]: 'transparent',
                  marginInline: -8,
                  paddingInline: 0,
                  paddingBlock: 3,
                }}
                className="gc-card-band"
              >
                {(() => {
                  const isPressed = pressedId === 'newBand';
                  return (
                    <div
                      onTouchStart={(ev) => handlePressStart('newBand', ev)}
                      onTouchMove={handlePressMove}
                      onTouchEnd={handlePressEnd}
                      onTouchCancel={handlePressEnd}
                      onMouseDown={(ev) => handlePressStart('newBand', ev)}
                      onMouseUp={handlePressEnd}
                      onMouseLeave={handlePressEnd}
                      style={{
                        borderRadius: 20,
                        paddingInline: 20,
                        paddingBlock: 12,
                        minHeight: 85,
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        alignItems: 'center',
                        columnGap: 10,
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                        boxShadow: isPressed
                          ? '0 10px 24px rgba(0,0,0,.32)'
                          : '0 18px 40px rgba(0,0,0,0.9)',
                        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
                        transition:
                          'transform 120ms ease-out, box-shadow 120ms ease-out, background 120ms ease-out',
                      }}
                    >
                      {/* Text + icon */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          minWidth: 0,
                        }}
                      >
                        <div className="gc-card-icon">
                          <IonIcon
                            icon={gridOutline}
                            style={{ fontSize: 20 }}
                          />
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: 16,
                              letterSpacing: 0.2,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: '#E5E7EB',
                            }}
                          >
                            New Band
                          </span>
                          <span
                            style={{
                              marginTop: 4,
                              fontSize: 13,
                              opacity: 0.9,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: 'rgba(226,232,240,0.9)',
                            }}
                          >
                            Create a new project or solo act.
                          </span>
                        </div>
                      </div>

                      {/* Chevron */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingLeft: 4,
                        }}
                      >
                        <IonIcon
                          icon={chevronForwardOutline}
                          style={{ fontSize: 18, opacity: 0.6 }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </IonItem>

              {/* New Event */}
              <IonItem
                button
                detail={false}
                lines="none"
                onClick={() => setStep('newEvent')}
                style={{
                  ['--background' as any]: 'transparent',
                  ['--background-hover' as any]: 'transparent',
                  ['--background-activated' as any]: 'transparent',
                  ['--ripple-color' as any]: 'transparent',
                  marginInline: -8,
                  paddingInline: 0,
                  paddingBlock: 3,
                }}
                className="gc-card-event"
              >
                {(() => {
                  const isPressed = pressedId === 'newEvent';
                  return (
                    <div
                      onTouchStart={(ev) => handlePressStart('newEvent', ev)}
                      onTouchMove={handlePressMove}
                      onTouchEnd={handlePressEnd}
                      onTouchCancel={handlePressEnd}
                      onMouseDown={(ev) => handlePressStart('newEvent', ev)}
                      onMouseUp={handlePressEnd}
                      onMouseLeave={handlePressEnd}
                      style={{
                        borderRadius: 20,
                        paddingInline: 20,
                        paddingBlock: 12,
                        minHeight: 85,
                        width: '100%',
                        display: 'grid',
                        gridTemplateColumns: '1fr auto auto',
                        alignItems: 'center',
                        columnGap: 10,
                        background:
                          'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                        boxShadow: isPressed
                          ? '0 10px 24px rgba(0,0,0,.32)'
                          : '0 18px 40px rgba(0,0,0,0.9)',
                        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
                        transition:
                          'transform 120ms ease-out, box-shadow 120ms ease-out, background 120ms ease-out',
                      }}
                    >
                      {/* Text + icon */}
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 12,
                          minWidth: 0,
                        }}
                      >
                        <div className="gc-card-icon">
                          <IonIcon
                            icon={calendarOutline}
                            style={{ fontSize: 20 }}
                          />
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 800,
                              fontSize: 16,
                              letterSpacing: 0.2,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: '#E5E7EB',
                            }}
                          >
                            New Event
                          </span>
                          <span
                            style={{
                              marginTop: 4,
                              fontSize: 13,
                              opacity: 0.9,
                              whiteSpace: 'nowrap',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              color: 'rgba(226,232,240,0.9)',
                            }}
                          >
                            Schedule a show or rehearsal.
                          </span>
                        </div>
                      </div>

                      {/* Chevron */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'flex-end',
                          paddingLeft: 4,
                        }}
                      >
                        <IonIcon
                          icon={chevronForwardOutline}
                          style={{ fontSize: 18, opacity: 0.6 }}
                        />
                      </div>
                    </div>
                  );
                })()}
              </IonItem>

              {/* New Proposal (only if user has bands) */}
              {bands.length > 0 && (
                <IonItem
                  button
                  detail={false}
                  lines="none"
                  onClick={() => setStep('newProposal')}
                  style={{
                    ['--background' as any]: 'transparent',
                    ['--background-hover' as any]: 'transparent',
                    ['--background-activated' as any]: 'transparent',
                    ['--ripple-color' as any]: 'transparent',
                    marginInline: -8,
                    paddingInline: 0,
                    paddingBlock: 3,
                  }}
                  className="gc-card-proposal"
                >
                  {(() => {
                    const isPressed = pressedId === 'newProposal';
                    return (
                      <div
                        onTouchStart={(ev) =>
                          handlePressStart('newProposal', ev)
                        }
                        onTouchMove={handlePressMove}
                        onTouchEnd={handlePressEnd}
                        onTouchCancel={handlePressEnd}
                        onMouseDown={(ev) =>
                          handlePressStart('newProposal', ev)
                        }
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        style={{
                          borderRadius: 20,
                          paddingInline: 20,
                          paddingBlock: 12,
                          minHeight: 85,
                          width: '100%',
                          display: 'grid',
                          gridTemplateColumns: '1fr auto auto',
                          alignItems: 'center',
                          columnGap: 10,
                          background:
                            'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                          boxShadow: isPressed
                            ? '0 10px 24px rgba(0,0,0,.32)'
                            : '0 18px 40px rgba(0,0,0,0.9)',
                          transform: isPressed ? 'scale(0.97)' : 'scale(1)',
                          transition:
                            'transform 120ms ease-out, box-shadow 120ms ease-out, background 120ms ease-out',
                        }}
                      >
                        {/* Text + icon */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            minWidth: 0,
                          }}
                        >
                          <div className="gc-card-icon">
                            <IonIcon
                              icon={clipboardOutline}
                              style={{ fontSize: 20 }}
                            />
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: 16,
                                letterSpacing: 0.2,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: '#E5E7EB',
                              }}
                            >
                              New Proposal
                            </span>
                            <span
                              style={{
                                marginTop: 4,
                                fontSize: 13,
                                opacity: 0.9,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: 'rgba(226,232,240,0.9)',
                              }}
                            >
                              Pitch a gig idea for your band.
                            </span>
                          </div>
                        </div>

                        {/* Chevron */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingLeft: 4,
                          }}
                        >
                          <IonIcon
                            icon={chevronForwardOutline}
                            style={{ fontSize: 18, opacity: 0.6 }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </IonItem>
              )}

              {/* New Song (only if user has bands) */}
              {bands.length > 0 && (
                <IonItem
                  button
                  detail={false}
                  lines="none"
                  onClick={() => setStep('newSong')}
                  style={{
                    ['--background' as any]: 'transparent',
                    ['--background-hover' as any]: 'transparent',
                    ['--background-activated' as any]: 'transparent',
                    ['--ripple-color' as any]: 'transparent',
                    marginInline: -8,
                    paddingInline: 0,
                    paddingBlock: 3,
                  }}
                  className="gc-card-song"
                >
                  {(() => {
                    const isPressed = pressedId === 'newSong';
                    return (
                      <div
                        onTouchStart={(ev) => handlePressStart('newSong', ev)}
                        onTouchMove={handlePressMove}
                        onTouchEnd={handlePressEnd}
                        onTouchCancel={handlePressEnd}
                        onMouseDown={(ev) => handlePressStart('newSong', ev)}
                        onMouseUp={handlePressEnd}
                        onMouseLeave={handlePressEnd}
                        style={{
                          borderRadius: 20,
                          paddingInline: 20,
                          paddingBlock: 12,
                          minHeight: 85,
                          width: '100%',
                          display: 'grid',
                          gridTemplateColumns: '1fr auto auto',
                          alignItems: 'center',
                          columnGap: 10,
                          background:
                            'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))',
                          boxShadow: isPressed
                            ? '0 10px 24px rgba(0,0,0,.32)'
                            : '0 18px 40px rgba(0,0,0,0.9)',
                          transform: isPressed ? 'scale(0.97)' : 'scale(1)',
                          transition:
                            'transform 120ms ease-out, box-shadow 120ms ease-out, background 120ms ease-out',
                        }}
                      >
                        {/* Text + icon */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 12,
                            minWidth: 0,
                          }}
                        >
                          <div className="gc-card-icon">
                            <IonIcon
                              icon={musicalNotesOutline}
                              style={{ fontSize: 20 }}
                            />
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              minWidth: 0,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: 16,
                                letterSpacing: 0.2,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: '#E5E7EB',
                              }}
                            >
                              New Song
                            </span>
                            <span
                              style={{
                                marginTop: 4,
                                fontSize: 13,
                                opacity: 0.9,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                color: 'rgba(226,232,240,0.9)',
                              }}
                            >
                              Add a song to your band&apos;s library.
                            </span>
                          </div>
                        </div>

                        {/* Chevron */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            paddingLeft: 4,
                          }}
                        >
                          <IonIcon
                            icon={chevronForwardOutline}
                            style={{ fontSize: 18, opacity: 0.6 }}
                          />
                        </div>
                      </div>
                    );
                  })()}
                </IonItem>
              )}
            </div>
          )}

          {/* --- Forms stay exactly the same as before --- */}

          {step === 'newBand' && (
            <div className="gc-form-shell">
              <IonList className="gc-list" lines="full">
                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Band name
                  </IonLabel>
                  <IonInput
                    value={bandName}
                    placeholder="e.g., Teem and Tiger"
                    onIonInput={(e) =>
                      setBandName(String(e.detail.value ?? ''))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') submitCreateBand();
                    }}
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Avatar (optional)
                  </IonLabel>
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      width: '100%',
                      paddingTop: 8,
                      paddingBottom: 8,
                    }}
                  >
                    <div
                      style={{
                        width: 60,
                        height: 60,
                        borderRadius: '50%',
                        overflow: 'hidden',
                        background: 'rgba(15,23,42,0.9)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: 20,
                        color: '#e5e7eb',
                      }}
                    >
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt="Preview"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        bandName.trim().slice(0, 2).toUpperCase() || '??'
                      )}
                    </div>

                    <IonButton
                      fill="outline"
                      size="small"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {avatarPreview ? 'Change image' : 'Add image'}
                    </IonButton>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={pickAvatar}
                    />
                  </div>
                </IonItem>
              </IonList>

              <div className="gc-buttons">
                <IonButton
                  fill="outline"
                  onClick={() => {
                    setError(null);
                    resetError?.();
                    setBandName('');
                    if (avatarPreview) URL.revokeObjectURL(avatarPreview);
                    setAvatarPreview(null);
                    setAvatarFile(null);
                    setSongOrigin('original');
                    setSongOriginalArtist('');
                    setStep('menu');
                  }}
                  className="gc-btn-back"
                >
                  Back
                </IonButton>
                <IonButton
                  onClick={submitCreateBand}
                  disabled={!bandName.trim() || creatingBand}
                  className="gc-btn-primary gc-btn-primary-band"
                >
                  {creatingBand ? (
                    <>
                      <IonSpinner name="dots" />
                      &nbsp;Creating…
                    </>
                  ) : (
                    'Create Band'
                  )}
                </IonButton>
              </div>
            </div>
          )}

          {step === 'newEvent' && (
            <div className="gc-form-shell">
              <IonList className="gc-list" lines="full">
                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Band
                  </IonLabel>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                    }}
                  >
                    <IonSelect
                      interface="popover"
                      value={eventBandId}
                      onIonChange={(e) =>
                        setEventBandId(String(e.detail.value))
                      }
                      onIonFocus={() => {
                        if (!bands.length) ensureBandsLoaded();
                      }}
                      style={{ '--padding-start': '0' }}
                    >
                      {loadingBands && (
                        <IonSelectOption value="" disabled>
                          Loading…
                        </IonSelectOption>
                      )}
                      {!loadingBands &&
                        bands.map((b) => (
                          <IonSelectOption key={b.id} value={b.id}>
                            {b.name}
                          </IonSelectOption>
                        ))}
                    </IonSelect>
                    {loadingBands && <IonSpinner name="dots" />}
                  </div>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Title
                  </IonLabel>
                  <IonInput
                    value={eventTitle}
                    placeholder="e.g., Show @ The Rino"
                    onIonInput={(e) =>
                      setEventTitle(String(e.detail.value ?? ''))
                    }
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Type
                  </IonLabel>
                  <IonSelect
                    interface="popover"
                    value={eventType}
                    onIonChange={(e) =>
                      setEventType(e.detail.value as EventType)
                    }
                    style={{ '--padding-start': '0' }}
                  >
                    <IonSelectOption value="show">Show</IonSelectOption>
                    <IonSelectOption value="practice">Practice</IonSelectOption>
                  </IonSelect>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Starts
                  </IonLabel>
                  <input
                    type="datetime-local"
                    value={eventStarts}
                    onChange={(e) => setEventStarts(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      color: 'inherit',
                      padding: '8px 0',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Ends (optional)
                  </IonLabel>
                  <input
                    type="datetime-local"
                    value={eventEnds}
                    onChange={(e) => setEventEnds(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'transparent',
                      color: 'inherit',
                      padding: '8px 0',
                      border: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                    }}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Location (optional)
                  </IonLabel>
                  <IonInput
                    value={eventLocation}
                    onIonInput={(e) =>
                      setEventLocation(String(e.detail.value ?? ''))
                    }
                    placeholder="123 Main St"
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>
              </IonList>

              <div className="gc-buttons">
                <IonButton
                  fill="outline"
                  onClick={() => {
                    setEventTitle('');
                    setEventType('show');
                    setEventStarts('');
                    setEventEnds('');
                    setEventLocation('');
                    setStep('menu');
                  }}
                  className="gc-btn-back"
                >
                  Back
                </IonButton>
                <IonButton
                  onClick={submitCreateEvent}
                  disabled={!eventBandId || !eventTitle.trim() || !eventStarts}
                  className="gc-btn-primary gc-btn-primary-event"
                >
                  Create Event
                </IonButton>
              </div>
            </div>
          )}

          {step === 'newProposal' && (
            <div className="gc-form-shell">
              <IonList className="gc-list" lines="full">
                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Band
                  </IonLabel>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                    }}
                  >
                    <IonSelect
                      interface="popover"
                      value={proposalBandId}
                      onIonChange={(e) =>
                        setProposalBandId(String(e.detail.value))
                      }
                      onIonFocus={() => {
                        if (!bands.length) ensureBandsLoaded();
                      }}
                      style={{ '--padding-start': '0' }}
                    >
                      {loadingBands && (
                        <IonSelectOption value="" disabled>
                          Loading…
                        </IonSelectOption>
                      )}
                      {!loadingBands &&
                        bands.map((b) => (
                          <IonSelectOption key={b.id} value={b.id}>
                            {b.name}
                          </IonSelectOption>
                        ))}
                    </IonSelect>
                    {loadingBands && <IonSpinner name="dots" />}
                  </div>
                </IonItem>

                <IonItem>
                  <IonLabel
                    position="stacked"
                    className="gc-label"
                    style={{ fontSize: 16 }}
                  >
                    Proposal title
                  </IonLabel>
                  <IonInput
                    value={proposalTitle}
                    placeholder="e.g., Friday night at Riverfront"
                    onIonInput={(e) =>
                      setProposalTitle(String(e.detail.value ?? ''))
                    }
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel
                    position="stacked"
                    className="gc-label"
                    style={{ fontSize: 16 }}
                  >
                    Venue (optional)
                  </IonLabel>
                  <IonInput
                    value={proposalVenue}
                    placeholder="The Record Bar"
                    onIonInput={(e) =>
                      setProposalVenue(String(e.detail.value ?? ''))
                    }
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>
              </IonList>

              <div className="gc-buttons">
                <IonButton
                  fill="outline"
                  onClick={() => {
                    setProposalTitle('');
                    setProposalVenue('');
                    setStep('menu');
                  }}
                  className="gc-btn-back"
                >
                  Back
                </IonButton>
                <IonButton
                  onClick={submitCreateProposal}
                  disabled={!proposalBandId || !proposalTitle.trim()}
                  className="gc-btn-primary gc-btn-primary-proposal"
                >
                  Create Proposal
                </IonButton>
              </div>
            </div>
          )}

          {step === 'newSong' && (
            <div className="gc-form-shell">
              <IonList className="gc-list" lines="full">
                {/* Band */}
                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Band
                  </IonLabel>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      width: '100%',
                    }}
                  >
                    <IonSelect
                      interface="popover"
                      value={songBandId}
                      onIonChange={(e) => setSongBandId(String(e.detail.value))}
                      onIonFocus={() => {
                        if (!bands.length) ensureBandsLoaded();
                      }}
                      style={{ '--padding-start': '0' }}
                    >
                      {loadingBands && (
                        <IonSelectOption value="" disabled>
                          Loading…
                        </IonSelectOption>
                      )}
                      {!loadingBands &&
                        bands.map((b) => (
                          <IonSelectOption key={b.id} value={b.id}>
                            {b.name}
                          </IonSelectOption>
                        ))}
                    </IonSelect>
                    {loadingBands && <IonSpinner name="dots" />}
                  </div>
                </IonItem>

                {/* Song title */}
                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Song title
                  </IonLabel>
                  <IonInput
                    value={songTitle}
                    placeholder="e.g., Meadowlark & the Bluebird"
                    onIonInput={(e) =>
                      setSongTitle(String(e.detail.value ?? ''))
                    }
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>

                {/* Song type: original / cover */}
                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Origin
                  </IonLabel>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      marginTop: 8,
                      marginBottom: 4, // 👈 add breathing room above divider
                    }}
                  >
                    <IonButton
                      size="small"
                      fill={songOrigin === 'original' ? 'solid' : 'outline'}
                      onClick={() => setSongOrigin('original')}
                      style={
                        {
                          '--background': 'rgba(34,197,94,0.18)',
                          '--background-activated': 'rgba(34,197,94,0.3)',
                          '--color': '#bbf7d0',
                          '--border-color': 'rgba(34,197,94,0.7)',
                          '--border-radius': '999px',
                          fontSize: 12,
                          paddingInline: 12,
                          paddingBlock: 4,
                        } as any
                      }
                    >
                      Original
                    </IonButton>

                    <IonButton
                      size="small"
                      fill={songOrigin === 'cover' ? 'solid' : 'outline'}
                      onClick={() => setSongOrigin('cover')}
                      style={
                        {
                          '--background': 'rgba(248,250,252,0.04)',
                          '--background-activated': 'rgba(248,250,252,0.08)',
                          '--color': '#f9a8d4',
                          '--border-color': 'rgba(244,114,182,0.8)',
                          '--border-radius': '999px',
                          fontSize: 12,
                          paddingInline: 12,
                          paddingBlock: 4,
                        } as any
                      }
                    >
                      Cover
                    </IonButton>
                  </div>
                </IonItem>

                {songOrigin === 'cover' && (
                  <IonItem>
                    <IonLabel position="stacked" className="gc-label">
                      Original artist{' '}
                      <span style={{ opacity: 0.6 }}>(required)</span>
                    </IonLabel>
                    <IonInput
                      value={songOriginalArtist}
                      placeholder="e.g., Fleetwood Mac"
                      onIonInput={(e) =>
                        setSongOriginalArtist(String(e.detail.value ?? ''))
                      }
                      style={{ '--padding-start': '0' }}
                    />
                  </IonItem>
                )}

                {/* Key */}
                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Key (optional)
                  </IonLabel>
                  <IonInput
                    value={songKey}
                    placeholder="e.g., G, B♭"
                    onIonInput={(e) => setSongKey(String(e.detail.value ?? ''))}
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>

                {/* ✅ BPM still here */}
                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    BPM (optional)
                  </IonLabel>
                  <IonInput
                    type="number"
                    inputmode="numeric"
                    value={songBpm}
                    placeholder="e.g., 120"
                    onIonInput={(e) => setSongBpm(String(e.detail.value ?? ''))}
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>
              </IonList>

              <div className="gc-buttons">
                <IonButton
                  fill="outline"
                  onClick={() => {
                    setSongTitle('');
                    setSongKey('');
                    setSongBpm('');
                    setSongOrigin('original');
                    setSongOriginalArtist('');
                    setStep('menu');
                  }}
                  className="gc-btn-back"
                >
                  Back
                </IonButton>
                <IonButton
                  onClick={submitCreateSong}
                  disabled={!songBandId || !songTitle.trim()}
                  className="gc-btn-primary gc-btn-primary-song"
                >
                  Create Song
                </IonButton>
              </div>
            </div>
          )}
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={toast.open}
        message={toast.msg}
        duration={2200}
        onDidDismiss={() => setToast({ open: false, msg: '' })}
      />
    </>
  );
}
