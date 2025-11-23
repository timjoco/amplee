// Small helper hook you can reuse in each page file
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
};

export function useEventShell(eventId?: string) {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    if (!eventId) return;

    (async () => {
      setLoading(true);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: eventData, error: eventErr } = await supabase
        .from('events')
        .select('id, band_id, title')
        .eq('id', eventId)
        .single();

      if (!alive) return;

      if (eventErr || !eventData) {
        console.error('[useEventShell] event load error', eventErr);
        setLoading(false);
        return;
      }

      setEvent(eventData as EventRow);

      if (user) {
        const { data: membership, error: memErr } = await supabase
          .from('band_members')
          .select('role')
          .eq('band_id', eventData.band_id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (!alive) return;

        if (memErr) {
          console.warn('[useEventShell] membership load error', memErr);
        }

        setIsAdmin(membership?.role === 'admin');
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [eventId]);

  return {
    event,
    isAdmin,
    loading,
  };
}
