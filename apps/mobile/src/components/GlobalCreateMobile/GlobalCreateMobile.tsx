/* eslint-disable @typescript-eslint/no-explicit-any */
import { ImpactStyle } from '@capacitor/haptics';
import { IonContent, IonModal } from '@ionic/react';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './GlobalCreateMobile.css';

import {
  useBandsForGlobalCreate,
  useGlobalCreateEvents,
  useHaptics,
  useInviteDataForBand,
  useNewBandForm,
  useNewEventForm,
  useNewProposalForm,
  useNewSongForm,
  usePressedAction,
} from './hooks';

import BackgroundFX from './components/BackgroundFX';
import EventPickers from './components/EventPickers';
import HeaderBar from './components/HeaderBar';
import MenuStep from './components/MenuStep';
import NewBandStep from './components/NewBandStep';
import NewEventStep from './components/NewEventStep';
import NewProposalStep from './components/NewProposalStep';
import NewSongStep from './components/NewSongStep';
import type { GlobalCreateMobileProps, Step } from './types';
import { mergeLocalBands } from './utils/mergeLocalBands';
// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────

export default function GlobalCreateMobile({
  open: openProp,
  onOpenChange,
  onBandCreated,
}: GlobalCreateMobileProps) {
  const nav = useNavigate();

  // Support both controlled + uncontrolled usage:
  //
  // - Controlled: parent passes `open` + `onOpenChange` and owns the state.
  // - Uncontrolled: this component owns the open/close state internally.
  const isControlled = typeof openProp === 'boolean';

  // Internal open state for uncontrolled mode only.
  const [openUnc, setOpenUnc] = useState(false);

  // The actual "source of truth" for whether the modal is open.
  const open = isControlled ? (openProp as boolean) : openUnc;

  // Unified setter that works in both modes:
  // - controlled → call the parent callback
  // - uncontrolled → update internal state
  const setOpen = useCallback(
    (v: boolean) => (isControlled ? onOpenChange?.(v) : setOpenUnc(v)),
    [isControlled, onOpenChange]
  );

  // Which screen the modal is currently showing (menu/newBand/newEvent/etc).
  // This drives what UI gets rendered.
  const [step, setStep] = useState<Step>('menu');

  // Shared error surface for the modal.
  // Individual hooks can report errors into here so the UI has one place to render them.
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // Form hooks (MUST be declared before hooks that depend on them)
  // ─────────────────────────────────────────────────────────────
  // Each form hook owns its local fields + validation + submit/reset behavior.
  // We pass `onError` so any failure is surfaced in the shared `error` UI.

  // Band creation form state + submit logic
  const bandForm = useNewBandForm({
    showToast: () => {}, // (optional) caller controls toast UX; currently no-op
    onError: setError, // route errors into the modal's shared error banner
  });

  // Event creation form state + conflict checking + submit logic
  const eventForm = useNewEventForm({
    showToast: () => {},
    onError: setError,
  });

  // Song creation form state + submit logic
  const songForm = useNewSongForm({
    showToast: () => {},
    onError: setError,
  });

  // Proposal creation form state + submit logic
  const proposalForm = useNewProposalForm({
    showToast: () => {},
    onError: setError,
  });

  // ─────────────────────────────────────────────────────────────
  // Data hooks
  // ─────────────────────────────────────────────────────────────

  // Load the user's bands when the modal is open.
  // This keeps the band list fresh and avoids loading work when the modal is closed.
  const { bands, loadingBands, setBands } = useBandsForGlobalCreate(open);

  // Load invite-related data only when needed (newEvent step):
  // - rosters (saved invite lists)
  // - (optionally) members, if you later need them for "custom invitee selection"
  // Gated by `enabled` to prevent unnecessary queries while on other steps.
  const { availableRosters, loadingInviteData } = useInviteDataForBand({
    open,
    enabled: step === 'newEvent', // only fetch invite data when we're creating an event
    bandId: eventForm.bandId, // fetch rosters/members for the selected band
    onError: setError, // show fetch errors in the shared error UI
  });

  // Centralized haptics wrapper.
  // Keeping it as a hook means UI components just call `impact(...)` without needing to know about platform checks, try/catch, etc.
  const { impact } = useHaptics();

  // Standard “pressed” UX for menu cards/buttons:
  // - tracks which button is currently pressed (for CSS)
  // - delays the action slightly so the pressed state + haptic can be felt
  const { pressedButton, press } = usePressedAction({
    delayMs: 120,
    onBefore: () => {
      // fire-and-forget: we don't want UI blocked on haptics
      void impact(ImpactStyle.Medium);
    },
  });

  // Global open/close + deep-link event wiring.
  // This hook centralizes window event listeners like:
  // - global-create:open / close
  // - amplee:global-create (open directly into event/song/proposal with prefilled info)
  useGlobalCreateEvents({
    setOpen,
    setStep,
    setError,
    eventForm,
    songForm,
    proposalForm,
  });

  // "Hard reset" of modal state.
  // We do this on close (and after successful submissions) so:
  // - reopening starts at the menu
  // - stale errors don’t persist
  // - forms don’t keep old values (especially important on mobile)
  const closeAll = useCallback(() => {
    setOpen(false);
    setStep('menu');
    setError(null);
    bandForm.reset();
    eventForm.reset();
    songForm.reset();
    proposalForm.reset();
  }, [bandForm, eventForm, songForm, proposalForm, setOpen]);

  // Submit band creation via the band form hook. If creation succeeds, we optimistically merge the new band into the local `bands` list
  // so the menu/selector updates immediately without waiting for a refetch.
  // Then we notify parent listeners, reset/close the modal, and navigate into the new band.
  const handleSubmitCreateBand = useCallback(async () => {
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
  }, [bandForm, closeAll, nav, onBandCreated, setBands]);

  // Create an event. If we already detected conflicts or same-day events,
  // we pass a "bypassConflicts" flag so the server-side logic can allow creation anyway.
  // On success we close/reset and route straight into the new event detail screen.
  const handleSubmitCreateEvent = useCallback(async () => {
    const bypass =
      (eventForm.conflicts?.length || 0) > 0 ||
      (eventForm.sameDayEvents?.length || 0) > 0;

    const id = await eventForm.submit(
      bypass ? { bypassConflicts: true } : undefined
    );
    if (!id) return;

    closeAll();
    nav(`/bands/${eventForm.bandId}/events/${id}`);
  }, [eventForm, closeAll, nav]);

  // Create a song, then route into that song.
  // We close/reset first to avoid leaving the modal mounted with stale form state
  // and to keep navigation transitions clean on mobile.
  const handleSubmitCreateSong = useCallback(async () => {
    const id = await songForm.submit();
    if (!id) return;
    closeAll();
    nav(`/bands/${songForm.bandId}/songs/${id}`);
  }, [songForm, closeAll, nav]);

  // Create a proposal, then route into that proposal.
  // Same pattern: submit -> early return if it failed -> close/reset -> navigate.
  const handleSubmitCreateProposal = useCallback(async () => {
    const id = await proposalForm.submit();
    if (!id) return;
    closeAll();
    nav(`/bands/${proposalForm.bandId}/proposals/${id}`);
  }, [proposalForm, closeAll, nav]);

  // Any time the modal opens, clear any previous error message so the user
  // doesn't see a stale error from a prior attempt/session.
  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  // Get current band ID based on step
  const currentBandId =
    step === 'newEvent'
      ? eventForm.bandId
      : step === 'newSong'
      ? songForm.bandId
      : proposalForm.bandId;

  // Memoized so child step components don’t re-render unnecessarily
  // when this handler is passed down. Depends on `step` and form APIs
  // to ensure the correct form is updated when the band changes.
  const handleBandChange = useCallback(
    (val: string) => {
      if (step === 'newEvent') {
        eventForm.setBandId(val);

        // reset invite selection when switching bands
        eventForm.setInviteMode('full');
        eventForm.setSelectedRosterId('');
        eventForm.setSelectedUserIds([]);
      } else if (step === 'newSong') {
        songForm.setBandId(val);
      } else {
        proposalForm.setBandId(val);
      }
    },
    [step, eventForm, songForm, proposalForm]
  );

  return (
    <IonModal isOpen={open} onDidDismiss={closeAll} className="gc-modal-root">
      <HeaderBar
        step={step}
        onBack={() => {
          void impact(ImpactStyle.Medium);
          setStep('menu');
        }}
        onClose={closeAll}
      />

      <IonContent className="gc-content">
        <BackgroundFX />

        <div className="gc-main-content">
          {/* Error message */}
          {(error || bandForm.createBandErr) && (
            <div className="gc-error-box">
              {error || bandForm.createBandErr}
            </div>
          )}

          {step === 'menu' && (
            <MenuStep
              bands={bands}
              pressedButton={pressedButton}
              onPress={(id, next) => press(id, () => setStep(next))}
            />
          )}

          {step === 'newBand' && (
            <NewBandStep
              bandForm={bandForm}
              onSubmit={handleSubmitCreateBand}
            />
          )}

          {step === 'newEvent' && (
            <NewEventStep
              bands={bands}
              loadingBands={loadingBands}
              currentBandId={currentBandId}
              onBandChange={handleBandChange}
              eventForm={eventForm as any}
              availableRosters={availableRosters}
              loadingInviteData={loadingInviteData}
              triggerHaptic={() => void impact(ImpactStyle.Medium)}
              onSubmit={handleSubmitCreateEvent}
            />
          )}

          {step === 'newSong' && (
            <NewSongStep
              bands={bands}
              loadingBands={loadingBands}
              currentBandId={currentBandId}
              onBandChange={handleBandChange}
              songForm={songForm as any}
              onSubmit={handleSubmitCreateSong}
            />
          )}

          {step === 'newProposal' && (
            <NewProposalStep
              bands={bands}
              loadingBands={loadingBands}
              currentBandId={currentBandId}
              onBandChange={handleBandChange}
              proposalForm={proposalForm as any}
              onSubmit={handleSubmitCreateProposal}
            />
          )}
        </div>

        <EventPickers eventForm={eventForm as any} />
      </IonContent>
    </IonModal>
  );
}
