/* eslint-disable @typescript-eslint/no-explicit-any */
import { useCallback, useEffect, useRef, useState } from 'react';
import { createEvent, type EventType } from '../lib/events/createEvents';
import {
  getBandSameDayEvents,
  type BandSameDayEvent,
} from '../lib/events/getBandSameDayEvents';
import {
  getEventAvailabilityConflicts,
  type EventAvailabilityConflict,
} from '../lib/events/getEventAvailabilityConflicts';
import { supabase } from '../lib/supabase';
import { useCreateBand } from './useCreateBand';

export type BandLite = { id: string; name: string; avatar_url?: string | null };

export type ShowToast = (msg: string) => void;

export const normalizeCreateEventError = (e: any) => {
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

export function useNewBandForm(opts: {
  showToast: ShowToast;
  onError?: (msg: string) => void;
}) {
  const { showToast, onError } = opts;
  const {
    createBand,
    loading: creatingBand,
    error: createBandErr,
    resetError,
  } = useCreateBand();

  const [bandName, setBandName] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const clearPreview = () => {
    if (avatarPreview) {
      try {
        URL.revokeObjectURL(avatarPreview);
      } catch {}
    }
  };

  const pickAvatar: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    try {
      const input = e.currentTarget;
      const files = input.files;
      if (!files || files.length === 0) return;

      const f = files[0];
      if (!f) return;

      if (!f.type || !f.type.startsWith('image/')) {
        showToast('Please choose an image file.');
        input.value = '';
        return;
      }

      if (f.size > 3 * 1024 * 1024) {
        showToast('Max file size is 3MB.');
        input.value = '';
        return;
      }

      clearPreview();
      const url = URL.createObjectURL(f);
      setAvatarFile(f);
      setAvatarPreview(url);
      input.value = '';
    } catch (err) {
      console.error('pickAvatar error', err);
      showToast('Could not load image.');
    }
  };

  const reset = useCallback(() => {
    resetError?.();
    setBandName('');
    setAvatarFile(null);
    clearPreview();
    setAvatarPreview(null);
  }, [resetError, avatarPreview]);

  const submit = useCallback(async () => {
    const name = bandName.trim();
    if (!name) {
      showToast('Enter a band name.');
      return null;
    }
    try {
      onError?.(null as any);
      const created = await createBand({ name, avatarFile });
      if (!created?.id) throw new Error('Could not create band');
      return created;
    } catch (e: any) {
      const msg = e?.message ?? 'Could not create band';
      onError?.(msg);
      return null;
    }
  }, [bandName, avatarFile, createBand, onError, showToast]);

  return {
    // state
    bandName,
    avatarFile,
    avatarPreview,
    creatingBand,
    createBandErr,

    // refs
    fileInputRef,

    // setters
    setBandName,
    setAvatarFile,
    setAvatarPreview,

    // actions
    pickAvatar,
    reset,
    submit,
  };
}

