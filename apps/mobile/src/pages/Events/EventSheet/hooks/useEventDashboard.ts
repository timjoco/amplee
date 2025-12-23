import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../../lib/supabase';

type EventType = 'show' | 'practice';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: EventType | null;
  starts_at: string | null;
  ends_at: string | null;
  location: string | null;
  is_cancelled: boolean;
  is_booked: boolean;
  is_public: boolean;
  notes: string | null;
};

type AttendanceStats = {
  accepted: number; // "in"
  total: number; // responders / rows (we set to inviteeTotal for now)
};

type UseEventDashboardReturn = {
  // Core data
  event: EventRow | null;
  loading: boolean;
  isAdmin: boolean;

  // Access control
  canAccess: boolean | null;
  isBandMember: boolean;
  isInvited: boolean;

  // Stats
  attendanceStats: AttendanceStats;
  inviteeTotal: number;
  attendancePercentage: number;
  setlistCount: number;
  filesCount: number;
  hasNotes: boolean;

  // Actions
  setEvent: React.Dispatch<React.SetStateAction<EventRow | null>>;
  refreshAttendance: () => Promise<void>;
};

//  Adjust this list to match exactly what your RSVP UI writes to event_members.status
const YES_STATUSES = new Set(['accepted', 'going']);

export function useEventDashboard(
  eventId?: string,
  bandId?: string
): UseEventDashboardReturn {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Access control state
  const [canAccess, setCanAccess] = useState<boolean | null>(null);
  const [isBandMember, setIsBandMember] = useState(false);
  const [isInvited, setIsInvited] = useState(false);

  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    accepted: 0,
    total: 0,
  });

  const [inviteeTotal, setInviteeTotal] = useState(0);
  const [setlistCount, setSetlistCount] = useState(0);
  const [filesCount, setFilesCount] = useState(0);

  // Check access control first, then fetch event data
  useEffect(() => {
    if (!eventId) {
      setCanAccess(null);
      setIsBandMember(false);
      setIsInvited(false);
      setLoading(false);
      return;
    }

    let alive = true;

    const checkAccessAndFetchData = async () => {
      setLoading(true);
      setCanAccess(null);

      try {
        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!alive || !user) {
          setCanAccess(null);
          setIsBandMember(false);
          setIsInvited(false);
          setLoading(false);
          return;
        }

        // Get the event to find its band_id
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('band_id')
          .eq('id', eventId)
          .single();

        if (!alive || eventError || !eventData) {
          setCanAccess(null);
          setIsBandMember(false);
          setIsInvited(false);
          setEvent(null);
          setLoading(false);
          return;
        }

        // Check if user is a band member
        const { data: bandMember, error: bandMemberError } = await supabase
          .from('band_members')
          .select('user_id')
          .eq('band_id', eventData.band_id)
          .eq('user_id', user.id)
          .maybeSingle();

        const isMember = !bandMemberError && !!bandMember;

        // Check if user is invited to the event (via event_members)
        const { data: eventMember, error: eventMemberError } = await supabase
          .from('event_members')
          .select('user_id')
          .eq('event_id', eventId)
          .eq('user_id', user.id)
          .maybeSingle();

        const isEventInvitee = !eventMemberError && !!eventMember;

        // User can access if they're a band member OR invited
        const hasAccess = isMember || isEventInvitee;

        if (!alive) return;

        setCanAccess(hasAccess);
        setIsBandMember(isMember);
        setIsInvited(isEventInvitee);

        // Only fetch event data if user has access
        if (!hasAccess) {
          setLoading(false);
          return;
        }

        // Fetch all event data in parallel
        const [eventResult, membersResult, setlistResult, filesResult] =
          await Promise.all([
            // Event data
            supabase
              .from('events_with_my_attendance')
              .select(
                'id, band_id, title, type, starts_at, ends_at, location, is_booked, is_cancelled, is_public, notes'
              )
              .eq('id', eventId)
              .maybeSingle(),

            // Single source of truth for Roll Call:
            // event_members rows define invitees, and status defines RSVP
            supabase
              .from('event_members')
              .select('status')
              .eq('event_id', eventId),

            // Setlist count
            supabase
              .from('event_setlist_items')
              .select('id', { count: 'exact', head: true })
              .eq('event_id', eventId),

            // Files count
            supabase
              .from('event_files')
              .select('id', { count: 'exact', head: true })
              .eq('event_id', eventId),
          ]);

        if (!alive) return;

        // Event
        if (!eventResult.error && eventResult.data) {
          const e = eventResult.data as any;
          setEvent({
            id: String(e.id),
            band_id: String(e.band_id),
            title: String(e.title ?? ''),
            type: e.type === 'practice' ? 'practice' : 'show',
            starts_at: e.starts_at ?? null,
            ends_at: e.ends_at ?? null,
            location: e.location ?? null,
            is_booked: Boolean(e.is_booked),
            is_cancelled: Boolean(e.is_cancelled),
            is_public: Boolean(e.is_public),
            notes: e.notes ?? null,
          });
        } else {
          setEvent(null);
        }

        // ✅ Roll call stats from event_members
        if (!membersResult.error && membersResult.data) {
          const rows = membersResult.data as Array<{ status: string | null }>;
          const accepted = rows.filter((r) =>
            YES_STATUSES.has(String(r.status ?? ''))
          ).length;

          setInviteeTotal(rows.length);
          setAttendanceStats({
            accepted,
            total: rows.length,
          });
        } else {
          setInviteeTotal(0);
          setAttendanceStats({ accepted: 0, total: 0 });
        }

        // Setlist count
        if (!setlistResult.error) setSetlistCount(setlistResult.count ?? 0);

        // Files count
        if (!filesResult.error) setFilesCount(filesResult.count ?? 0);

        setLoading(false);
      } catch (err) {
        console.error('[useEventDashboard] error:', err);
        if (alive) {
          setCanAccess(null);
          setIsBandMember(false);
          setIsInvited(false);
          setLoading(false);
        }
      }
    };

    checkAccessAndFetchData();

    return () => {
      alive = false;
    };
  }, [eventId]);

  // Check admin status
  useEffect(() => {
    if (!bandId || canAccess !== true) return;
    let alive = true;

    const checkAdmin = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!alive || !user) return;

      const { data, error } = await supabase
        .from('band_members')
        .select('role')
        .eq('band_id', bandId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!alive) return;

      setIsAdmin(!error && data?.role === 'admin');
    };

    checkAdmin();

    return () => {
      alive = false;
    };
  }, [bandId, canAccess]);

  //  Real-time: refresh roll call stats when event_members changes
  //  AND update event.is_booked when events table changes
  useEffect(() => {
    if (!eventId || canAccess !== true) return;

    const channel = supabase
      .channel(`event:${eventId}:dashboard`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_members',
          filter: `event_id=eq.${eventId}`,
        },
        async () => {
          const { data, error } = await supabase
            .from('event_members')
            .select('status')
            .eq('event_id', eventId);

          if (!error && data) {
            const accepted = data.filter((r: any) =>
              YES_STATUSES.has(String(r.status ?? ''))
            ).length;

            setInviteeTotal(data.length);
            setAttendanceStats({ accepted, total: data.length });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'events',
          filter: `id=eq.${eventId}`,
        },
        async (payload) => {
          // Update the event state with the new values
          const updated = payload.new as any;
          setEvent((prev) =>
            prev
              ? {
                  ...prev,
                  is_booked: Boolean(updated.is_booked),
                  is_cancelled: Boolean(updated.is_cancelled),
                  is_public: Boolean(updated.is_public),
                  title: String(updated.title ?? prev.title),
                  starts_at: updated.starts_at ?? prev.starts_at,
                  ends_at: updated.ends_at ?? prev.ends_at,
                  location: updated.location ?? prev.location,
                  notes: updated.notes ?? prev.notes,
                }
              : prev
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, canAccess]);

  const attendancePercentage = useMemo(() => {
    if (inviteeTotal === 0) return 0;
    return Math.round((attendanceStats.accepted / inviteeTotal) * 100);
  }, [attendanceStats.accepted, inviteeTotal]);

  const hasNotes = useMemo(() => {
    return !!event?.notes && event.notes.trim().length > 0;
  }, [event?.notes]);

  // Manual refresh function for attendance + invitees (from event_members)
  const refreshAttendance = async () => {
    if (!eventId || canAccess !== true) return;

    const { data, error } = await supabase
      .from('event_members')
      .select('status')
      .eq('event_id', eventId);

    if (!error && data) {
      const accepted = data.filter((r: any) =>
        YES_STATUSES.has(String(r.status ?? ''))
      ).length;

      setInviteeTotal(data.length);
      setAttendanceStats({ accepted, total: data.length });
    }
  };

  return {
    event,
    loading,
    isAdmin,
    canAccess,
    isBandMember,
    isInvited,
    attendanceStats,
    inviteeTotal,
    attendancePercentage,
    setlistCount,
    filesCount,
    hasNotes,
    setEvent,
    refreshAttendance,
  };
}
