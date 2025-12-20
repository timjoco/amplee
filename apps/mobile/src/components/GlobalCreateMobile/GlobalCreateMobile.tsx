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
// GlobalCreateMobile
// ─────────────────────────────────────────────────────────────
/**
 * GlobalCreateMobile
 *
 * A single modal that lets the user create:
 * - Band
 * - Event
 * - Song
 * - Proposal
 *
 * Design goals (KISS / DRY / bug-resistant):
 * - Component orchestrates flow (open/close, step routing, navigation).
 * - Each "form hook" owns its state + validation + submit/reset (single source of truth).
 * - Shared error surface: hooks can report errors into one banner (`error`).
 * - Prevent stale state:
 *   - closeAll() hard-resets step + error + all forms
 *   - opening clears old errors
 * - Smooth UX on mobile:
 *   - pressed states + haptics
 *   - minimal fetches: load bands only when open; load invite data only on newEvent
 *
 * Practical “3 questions” checklist applied:
 * 1) How does it work / why this approach?
 *    - “Container + hooks”: keeps rendering simple and logic isolated/testable.
 * 2) Where could it break?
 *    - stale errors/forms if not reset → closeAll hard reset
 *    - unnecessary queries when closed → data hooks gated by `open` and `step`
 *    - NaN/invalid values → validators in form hooks (bpm/duration/etc)
 * 3) Simplest/most efficient?
 *    - Shared helper submitThenCloseAndNav removes repeated boilerplate.
 *    - Avoid premature abstraction beyond that.
 */