/**
 * NEW EVENT
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

export function useNewEventForm(opts: {
  showToast: ShowToast;
  onError?: (msg: string) => void;
}) {
  const { showToast, onError } = opts;

  const [bandId, setBandId] = useState('');
  const [title, setTitle] = useState('');
  const [type, setType] = useState<EventType>('show');
  const [starts, setStarts] = useState('');
  const [ends, setEnds] = useState('');
  const [location, setLocation] = useState('');
  const [showStartsPicker, setShowStartsPicker] = useState(false);
  const [showEndsPicker, setShowEndsPicker] = useState(false);

  const [conflicts, setConflicts] = useState<EventAvailabilityConflict[]>([]);
  const [sameDayEvents, setSameDayEvents] = useState<BandSameDayEvent[]>([]);
  const [checkingConflicts, setCheckingConflicts] = useState(false);

  type InviteMode = 'full' | 'roster' | 'custom';

  // Default to 'custom' so user sees the member list
  const [inviteMode, setInviteMode] = useState<InviteMode>('custom');
  const [selectedRosterId, setSelectedRosterId] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  const toggleSelectedUser = useCallback((userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId)
        ? prev.filter((id) => id !== userId)
        : [...prev, userId]
    );
  }, []);

  // Prefill all members (called when switching to custom or when members load)
  const prefillAllMembers = useCallback((memberIds: string[]) => {
    setSelectedUserIds(memberIds);
  }, []);

  async function resolveInviteUserIds(): Promise<string[]> {
    if (!bandId) return [];

    // FULL BAND
    if (inviteMode === 'full') {
      const { data, error } = await supabase
        .from('band_members')
        .select('user_id')
        .eq('band_id', bandId);

      if (error) throw error;
      return (data ?? []).map((r: any) => r.user_id).filter(Boolean);
    }

    // SAVED ROSTER
    if (inviteMode === 'roster') {
      if (!selectedRosterId) throw new Error('Select a roster.');
      const { data, error } = await supabase
        .from('band_roster_members')
        .select('user_id')
        .eq('roster_id', selectedRosterId);

      if (error) throw error;
      return (data ?? []).map((r: any) => r.user_id).filter(Boolean);
    }

    // CUSTOM
    const ids = selectedUserIds.filter(Boolean);
    if (ids.length === 0) throw new Error('Select at least 1 member.');
    return ids;
  }

  async function upsertEventMembers(eventId: string, userIds: string[]) {
    const unique = Array.from(new Set(userIds)).filter(Boolean);
    if (unique.length === 0) return;

    // assumes event_members has composite PK (event_id, user_id)
    const rows = unique.map((uid) => ({
      event_id: eventId,
      user_id: uid,
      status: 'pending', // adjust to your enum/defaults
    }));

    const { error } = await supabase.from('event_members').upsert(rows as any, {
      onConflict: 'event_id,user_id',
    });

    if (error) throw error;
  }

  useEffect(() => {
    if (!bandId || !starts) {
      setConflicts([]);
      setCheckingConflicts(false);
      return;
    }
    // If user edits band or date after seeing conflicts, treat this as a fresh attempt
    setConflicts([]);
    setCheckingConflicts(false);
  }, [bandId, starts]);

  const reset = useCallback(() => {
    setTitle('');
    setType('show');
    setStarts('');
    setEnds('');
    setLocation('');
    setConflicts([]);
    setSameDayEvents([]);
    setCheckingConflicts(false);

    // Reset to custom mode (default)
    setInviteMode('custom');
    setSelectedRosterId('');
    setSelectedUserIds([]);

    setShowStartsPicker(false);
    setShowEndsPicker(false);
  }, []);

  const submit = useCallback(
    async (opts?: { bypassConflicts?: boolean }) => {
      const bypassConflicts = opts?.bypassConflicts ?? false;

      if (!bandId) {
        showToast('Choose a band.');
        return null;
      }
      if (!title.trim()) {
        showToast('Add a title.');
        return null;
      }
      if (!starts) {
        showToast('Pick a start date/time.');
        return null;
      }

      onError?.(null as any);
      setConflicts([]);
      setSameDayEvents([]);

      // Resolve invite list ONCE (also validates roster/custom selection)
      let inviteUserIds: string[] = [];
      try {
        inviteUserIds = await resolveInviteUserIds();
      } catch (e: any) {
        showToast(String(e?.message ?? 'Select invitees.'));
        return null;
      }

      // 1) Run checks unless bypassing
      if (!bypassConflicts) {
        try {
          setCheckingConflicts(true);

          const startsDate = new Date(starts);
          if (Number.isNaN(+startsDate)) {
            throw new Error('Invalid start date.');
          }

          const [memberConflicts, sameDay] = await Promise.all([
            getEventAvailabilityConflicts({
              bandId,
              startsAt: startsDate,
              userIds: inviteUserIds, // ✅ only check invited members
            } as any),
            getBandSameDayEvents({
              bandId,
              startsAt: startsDate,
            }),
          ]);

          setConflicts(memberConflicts);
          setSameDayEvents(sameDay);

          if (memberConflicts.length > 0 || sameDay.length > 0) {
            const msgs: string[] = [];
            if (memberConflicts.length > 0) {
              msgs.push(
                memberConflicts.length === 1
                  ? '1 invited member may not be available.'
                  : `${memberConflicts.length} invited members may not be available.`
              );
            }
            if (sameDay.length > 0) {
              msgs.push(
                sameDay.length === 1
                  ? 'This band already has an event on that date.'
                  : `This band already has ${sameDay.length} events on that date.`
              );
            }
            showToast(msgs.join(' '));
            return null; // stop here; user can adjust date or "create anyway"
          }
        } catch (e: any) {
          console.error('[checkEventAvailability]', e);
          onError?.(
            String(e?.message ?? 'Could not check availability or conflicts.')
          );
          return null;
        } finally {
          setCheckingConflicts(false);
        }
      }

      // 2) Actually create event + upsert event members
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
        const msg = normalizeCreateEventError(e);
        onError?.(msg);
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
      selectedUserIds,
      onError,
      showToast,
    ]
  );

  return {
    // state
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

    // setters
    setBandId,
    setTitle,
    setType,
    setStarts,
    setEnds,
    setLocation,
    setShowStartsPicker,
    setShowEndsPicker,

    // actions
    reset,
    submit,

    // invite state
    inviteMode,
    selectedRosterId,
    selectedUserIds,

    // invite setters
    setInviteMode,
    setSelectedRosterId,
    setSelectedUserIds,
    toggleSelectedUser,
    prefillAllMembers,
  };
}

/**
 * NEW SONG
 */

