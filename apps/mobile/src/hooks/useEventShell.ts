import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  notes: string | null;
};

export function useEventShell(eventId?: string) {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;

    // Reset when eventId changes / is missing
    if (!eventId) {
      setEvent(null);
      setIsAdmin(false);
      setLoading(false);
      return () => {
        alive = false;
      };
    }

    (async () => {
      setLoading(true);
      setIsAdmin(false);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      // ✅ use maybeSingle so “0 rows” becomes data=null (no 406)
      const { data: eventData, error: eventErr } = await supabase
        .from('events')
        .select('id, band_id, title, notes')
        .eq('id', eventId)
        .maybeSingle();

      if (!alive) return;

      if (eventErr) {
        console.error('[useEventShell] event load error', eventErr);
        setEvent(null);
        setLoading(false);
        return;
      }

      // event genuinely not found
      if (!eventData) {
        setEvent(null);
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
        } else {
          setIsAdmin(membership?.role === 'admin');
        }
      }

      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [eventId]);

  return { event, isAdmin, loading };
}