export default function GlobalCreateMobile({
  open: openProp,
  onOpenChange,
  onBandCreated,
}: GlobalCreateMobileProps) {
  const nav = useNavigate();

  /**
   * Toast integration note:
   * Today we pass a noop into form hooks (they call showToast(...) for quick UX).
   * If/when you want to surface toasts in the modal, swap noop for a real toast impl.
   */
  const noop = useCallback(() => {}, []);

  // ─────────────────────────────────────────────────────────────
  // Controlled vs uncontrolled modal open state
  // ─────────────────────────────────────────────────────────────
  // - Controlled: parent passes `open` + `onOpenChange`
  // - Uncontrolled: this component manages open state internally
  const isControlled = typeof openProp === 'boolean';
  const [openUnc, setOpenUnc] = useState(false);
  const open = isControlled ? (openProp as boolean) : openUnc;

  /**
   * Unified setter:
   * - controlled → call the parent callback
   * - uncontrolled → update internal state
   */
  const setOpen = useCallback(
    (v: boolean) => (isControlled ? onOpenChange?.(v) : setOpenUnc(v)),
    [isControlled, onOpenChange]
  );

  // ─────────────────────────────────────────────────────────────
  // Step routing + shared error surface
  // ─────────────────────────────────────────────────────────────
  const [step, setStep] = useState<Step>('menu');

  /**
   * Shared error banner shown near the top of the modal.
   * Form hooks can set this via onError for one consistent UX.
   */
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // Form hooks (declare before any hooks that depend on them)
  // ─────────────────────────────────────────────────────────────
  /**
   * Each form hook owns:
   * - local state (fields)
   * - validation (client-side guardrails)
   * - submit logic (server calls)
   * - reset logic (clear form)
   *
   * Recent “bug-proofing” improvements live inside hooks:
   * - Song: validate BPM + duration to prevent NaN/invalid values reaching DB
   * - Proposal: normalize whitespace for consistent data
   * - Event: only full/roster invite mode (no “custom” path), fewer edge cases
   */
  const bandForm = useNewBandForm({ showToast: noop, onError: setError });
  const eventForm = useNewEventForm({ showToast: noop, onError: setError });
  const songForm = useNewSongForm({ showToast: noop, onError: setError });
  const proposalForm = useNewProposalForm({
    showToast: noop,
    onError: setError,
  });

  // ─────────────────────────────────────────────────────────────
  // Data hooks (gated to avoid wasted work)
  // ─────────────────────────────────────────────────────────────
  /**
   * Loads the user's bands only while the modal is open.
   * - Keeps menu/selector fresh
   * - Avoids network work when the modal is closed
   */
  const { bands, loadingBands, setBands } = useBandsForGlobalCreate(open);

  /**
   * Loads invite-related data ONLY on the newEvent step.
   * - rosters (saved invite lists)
   * (We’re not using “custom roster selection” in B, so we keep this narrow.)
   */
  const { availableRosters, loadingInviteData } = useInviteDataForBand({
    open,
    enabled: step === 'newEvent',
    bandId: eventForm.bandId,
    onError: setError,
  });

  // ─────────────────────────────────────────────────────────────
  // UX helpers: haptics + pressed state
  // ─────────────────────────────────────────────────────────────
  /**
   * Centralized haptics wrapper: avoids duplicating platform checks / try-catch.
   */
  const { impact } = useHaptics();

  /**
   * Pressed-state UX for menu cards/buttons:
   * - sets a short pressed highlight
   * - triggers a haptic
   * - delays the action slightly so the feedback is felt
   */
  const { pressedButton, press } = usePressedAction({
    delayMs: 120,
    onBefore: () => {
      // fire-and-forget: don’t block UI on haptics
      void impact(ImpactStyle.Medium);
    },
  });

  // ─────────────────────────────────────────────────────────────
  // Global open/close + deep-link wiring
  // ─────────────────────────────────────────────────────────────
  /**
   * Centralizes window-level events so this component remains predictable:
   * - open/close requests
   * - “start directly on newEvent/newSong/newProposal” with prefills
   *
   * Important: we pass the form objects so the hook can prefill/reset safely.
   */
  useGlobalCreateEvents({
    setOpen,
    setStep,
    setError,
    eventForm,
    songForm,
    proposalForm,
  });

  // ─────────────────────────────────────────────────────────────
  // Close/reset: the main “anti-stale-state” mechanism
  // ─────────────────────────────────────────────────────────────
  /**
   * Hard reset of the entire modal.
   * This is our #1 “bug prevention” technique:
   * - no stale error banners on reopen
   * - no stale form values
   * - consistent default step
   */
  const closeAll = useCallback(() => {
    setOpen(false);
    setStep('menu');
    setError(null);

    bandForm.reset();
    eventForm.reset();
    songForm.reset();
    proposalForm.reset();
  }, [bandForm, eventForm, songForm, proposalForm, setOpen]);

  // ─────────────────────────────────────────────────────────────
  // DRY helper: submit -> close -> navigate
  // ─────────────────────────────────────────────────────────────
  /**
   * Standard pattern for most creations:
   * - attempt submit
   * - if success: close/reset modal + navigate to created resource
   *
   * Keeps handlers short + consistent across Song/Proposal/Event.
   * (Band is special because we also do optimistic band list update.)
   */
  const submitThenCloseAndNav = useCallback(
    async (
      submitFn: () => Promise<string | null>,
      to: (id: string) => string
    ) => {
      const id = await submitFn();
      if (!id) return;
      closeAll();
      nav(to(id));
    },
    [closeAll, nav]
  );

  // ─────────────────────────────────────────────────────────────
  // Submit handlers (Band has extra optimistic update logic)
  // ─────────────────────────────────────────────────────────────
  /**
   * Create Band:
   * - uses bandForm.submit() which returns the created band object
   * - merges it into local `bands` so UI updates immediately (no refetch lag)
   * - calls parent callback (if provided)
   * - closes modal and navigates into the new band
   */
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

  /**
   * Create Song → navigate to /bands/:bandId/songs/:songId
   */
  const handleSubmitCreateSong = useCallback(
    () =>
      submitThenCloseAndNav(
        () => songForm.submit(),
        (id) => `/bands/${songForm.bandId}/songs/${id}`
      ),
    [submitThenCloseAndNav, songForm]
  );

  /**
   * Create Proposal → navigate to /bands/:bandId/proposals/:proposalId
   */
  const handleSubmitCreateProposal = useCallback(
    () =>
      submitThenCloseAndNav(
        () => proposalForm.submit(),
        (id) => `/bands/${proposalForm.bandId}/proposals/${id}`
      ),
    [submitThenCloseAndNav, proposalForm]
  );

  /**
   * Create Event:
   * - eventForm.submit() can return null if warnings are present (conflicts/same-day)
   * - If warnings exist and user re-submits, we pass bypassConflicts=true
   *   so server-side can allow creation anyway
   */
  const handleSubmitCreateEvent = useCallback(async () => {
    const bypass =
      (eventForm.conflicts?.length || 0) > 0 ||
      (eventForm.sameDayEvents?.length || 0) > 0;

    return submitThenCloseAndNav(
      () => eventForm.submit(bypass ? { bypassConflicts: true } : undefined),
      (id) => `/bands/${eventForm.bandId}/events/${id}`
    );
  }, [eventForm, submitThenCloseAndNav]);

  // ─────────────────────────────────────────────────────────────
  // Error hygiene: clear stale errors on open
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (open) setError(null);
  }, [open]);

  // ─────────────────────────────────────────────────────────────
  // Band selection plumbing
  // ─────────────────────────────────────────────────────────────
  /**
   * Used to keep child step components simple:
   * - they call onBandChange(...)
   * - we route it to the correct form hook based on current step
   */
  const currentBandId =
    step === 'newEvent'
      ? eventForm.bandId
      : step === 'newSong'
      ? songForm.bandId
      : step === 'newProposal'
      ? proposalForm.bandId
      : '';

  /**
   * Event-specific band selection:
   * - sets bandId
   * - resets invite mode to full (B: no custom invite path)
   * - clears roster selection
   *
   * Prevents subtle “wrong band roster” bugs when switching bands.
   */
  const selectBandForEvent = useCallback(
    (id: string) => {
      eventForm.setBandId(id);
      eventForm.setInviteMode('full');
      eventForm.setSelectedRosterId('');
    },
    [eventForm]
  );

  const handleBandChange = useCallback(
    (val: string) => {
      if (step === 'newEvent') {
        selectBandForEvent(val);
      } else if (step === 'newSong') {
        songForm.setBandId(val);
      } else if (step === 'newProposal') {
        proposalForm.setBandId(val);
      }
    },
    [step, selectBandForEvent, songForm, proposalForm]
  );

  /**
   * Step navigation:
   * - If user has bands, default-select the first band when entering a creation step.
   * - Keeps the step UX smooth (no blank selects) and reduces “why can’t I submit?” friction.
   */
  const goToStep = useCallback(
    (next: Step) => {
      const firstBandId = bands[0]?.id;

      if (firstBandId) {
        if (next === 'newEvent' && !eventForm.bandId)
          selectBandForEvent(firstBandId);
        if (next === 'newSong' && !songForm.bandId)
          songForm.setBandId(firstBandId);
        if (next === 'newProposal' && !proposalForm.bandId)
          proposalForm.setBandId(firstBandId);
      }

      setStep(next);
    },
    [bands, eventForm, songForm, proposalForm, setStep, selectBandForEvent]
  );

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <IonModal isOpen={open} onDidDismiss={closeAll} className="gc-modal-root">
      <HeaderBar
        step={step}
        onBack={() => {
          void impact(ImpactStyle.Medium);
          goToStep('menu');
        }}
        onClose={closeAll}
      />

      <IonContent className="gc-content">
        <BackgroundFX />

        <div className="gc-main-content">
          {/* Shared error banner (hook-reported + createBandErr passthrough) */}
          {(error || bandForm.createBandErr) && (
            <div className="gc-error-box">
              {error || bandForm.createBandErr}
            </div>
          )}

          {step === 'menu' && (
            <MenuStep
              bands={bands}
              loadingBands={loadingBands}
              pressedButton={pressedButton}
              onPress={(id, next) => press(id, () => goToStep(next))}
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

        {/* EventPickers is mounted once and controlled via eventForm flags to avoid remount jitter */}
        <EventPickers eventForm={eventForm as any} />
      </IonContent>
    </IonModal>
  );
}