export function useNewSongForm(opts: {
  showToast: ShowToast;
  onError?: (msg: string) => void;
}) {
  const { showToast, onError } = opts;

  const [bandId, setBandId] = useState('');
  const [title, setTitle] = useState('');
  const [key, setKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [origin, setOrigin] = useState<'original' | 'cover'>('original');
  const [originalArtist, setOriginalArtist] = useState('');

  const reset = useCallback(() => {
    setTitle('');
    setKey('');
    setBpm('');
    setOrigin('original');
    setOriginalArtist('');
    // keep bandId
  }, []);

  const submit = useCallback(async () => {
    if (!bandId) {
      showToast('Choose a band.');
      return null;
    }
    if (!title.trim()) {
      showToast('Add a song title.');
      return null;
    }
    if (origin === 'cover' && !originalArtist.trim()) {
      showToast('Add the original artist for this cover.');
      return null;
    }

    try {
      onError?.(null as any);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        showToast('Please sign in first.');
        return null;
      }

      const { data, error } = await supabase
        .from('songs')
        .insert({
          band_id: bandId,
          title: title.trim(),
          default_key: key.trim() || null,
          default_bpm: bpm ? Number(bpm) : null,
          origin,
          original_artist:
            origin === 'cover' ? originalArtist.trim() || null : null,
          created_by: user.id,
        } as any)
        .select('id')
        .single();

      if (error) throw error;
      return data.id as string;
    } catch (e: any) {
      const msg = String(e?.message ?? 'Could not create song');
      onError?.(msg);
      return null;
    }
  }, [bandId, title, key, bpm, origin, originalArtist, onError, showToast]);

  return {
    // state
    bandId,
    title,
    key,
    bpm,
    origin,
    originalArtist,

    // setters
    setBandId,
    setTitle,
    setKey,
    setBpm,
    setOrigin,
    setOriginalArtist,

    // actions
    reset,
    submit,
  };
}

/**
 * NEW PROPOSAL
 */

export function useNewProposalForm(opts: {
  showToast: ShowToast;
  onError?: (msg: string) => void;
}) {
  const { showToast, onError } = opts;

  const [bandId, setBandId] = useState('');
  const [title, setTitle] = useState('');
  const [venue, setVenue] = useState('');

  const reset = useCallback(() => {
    setTitle('');
    setVenue('');
    // keep bandId
  }, []);

  const submit = useCallback(async () => {
    if (!bandId) {
      showToast('Choose a band.');
      return null;
    }
    if (!title.trim()) {
      showToast('Add a proposal title.');
      return null;
    }

    try {
      onError?.(null as any);

      const {
        data: { user },
        error: userErr,
      } = await supabase.auth.getUser();

      if (userErr || !user) {
        showToast('Please sign in first.');
        return null;
      }

      const trimmedTitle = title.trim();

      const { data, error: propErr } = await supabase
        .from('gig_proposals')
        .insert({
          band_id: bandId,
          title: trimmedTitle,
          venue: venue.trim() || null,
          created_by: user.id,
        } as any)
        .select('id')
        .single();

      if (propErr) throw propErr;
      return data.id as string;
    } catch (e: any) {
      console.error('[submitCreateProposal]', e);
      const msg = String(e?.message ?? 'Could not create proposal');
      onError?.(msg);
      return null;
    }
  }, [bandId, title, venue, onError, showToast]);

  return {
    // state
    bandId,
    title,
    venue,

    // setters
    setBandId,
    setTitle,
    setVenue,

    // actions
    reset,
    submit,
  };
}
