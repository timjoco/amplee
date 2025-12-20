/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useState } from 'react';
import { createEvent, type EventType } from '../../../lib/events/createEvents';
import {
  getBandSameDayEvents,
  type BandSameDayEvent,
} from '../../../lib/events/getBandSameDayEvents';
import {
  getEventAvailabilityConflicts,
  type EventAvailabilityConflict,
} from '../../../lib/events/getEventAvailabilityConflicts';
import { supabase } from '../../../lib/supabase';
import type { InviteMode } from '../types'; // 'full' | 'roster'
import { normalizeCreateEventError } from '../utils/errors';
import type { ShowToast } from './useNewBandForm';

/**
 * useNewEventForm (GlobalCreateMobile)
 *
 * This hook powers the "New Event" step inside GlobalCreateMobile.
 *
 * How GlobalCreateMobile uses it:
 * - Reads fields like `title`, `starts`, `inviteMode` to render inputs in <NewEventStep />
 * - Uses setters like `setBandId`, `setStarts`, `setInviteMode` as input handlers
 * - Calls `submit()` when the user taps "Create" (see handleSubmitCreateEvent)
 * - Calls `reset()` when the modal closes via closeAll() so stale state doesn't persist
 *
 * Important product rule (B):
 * - No "custom member picking" invites.
 * - Invite options are ONLY:
 *    1) full band
 *    2) saved roster
 */
