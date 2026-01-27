/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import * as React from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../../../lib/supabase';
import type { MembershipRole, NextEvent, RosterMember, RouteParams } from '../types';

export function useBandSheet() {
  const params = useParams<RouteParams>();
  const bandId = params.bandId ?? params.id ?? null;

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [bandName, setBandName] = React.useState<string>('Band');
  const [bandAvatarUrl, setBandAvatarUrl] = React.useState<string | null>(null);
  const [bandAvatarUpdatedAt, setBandAvatarUpdatedAt] = React.useState<string | null>(null);
  const [myRole, setMyRole] = React.useState<MembershipRole>('member');
  const [showBandSettings, setShowBandSettings] = React.useState(false);
  const [nextEvent, setNextEvent] = React.useState<NextEvent | null>(null);
  const [pressedButton, setPressedButton] = React.useState<string | null>(null);
  const [eventsCount, setEventsCount] = React.useState(0);
  const [proposalsCount, setProposalsCount] = React.useState(0);
  const [rosterMembers, setRosterMembers] = React.useState<RosterMember[]>([]);

  const isAndroid = Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  const triggerHaptic = React.useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {
      console.warn('[haptic error]', e);
    }
  }, []);

  const handleButtonPress = React.useCallback(
    (buttonId: string, action: () => void) => {
      setPressedButton(buttonId);
      triggerHaptic();
      setTimeout(() => {
        setPressedButton(null);
        action();
      }, 120);
    },
    [triggerHaptic]
  );

  // Initial data load
  React.useEffect(() => {
    if (!bandId) return;

    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!alive) return;
        const user = auth?.user;
        if (!user) {
          setError('You must be signed in to view this band.');
          return;
        }

        // membership
        const { data: mem, error: memErr } = await supabase
          .from('band_members')
          .select('role')
          .eq('band_id', bandId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (memErr) throw memErr;
        if (!mem) {
          setError('You do not have access to this band.');
          return;
        }
        setMyRole((mem.role as MembershipRole) ?? 'member');

        const { data: band, error: bandErr } = await supabase
          .from('bands')
          .select('id, name, avatar_url, updated_at')
          .eq('id', bandId)
          .maybeSingle();

        if (bandErr) throw bandErr;
        if (!band) {
          setError('Band not found.');
          return;
        }

        setBandName(band.name);
        setBandAvatarUrl(band.avatar_url ?? null);
        setBandAvatarUpdatedAt(band.updated_at ?? null);

        // Fetch roster members
        const { data: members } = await supabase
          .from('band_members')
          .select(
            `
          user_id,
          role,
          profile:profiles!inner(
            id,
            display_name,
            first_name,
            last_name,
            avatar_url
          )
        `
          )
          .eq('band_id', bandId)
          .order('created_at', { ascending: true });

        if (!alive) return;

        if (members) {
          const formattedMembers = members.map((m: any) => {
            const fullName = [m.profile?.first_name, m.profile?.last_name]
              .filter(Boolean)
              .join(' ');

            return {
              id: m.profile?.id,
              display_name: m.profile.display_name,
              full_name: fullName,
              avatar_url: m.profile.avatar_url ?? null,
              role: m.role ?? 'member',
            };
          });
          setRosterMembers(formattedMembers);
        }

        // Fetch next upcoming event
        const { data: events, error: nextErr } = await supabase
          .from('events_with_my_attendance')
          .select('id, title, starts_at, location, type')
          .eq('band_id', bandId)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(1);

        if (nextErr) throw nextErr;

        if (events && events.length > 0) setNextEvent(events[0] as any);
        else setNextEvent(null);

        // events count
        const { count: eventsCountExact, error: eventsCountErr } = await supabase
          .from('event_members')
          .select('event_id, events!inner(id, band_id, archived_at)', {
            head: true,
            count: 'exact',
          })
          .eq('user_id', user.id)
          .eq('events.band_id', bandId)
          .is('events.archived_at', null);

        if (!alive) return;

        if (eventsCountErr) {
          console.error('[BandSheet] events count error', eventsCountErr);
        } else {
          setEventsCount(eventsCountExact ?? 0);
        }

        // proposals count
        const { count: proposalsCountExact, error: proposalsCountErr } = await supabase
          .from('gig_proposals')
          .select('id', { head: true, count: 'exact' })
          .eq('band_id', bandId);

        if (!alive) return;

        if (proposalsCountErr) {
          console.error('[BandSheet] proposals count error', proposalsCountErr);
        } else {
          setProposalsCount(proposalsCountExact ?? 0);
        }
      } catch (e: any) {
        console.error('BandSheet load error', e);
        setError(e?.message || 'Failed to load band.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  // Realtime subscriptions
  React.useEffect(() => {
    if (!bandId) return;

    const refreshNextEvent = async () => {
      const { data: events, error: nextErr } = await supabase
        .from('events_with_my_attendance')
        .select('id, title, starts_at, location, type')
        .eq('band_id', bandId)
        .gte('starts_at', new Date().toISOString())
        .order('starts_at', { ascending: true })
        .limit(1);

      if (nextErr) {
        console.warn('[BandSheet] next event refresh error', nextErr);
        return;
      }

      setNextEvent(events && events.length > 0 ? (events[0] as any) : null);

      const { data: auth } = await supabase.auth.getUser();
      const userId = auth?.user?.id ?? null;
      if (!userId) return;

      const { count: eventsCountExact, error: countErr } = await supabase
        .from('event_members')
        .select('event_id, events!inner(id, band_id, archived_at)', {
          head: true,
          count: 'exact',
        })
        .eq('user_id', userId)
        .eq('events.band_id', bandId)
        .is('events.archived_at', null);

      if (countErr) {
        console.warn('[BandSheet] events count refresh error', countErr);
      } else {
        setEventsCount(eventsCountExact ?? 0);
      }
    };

    const channel = supabase
      .channel(`band:${bandId}:events`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `band_id=eq.${bandId}`,
        },
        () => {
          void refreshNextEvent();
        }
      )
      .subscribe();

    const channel2 = supabase
      .channel(`band:${bandId}:event_members`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event_members' },
        () => {
          void refreshNextEvent();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(channel2);
    };
  }, [bandId]);

  // Update time countdown every minute
  React.useEffect(() => {
    if (!nextEvent) return;

    const interval = setInterval(() => {
      setNextEvent((prev) => (prev ? { ...prev } : null));
    }, 60000);

    return () => clearInterval(interval);
  }, [nextEvent]);

  return {
    bandId,
    loading,
    error,
    bandName,
    bandAvatarUrl,
    bandAvatarUpdatedAt,
    myRole,
    showBandSettings,
    setShowBandSettings,
    nextEvent,
    pressedButton,
    eventsCount,
    proposalsCount,
    rosterMembers,
    isAndroid,
    handleButtonPress,
  };
}
