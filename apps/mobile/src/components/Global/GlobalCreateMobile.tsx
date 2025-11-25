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
import {
  useNewBandForm,
  useNewEventForm,
  useNewProposalForm,
  useNewSongForm,
  type BandLite,
} from '../../hooks/useGlobalCreateForms';
import { supabase } from '../../lib/supabase';
import EventDateTimePicker from '../ui/EventDateTimePicker';
import './GlobalCreateMobile.css';

export type GlobalCreateMobileProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onBandCreated?: (band: BandLite) => void;
};

type Step = 'menu' | 'newBand' | 'newEvent' | 'newSong' | 'newProposal';

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

// ---------- Small Reusable Pieces ----------

type MenuCardProps = {
  id: Step;
  title: string;
  description: string;
  icon: string;
  className: string;
  pressedId: string | null;
  onCardClick: () => void;
  handlePressStart: (
    id: string,
    e:
      | React.TouchEvent<HTMLDivElement>
      | React.MouseEvent<HTMLDivElement, MouseEvent>
  ) => void;
  handlePressMove: (e: React.TouchEvent<HTMLDivElement>) => void;
  handlePressEnd: () => void;
};

function MenuCard({
  id,
  title,
  description,
  icon,
  className,
  pressedId,
  onCardClick,
  handlePressStart,
  handlePressMove,
  handlePressEnd,
}: MenuCardProps) {
  const isPressed = pressedId === id;

  return (
    <IonItem
      button
      detail={false}
      lines="none"
      onClick={onCardClick}
      style={{
        ['--background' as any]: 'transparent',
        ['--background-hover' as any]: 'transparent',
        ['--background-activated' as any]: 'transparent',
        ['--ripple-color' as any]: 'transparent',
        marginInline: -8,
        paddingInline: 0,
        paddingBlock: 3,
      }}
      className={className}
    >
      <div
        onTouchStart={(ev) => handlePressStart(id, ev)}
        onTouchMove={handlePressMove}
        onTouchEnd={handlePressEnd}
        onTouchCancel={handlePressEnd}
        onMouseDown={(ev) => handlePressStart(id, ev)}
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
            <IonIcon icon={icon} style={{ fontSize: 20 }} />
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
              {title}
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
              {description}
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
    </IonItem>
  );
}

type BandSelectRowProps = {
  label: string;
  value: string;
  onChange: (id: string) => void;
  bands: BandLite[];
  loadingBands: boolean;
  ensureBandsLoaded: () => void | Promise<void>;
};

function BandSelectRow({
  label,
  value,
  onChange,
  bands,
  loadingBands,
  ensureBandsLoaded,
}: BandSelectRowProps) {
  return (
    <IonItem>
      <IonLabel position="stacked" className="gc-label">
        {label}
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
          value={value}
          onIonChange={(e) => onChange(String(e.detail.value))}
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
  );
}