export function useNewEventForm(opts: {
  showToast: ShowToast;
  onError?: (msg: string | null) => void;
}) {
  const { showToast, onError } = opts;

  // ─────────────────────────────────────────────────────────────
  // Core event fields (bound to inputs in <NewEventStep />)
  // ─────────────────────────────────────────────────────────────
  const [bandId, setBandId] = useState(''); // selected band for the new event
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('show'); // 'show' | 'practice'
  const [starts, setStarts] = useState(''); // ISO string (or whatever your picker emits)
  const [ends, setEnds] = useState('');
  const [location, setLocation] = useState('');

  // UI toggles for date/time pickers (controlled by <EventPickers />)
  const [showStartsPicker, setShowStartsPicker] = useState(false);
  const [showEndsPicker, setShowEndsPicker] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // Conflict / warning surfaces (rendered by <NewEventStep />)
  // ─────────────────────────────────────────────────────────────
  const [conflicts, setConflicts] = useState<EventAvailabilityConflict[]>([]);
  const [sameDayEvents, setSameDayEvents] = useState<BandSameDayEvent[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  // ─────────────────────────────────────────────────────────────
  // Invite resolution (B-mode: full band OR saved roster only)
  // ─────────────────────────────────────────────────────────────
  const [inviteMode, setInviteMode] = useState<InviteMode>('full');
  const [selectedRosterId, setSelectedRosterId] = useState('');

  /**
   * Resolves the invite list based on the user's selection in <NewEventStep />.
   *
   * Used inside submit():
   * - if inviteMode === 'full' → query band_members and invite everyone
   * - if inviteMode === 'roster' → query band_roster_members and invite that roster
   *
   * NOTE: We intentionally do NOT support "custom" invites in B-mode.
   */
  async function resolveInviteUserIds(): Promise<string[]> {
    if (!bandId) return [];

    if (inviteMode === 'full') {
      const { data, error } = await supabase
        .from('band_members')
        .select('user_id')
        .eq('band_id', bandId);

      if (error) throw error;
      return (data ?? []).map((r: any) => r.user_id).filter(Boolean);
    }

    // roster mode
    if (!selectedRosterId) throw new Error('Select a roster.');
    const { data, error } = await supabase
      .from('band_roster_members')
      .select('user_id')
      .eq('roster_id', selectedRosterId);

    if (error) throw error;
    return (data ?? []).map((r: any) => r.user_id).filter(Boolean);
  }

  /**
   * After creating the event row, we also populate event_members for chat/attendance/etc.
   *
   * Used inside submit() after createEvent() succeeds.
   * - Upserts (event_id, user_id) rows and sets initial status to 'pending'
   */
  async function upsertEventMembers(eventId: string, userIds: string[]) {
    const unique = Array.from(new Set(userIds)).filter(Boolean);
    if (unique.length === 0) return;

    const rows = unique.map((uid) => ({
      event_id: eventId,
      user_id: uid,
      status: 'pending',
    }));

    const { error } = await supabase.from('event_members').upsert(rows as any, {
      onConflict: 'event_id,user_id',
    });

    if (error) throw error;
  }

  /**
   * Whenever the band or start time changes, wipe any previously computed warnings.
   *
   * Why:
   * - conflicts/sameDay warnings are specific to bandId + startsAt + invite list.
   * - leaving stale warnings displayed is confusing.
   *
   * Triggered when:
   * - user changes band in <NewEventStep />
   * - user changes start time via <EventPickers />
   */
  useEffect(() => {
    if (!bandId || !starts) {
      setConflicts([]);
      setSameDayEvents([]);
      setCheckingConflicts(false);
      return;
    }
    setConflicts([]);
    setSameDayEvents([]);
    setCheckingConflicts(false);
  }, [bandId, starts]);

  /**
   * Resets local state back to defaults.
   *
   * Used by GlobalCreateMobile.closeAll() when:
   * - modal is dismissed
   * - a creation succeeds and we want a clean slate next open
   *
   * NOTE:
   * - We do not reset bandId here by default; GlobalCreateMobile may set a default band
   *   when navigating to the step (goToStep). If you want a true "always blank", add:
   *   setBandId('');
   */
  const reset = useCallback(() => {
    setTitle('');
    setType('show');
    setStarts('');
    setEnds('');
    setLocation('');
    setConflicts([]);
    setSameDayEvents([]);
    setCheckingConflicts(false);

    setInviteMode('full');
    setSelectedRosterId('');

    setShowStartsPicker(false);
    setShowEndsPicker(false);
  }, []);

  /**
   * Submits the new event.
   *
   * Called by GlobalCreateMobile.handleSubmitCreateEvent():
   * - First call usually runs with bypassConflicts=false
   * - If warnings were found, the UI can call again with bypassConflicts=true
   *   (your parent does this by computing `bypass` from conflicts/sameDayEvents)
   *
   * Returns:
   * - eventId (string) on success
   * - null on failure OR if warnings are found (when bypassConflicts is false)
   */
  const submit = useCallback(
    async (opts?: { bypassConflicts?: boolean }) => {
      const bypassConflicts = opts?.bypassConflicts ?? false;

      // Basic validation (fast UX feedback)
      if (!bandId) return showToast('Choose a band.'), null;
      if (!title.trim()) return showToast('Add a title.'), null;
      if (!starts) return showToast('Pick a start date/time.'), null;

      onError?.(null);
      setConflicts([]);
      setSameDayEvents([]);

      // Resolve invite list (B-mode: full or roster)
      let inviteUserIds: string[] = [];
      try {
        inviteUserIds = await resolveInviteUserIds();
      } catch (e: any) {
        showToast(String(e?.message ?? 'Select invitees.'));
        return null;
      }

      // Optional conflict checking pass (can be bypassed if user confirms)
      if (!bypassConflicts) {
        try {
          setCheckingConflicts(true);

          const startsDate = new Date(starts);
          if (Number.isNaN(+startsDate)) throw new Error('Invalid start date.');

          const [memberConflicts, sameDay] = await Promise.all([
            getEventAvailabilityConflicts({
              bandId,
              startsAt: startsDate,
              userIds: inviteUserIds,
            } as any),
            getBandSameDayEvents({ bandId, startsAt: startsDate }),
          ]);

          setConflicts(memberConflicts);
          setSameDayEvents(sameDay);

          // If warnings exist, stop here so the UI can show them and ask the user to confirm
          if (memberConflicts.length > 0 || sameDay.length > 0) {
            showToast('Warnings found. You can still create anyway.');
            return null;
          }
        } catch (e: any) {
          console.error('[checkEventAvailability]', e);
          onError?.(String(e?.message ?? 'Could not check availability.'));
          return null;
        } finally {
          setCheckingConflicts(false);
        }
      }

      // Create event + populate event_members
      try {
        const eventId = (await createEvent({
          bandId,
          title: title.trim(),
          type,
          startsAt: new Date(starts),
          endsAt: ends ? new Date(ends) : null,
          location: location || null,
        })) as string;

        await upsertEventMembers(eventId, inviteUserIds);
        return eventId;
      } catch (e: any) {
        onError?.(normalizeCreateEventError(e));
        return null;
      }
    },
    [
      bandId,
      title,
      type,
      starts,
      ends,
      location,
      inviteMode,
      selectedRosterId,
      onError,
      showToast,
    ]
  );

  /**
   * The returned API is consumed by:
   * - <NewEventStep /> for rendering/binding inputs + showing warnings
   * - <EventPickers /> for controlling date/time pickers
   * - GlobalCreateMobile for submit/reset + navigation decisions
   */
  return {
    // fields (UI reads)
    bandId,
    title,
    type,
    starts,
    ends,
    location,
    showStartsPicker,
    showEndsPicker,
    conflicts,
    sameDayEvents,
    checkingConflicts,

    // setters (UI writes)
    setBandId,
    setTitle,
    setType,
    setStarts,
    setEnds,
    setLocation,
    setShowStartsPicker,
    setShowEndsPicker,

    // lifecycle
    reset,
    submit,

    // invites (B-mode)
    inviteMode,
    selectedRosterId,
    setInviteMode,
    setSelectedRosterId,
  };
}
