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
import { normalizeCreateEventError } from '../utils/errors';
import type { ShowToast } from './useNewBandForm';

type InviteMode = 'full' | 'roster' | 'custom';

export function useNewEventForm(opts: {
  showToast: ShowToast;
  onError?: (msg: string | null) => void;
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

  const prefillAllMembers = useCallback((memberIds: string[]) => {
    setSelectedUserIds(memberIds);
  }, []);

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

    if (inviteMode === 'roster') {
      if (!selectedRosterId) throw new Error('Select a roster.');
      const { data, error } = await supabase
        .from('band_roster_members')
        .select('user_id')
        .eq('roster_id', selectedRosterId);

      if (error) throw error;
      return (data ?? []).map((r: any) => r.user_id).filter(Boolean);
    }

    const ids = selectedUserIds.filter(Boolean);
    if (ids.length === 0) throw new Error('Select at least 1 member.');
    return ids;
  }

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

  const reset = useCallback(() => {
    setTitle('');
    setType('show');
    setStarts('');
    setEnds('');
    setLocation('');
    setConflicts([]);
    setSameDayEvents([]);
    setCheckingConflicts(false);

    setInviteMode('custom');
    setSelectedRosterId('');
    setSelectedUserIds([]);

    setShowStartsPicker(false);
    setShowEndsPicker(false);
  }, []);

  const submit = useCallback(
    async (opts?: { bypassConflicts?: boolean }) => {
      const bypassConflicts = opts?.bypassConflicts ?? false;

      if (!bandId) return showToast('Choose a band.'), null;
      if (!title.trim()) return showToast('Add a title.'), null;
      if (!starts) return showToast('Pick a start date/time.'), null;

      onError?.(null);
      setConflicts([]);
      setSameDayEvents([]);

      let inviteUserIds: string[] = [];
      try {
        inviteUserIds = await resolveInviteUserIds();
      } catch (e: any) {
        showToast(String(e?.message ?? 'Select invitees.'));
        return null;
      }

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
      selectedUserIds,
      onError,
      showToast,
    ]
  );

  return {
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

    setBandId,
    setTitle,
    setType,
    setStarts,
    setEnds,
    setLocation,
    setShowStartsPicker,
    setShowEndsPicker,

    reset,
    submit,

    inviteMode,
    selectedRosterId,
    selectedUserIds,
    setInviteMode,
    setSelectedRosterId,
    setSelectedUserIds,
    toggleSelectedUser,
    prefillAllMembers,
  };
}
