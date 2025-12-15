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
  accepted: number;
  total: number; // NOTE: keep as "responders" if you want; we’ll use inviteeTotal for tiles/percent
};

type UseEventDashboardReturn = {
  // Core data
  event: EventRow | null;
  loading: boolean;
  isAdmin: boolean;

  // Stats
  attendanceStats: AttendanceStats;
  inviteeTotal: number; // ✅ NEW
  attendancePercentage: number; // ✅ now computed from inviteeTotal
  setlistCount: number;
  filesCount: number;
  hasNotes: boolean;

  // Actions
  setEvent: React.Dispatch<React.SetStateAction<EventRow | null>>;
  refreshAttendance: () => Promise<void>;
};

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

  const [inviteeTotal, setInviteeTotal] = useState(0); // ✅ NEW
  const [setlistCount, setSetlistCount] = useState(0);
  const [filesCount, setFilesCount] = useState(0);

  // Fetch all event data in parallel
  useEffect(() => {
    if (!eventId) return;

    let alive = true;

    const fetchEventData = async () => {
      setLoading(true);

      const [
        eventResult,
        attendanceResult,
        inviteesResult,
        setlistResult,
        filesResult,
      ] = await Promise.all([
        // Event data
        supabase
          .from('events_with_my_attendance')
          .select(
            'id, band_id, title, type, starts_at, ends_at, location, is_booked, is_cancelled, is_public, notes'
          )
          .eq('id', eventId)
          .maybeSingle(),

        // Attendance rows (responders)
        supabase
          .from('event_attendance')
          .select('status')
          .eq('event_id', eventId),

        // ✅ Invitees count (true “invited”)
        supabase
          .from('event_members')
          .select('user_id', { count: 'exact', head: true })
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

      // Attendance responders
      if (!attendanceResult.error && attendanceResult.data) {
        const accepted = attendanceResult.data.filter(
          (a: any) => a.status === 'accepted'
        ).length;

        setAttendanceStats({
          accepted,
          total: attendanceResult.data.length,
        });
      } else {
        setAttendanceStats({ accepted: 0, total: 0 });
      }

      // ✅ Invitees
      if (!inviteesResult.error) {
        setInviteeTotal(inviteesResult.count ?? 0);
      } else {
        setInviteeTotal(0);
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

  // Real-time attendance updates (also refresh invitee count if memberships change)
  useEffect(() => {
    if (!eventId) return;

    const channel = supabase
      .channel(`event:${eventId}:dashboard`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_attendance',
          filter: `event_id=eq.${eventId}`,
        },
        async () => {
          const { data: attendanceData, error: attErr } = await supabase
            .from('event_attendance')
            .select('status')
            .eq('event_id', eventId);

          if (!attErr && attendanceData) {
            const accepted = attendanceData.filter(
              (a: any) => a.status === 'accepted'
            ).length;

            setAttendanceStats({
              accepted,
              total: attendanceData.length,
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_members',
          filter: `event_id=eq.${eventId}`,
        },
        async () => {
          const { count, error } = await supabase
            .from('event_members')
            .select('user_id', { count: 'exact', head: true })
            .eq('event_id', eventId);

          if (!error) setInviteeTotal(count ?? 0);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId]);

  // ✅ Computed values
  const attendancePercentage = useMemo(() => {
    if (inviteeTotal === 0) return 0;
    return Math.round((attendanceStats.accepted / inviteeTotal) * 100);
  }, [attendanceStats.accepted, inviteeTotal]);

  const hasNotes = useMemo(() => {
    return !!event?.notes && event.notes.trim().length > 0;
  }, [event?.notes]);

  // Manual refresh function for attendance + invitees
  const refreshAttendance = async () => {
    if (!eventId) return;

    const [att, inv] = await Promise.all([
      supabase
        .from('event_attendance')
        .select('status')
        .eq('event_id', eventId),
      supabase
        .from('event_members')
        .select('user_id', { count: 'exact', head: true })
        .eq('event_id', eventId),
    ]);

    if (!att.error && att.data) {
      const accepted = att.data.filter(
        (a: any) => a.status === 'accepted'
      ).length;
      setAttendanceStats({ accepted, total: att.data.length });
    }

    if (!inv.error) setInviteeTotal(inv.count ?? 0);
  };

  return {
    event,
    loading,
    isAdmin,
    attendanceStats,
    inviteeTotal, // ✅ NEW
    attendancePercentage,
    setlistCount,
    filesCount,
    hasNotes,
    setEvent,
    refreshAttendance,
  };
}