// ---------- Main Component ----------

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

  // ---- Bands list for selects ----
  const [bands, setBands] = React.useState<BandLite[]>([]);
  const [loadingBands, setLoadingBands] = React.useState(false);

  // haptics for press
  const longPressTimeoutRef = React.useRef<number | null>(null);
  const pressStartRef = React.useRef<{ x: number; y: number } | null>(null);
  const [pressedId, setPressedId] = React.useState<string | null>(null);
  const MOVE_THRESHOLD = 12;

  const showToast = (msg: string) => setToast({ open: true, msg });

  // hooks for each form
  const bandForm = useNewBandForm({
    showToast,
    onError: setError,
  });

  const eventForm = useNewEventForm({
    showToast,
    onError: setError,
  });

  const songForm = useNewSongForm({
    showToast,
    onError: setError,
  });

  const proposalForm = useNewProposalForm({
    showToast,
    onError: setError,
  });

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
          eventForm.setBandId(detail.bandId);
        }
      } else if (kind === 'song') {
        setStep('newSong');
        if (detail.bandId) {
          songForm.setBandId(detail.bandId);
        }
      } else if (kind === 'proposal') {
        setStep('newProposal');
        if (detail.bandId) {
          proposalForm.setBandId(detail.bandId);
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
  }, [setOpen, eventForm, songForm, proposalForm]);

  const ensureBandsLoaded = React.useCallback(async () => {
    setLoadingBands(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        showToast('Please sign in first.');
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

      if (mapped.length && !eventForm.bandId) {
        eventForm.setBandId(mapped[0].id);
      }
      if (mapped.length && !songForm.bandId) {
        songForm.setBandId(mapped[0].id);
      }
      if (mapped.length && !proposalForm.bandId) {
        proposalForm.setBandId(mapped[0].id);
      }
    } catch (e: any) {
      setError(String(e?.message ?? 'Failed to load your bands'));
    } finally {
      setLoadingBands(false);
    }
  }, [eventForm, proposalForm, songForm]);

  const closeAll = React.useCallback(() => {
    setOpen(false);
    setStep('menu');
    setError(null);

    bandForm.reset();
    eventForm.reset();
    songForm.reset();
    proposalForm.reset();
  }, [bandForm, eventForm, songForm, proposalForm, setOpen]);

  const handleSubmitCreateBand = React.useCallback(async () => {
    const created = await bandForm.submit();
    if (!created) return;

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
  }, [bandForm, closeAll, nav, onBandCreated]);

  const handleSubmitCreateEvent = React.useCallback(async () => {
    const id = await eventForm.submit();
    if (!id) return;

    closeAll();
    nav(`/bands/${eventForm.bandId}/events/${id}`);
  }, [eventForm, closeAll, nav]);

  const handleSubmitCreateSong = React.useCallback(async () => {
    const id = await songForm.submit();
    if (!id) return;

    closeAll();
    nav(`/bands/${songForm.bandId}/songs/${id}`);
  }, [songForm, closeAll, nav]);

  const handleSubmitCreateProposal = React.useCallback(async () => {
    const id = await proposalForm.submit();
    if (!id) return;

    closeAll();
    nav(`/bands/${proposalForm.bandId}/proposals/${id}`);
  }, [proposalForm, closeAll, nav]);

  React.useEffect(() => {
    if (!open) return;
    if (!bands.length && !loadingBands) {
      void ensureBandsLoaded();
    }
  }, [open, bands.length, loadingBands, ensureBandsLoaded]);

  React.useEffect(() => {
    if (open) {
      setError(null);
    }
  }, [open]);

  return (
    <>
      <IonModal
        isOpen={open}
        onDidDismiss={closeAll}
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
          {(error || bandForm.createBandErr) && (
            <div className="gc-error-box">
              {error || bandForm.createBandErr}
            </div>
          )}

          {step === 'menu' && (
            <div className="gc-menu-container">
              <MenuCard
                id="newBand"
                title="New Band"
                description="Create a new project or solo act."
                icon={gridOutline}
                className="gc-card-band"
                pressedId={pressedId}
                onCardClick={() => setStep('newBand')}
                handlePressStart={handlePressStart}
                handlePressMove={handlePressMove}
                handlePressEnd={handlePressEnd}
              />

              {/* Only show Event if user has at least one band */}
              {bands.length > 0 && (
                <MenuCard
                  id="newEvent"
                  title="New Event"
                  description="Schedule a show or rehearsal."
                  icon={calendarOutline}
                  className="gc-card-event"
                  pressedId={pressedId}
                  onCardClick={() => setStep('newEvent')}
                  handlePressStart={handlePressStart}
                  handlePressMove={handlePressMove}
                  handlePressEnd={handlePressEnd}
                />
              )}

              {bands.length > 0 && (
                <MenuCard
                  id="newProposal"
                  title="New Proposal"
                  description="Pitch a gig idea for your band."
                  icon={clipboardOutline}
                  className="gc-card-proposal"
                  pressedId={pressedId}
                  onCardClick={() => setStep('newProposal')}
                  handlePressStart={handlePressStart}
                  handlePressMove={handlePressMove}
                  handlePressEnd={handlePressEnd}
                />
              )}

              {bands.length > 0 && (
                <MenuCard
                  id="newSong"
                  title="New Song"
                  description="Add a song to your band's library."
                  icon={musicalNotesOutline}
                  className="gc-card-song"
                  pressedId={pressedId}
                  onCardClick={() => setStep('newSong')}
                  handlePressStart={handlePressStart}
                  handlePressMove={handlePressMove}
                  handlePressEnd={handlePressEnd}
                />
              )}
            </div>
          )}

          {/* ---- New Band ---- */}
          {step === 'newBand' && (
            <div className="gc-form-shell">
              <IonList className="gc-list" lines="full">
                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Band name
                  </IonLabel>
                  <IonInput
                    value={bandForm.bandName}
                    placeholder="e.g., Teem and Tiger"
                    onIonInput={(e) =>
                      bandForm.setBandName(String(e.detail.value ?? ''))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        void handleSubmitCreateBand();
                      }
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
                      {bandForm.avatarPreview ? (
                        <img
                          src={bandForm.avatarPreview}
                          alt="Preview"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        bandForm.bandName.trim().slice(0, 2).toUpperCase() ||
                        '??'
                      )}
                    </div>

                    <IonButton
                      fill="outline"
                      size="small"
                      onClick={() => bandForm.fileInputRef.current?.click()}
                    >
                      {bandForm.avatarPreview ? 'Change image' : 'Add image'}
                    </IonButton>

                    <input
                      ref={bandForm.fileInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={bandForm.pickAvatar}
                    />
                  </div>
                </IonItem>
              </IonList>

              <div className="gc-buttons">
                <IonButton
                  fill="outline"
                  onClick={() => {
                    bandForm.reset();
                    setStep('menu');
                  }}
                  className="gc-btn-back"
                >
                  Back
                </IonButton>
                <IonButton
                  onClick={handleSubmitCreateBand}
                  disabled={!bandForm.bandName.trim() || bandForm.creatingBand}
                  className="gc-btn-primary gc-btn-primary-band"
                >
                  {bandForm.creatingBand ? (
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

          {/* ---- New Event ---- */}
          {step === 'newEvent' && (
            <div className="gc-form-shell">
              <IonList className="gc-list" lines="full">
                <BandSelectRow
                  label="Band"
                  value={eventForm.bandId}
                  onChange={eventForm.setBandId}
                  bands={bands}
                  loadingBands={loadingBands}
                  ensureBandsLoaded={ensureBandsLoaded}
                />

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Title
                  </IonLabel>
                  <IonInput
                    value={eventForm.title}
                    placeholder="e.g., Show @ The Rino"
                    onIonInput={(e) =>
                      eventForm.setTitle(String(e.detail.value ?? ''))
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
                    value={eventForm.type}
                    onIonChange={(e) =>
                      eventForm.setType(e.detail.value as any)
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
                  <div
                    style={{
                      width: '100%',
                      paddingTop: 8,
                      paddingBottom: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => eventForm.setShowStartsPicker(true)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        background: 'rgba(30, 41, 59, 0.8)',
                        color: eventForm.starts ? '#e5e7eb' : '#9ca3af',
                        fontSize: 15,
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s',
                      }}
                    >
                      {eventForm.starts
                        ? new Date(eventForm.starts).toLocaleString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'Select start date & time'}
                    </button>
                  </div>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Ends (optional)
                  </IonLabel>
                  <div
                    style={{
                      width: '100%',
                      paddingTop: 8,
                      paddingBottom: 8,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => eventForm.setShowEndsPicker(true)}
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: '1px solid rgba(139, 92, 246, 0.3)',
                        background: 'rgba(30, 41, 59, 0.8)',
                        color: eventForm.ends ? '#e5e7eb' : '#9ca3af',
                        fontSize: 15,
                        fontWeight: 600,
                        textAlign: 'left',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        transition: 'all 0.2s',
                      }}
                    >
                      {eventForm.ends
                        ? new Date(eventForm.ends).toLocaleString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: '2-digit',
                          })
                        : 'Select end date & time'}
                    </button>
                  </div>
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Location (optional)
                  </IonLabel>
                  <IonInput
                    value={eventForm.location}
                    onIonInput={(e) =>
                      eventForm.setLocation(String(e.detail.value ?? ''))
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
                    eventForm.reset();
                    setStep('menu');
                  }}
                  className="gc-btn-back"
                >
                  Back
                </IonButton>
                <IonButton
                  onClick={handleSubmitCreateEvent}
                  disabled={
                    !eventForm.bandId ||
                    !eventForm.title.trim() ||
                    !eventForm.starts
                  }
                  className="gc-btn-primary gc-btn-primary-event"
                >
                  Create Event
                </IonButton>
              </div>
            </div>
          )}

          {/* ---- New Proposal ---- */}
          {step === 'newProposal' && (
            <div className="gc-form-shell">
              <IonList className="gc-list" lines="full">
                <BandSelectRow
                  label="Band"
                  value={proposalForm.bandId}
                  onChange={proposalForm.setBandId}
                  bands={bands}
                  loadingBands={loadingBands}
                  ensureBandsLoaded={ensureBandsLoaded}
                />

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Proposal title
                  </IonLabel>
                  <IonInput
                    value={proposalForm.title}
                    placeholder="e.g., Friday night at Riverfront"
                    onIonInput={(e) =>
                      proposalForm.setTitle(String(e.detail.value ?? ''))
                    }
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Venue (optional)
                  </IonLabel>
                  <IonInput
                    value={proposalForm.venue}
                    placeholder="The Record Bar"
                    onIonInput={(e) =>
                      proposalForm.setVenue(String(e.detail.value ?? ''))
                    }
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>
              </IonList>

              <div className="gc-buttons">
                <IonButton
                  fill="outline"
                  onClick={() => {
                    proposalForm.reset();
                    setStep('menu');
                  }}
                  className="gc-btn-back"
                >
                  Back
                </IonButton>
                <IonButton
                  onClick={handleSubmitCreateProposal}
                  disabled={!proposalForm.bandId || !proposalForm.title.trim()}
                  className="gc-btn-primary gc-btn-primary-proposal"
                >
                  Create Proposal
                </IonButton>
              </div>
            </div>
          )}

          {/* ---- New Song ---- */}
          {step === 'newSong' && (
            <div className="gc-form-shell">
              <IonList className="gc-list" lines="full">
                <BandSelectRow
                  label="Band"
                  value={songForm.bandId}
                  onChange={songForm.setBandId}
                  bands={bands}
                  loadingBands={loadingBands}
                  ensureBandsLoaded={ensureBandsLoaded}
                />

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Song title
                  </IonLabel>
                  <IonInput
                    value={songForm.title}
                    placeholder="e.g., Meadowlark & the Bluebird"
                    onIonInput={(e) =>
                      songForm.setTitle(String(e.detail.value ?? ''))
                    }
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Origin
                  </IonLabel>
                  <div
                    style={{
                      display: 'flex',
                      gap: 8,
                      marginTop: 8,
                      marginBottom: 4,
                    }}
                  >
                    <IonButton
                      size="small"
                      fill={
                        songForm.origin === 'original' ? 'solid' : 'outline'
                      }
                      onClick={() => songForm.setOrigin('original')}
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
                      fill={songForm.origin === 'cover' ? 'solid' : 'outline'}
                      onClick={() => songForm.setOrigin('cover')}
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

                {songForm.origin === 'cover' && (
                  <IonItem>
                    <IonLabel position="stacked" className="gc-label">
                      Original artist{' '}
                      <span style={{ opacity: 0.6 }}>(required)</span>
                    </IonLabel>
                    <IonInput
                      value={songForm.originalArtist}
                      placeholder="e.g., Fleetwood Mac"
                      onIonInput={(e) =>
                        songForm.setOriginalArtist(String(e.detail.value ?? ''))
                      }
                      style={{ '--padding-start': '0' }}
                    />
                  </IonItem>
                )}

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    Key (optional)
                  </IonLabel>
                  <IonInput
                    value={songForm.key}
                    placeholder="e.g., G, B♭"
                    onIonInput={(e) =>
                      songForm.setKey(String(e.detail.value ?? ''))
                    }
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>

                <IonItem>
                  <IonLabel position="stacked" className="gc-label">
                    BPM (optional)
                  </IonLabel>
                  <IonInput
                    type="number"
                    inputmode="numeric"
                    value={songForm.bpm}
                    placeholder="e.g., 120"
                    onIonInput={(e) =>
                      songForm.setBpm(String(e.detail.value ?? ''))
                    }
                    style={{ '--padding-start': '0' }}
                  />
                </IonItem>
              </IonList>

              <div className="gc-buttons">
                <IonButton
                  fill="outline"
                  onClick={() => {
                    songForm.reset();
                    setStep('menu');
                  }}
                  className="gc-btn-back"
                >
                  Back
                </IonButton>
                <IonButton
                  onClick={handleSubmitCreateSong}
                  disabled={!songForm.bandId || !songForm.title.trim()}
                  className="gc-btn-primary gc-btn-primary-song"
                >
                  Create Song
                </IonButton>
              </div>
            </div>
          )}
        </IonContent>

        {/* Date pickers */}
        <EventDateTimePicker
          open={eventForm.showStartsPicker}
          label="Event Start Date & Time"
          value={eventForm.starts || undefined}
          onChange={(iso) => {
            if (iso) eventForm.setStarts(iso);
            eventForm.setShowStartsPicker(false);
          }}
          onDismiss={() => eventForm.setShowStartsPicker(false)}
        />

        <EventDateTimePicker
          open={eventForm.showEndsPicker}
          label="Event End Date & Time"
          value={eventForm.ends || undefined}
          min={eventForm.starts || undefined}
          onChange={(iso) => {
            if (iso) {
              eventForm.setEnds(iso);
            } else {
              eventForm.setEnds('');
            }
            eventForm.setShowEndsPicker(false);
          }}
          onDismiss={() => eventForm.setShowEndsPicker(false)}
        />
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
