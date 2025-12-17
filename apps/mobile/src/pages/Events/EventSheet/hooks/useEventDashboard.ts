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

// ✅ Adjust this list to match exactly what your RSVP UI writes to event_members.status
const YES_STATUSES = new Set(['accepted', 'going']);

export function useEventDashboard(
  eventId?: string,
  bandId?: string
): UseEventDashboardReturn {
  const [event, setEvent] = useState<EventRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [attendanceStats, setAttendanceStats] = useState<AttendanceStats>({
    accepted: 0,
    total: 0,
  });

  const [inviteeTotal, setInviteeTotal] = useState(0);
  const [setlistCount, setSetlistCount] = useState(0);
  const [filesCount, setFilesCount] = useState(0);

  // Fetch all event data in parallel
  useEffect(() => {
    if (!eventId) return;

    let alive = true;

    const fetchEventData = async () => {
      setLoading(true);

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

          // ✅ Single source of truth for Roll Call:
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
    };

    fetchEventData();

    return () => {
      alive = false;
    };
  }, [eventId]);

  // Check admin status
  useEffect(() => {
    if (!bandId) return;

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
  }, [bandId]);

  //  Real-time: refresh roll call stats when event_members changes
  useEffect(() => {
    if (!eventId) return;

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
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  const attendancePercentage = useMemo(() => {
    if (inviteeTotal === 0) return 0;
    return Math.round((attendanceStats.accepted / inviteeTotal) * 100);
  }, [attendanceStats.accepted, inviteeTotal]);

  const hasNotes = useMemo(() => {
    return !!event?.notes && event.notes.trim().length > 0;
  }, [event?.notes]);

  // Manual refresh function for attendance + invitees (from event_members)
  const refreshAttendance = async () => {
    if (!eventId) return;

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
