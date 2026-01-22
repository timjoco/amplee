import { IonSpinner, IonText } from '@ionic/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import AvatarImageMobile from '../../../../components/ui/AvatarImageMobile';
import { supabase } from '../../../../lib/supabase';

type RosterStatus = 'accepted' | 'declined' | 'tentative' | 'pending';

type RosterRow = {
  user_id: string;
  name: string;
  status: RosterStatus;
  needs_sub: boolean;
  avatar_url?: string | null;
  updated_at?: string | null;
};

type Props = {
  eventId: string;
};

export default function RosterPanelMobile({ eventId }: Props) {
  const [rows, setRows] = useState<RosterRow[]>([]);
  const [loading, setLoading] = useState(true);
  const initialLoadDone = useRef(false);
  // Track user IDs for realtime filtering without causing re-subscriptions
  const userIdsRef = useRef<Set<string>>(new Set());
  const loadRosterRef = useRef<() => Promise<void>>();

  const loadRoster = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);

    try {
      const { data: members, error: memErr } = await supabase
        .from('event_members')
        .select('user_id, status, needs_sub')
        .eq('event_id', eventId);

      if (memErr) {
        console.warn('[event_members select error]', memErr);
        setRows([]);
        return;
      }

      const ids = (members ?? []).map((m: any) => m.user_id).filter(Boolean);
      if (ids.length === 0) {
        setRows([]);
        return;
      }

      const { data: profiles, error: profErr } = await supabase
        .from('profiles')
        .select('id, display_name, first_name, avatar_url, updated_at')
        .in('id', ids);

      if (profErr) {
        console.warn('[profiles select error]', profErr);
      }

      const byId = new Map(
        (profiles ?? []).map((p: any) => [
          p.id,
          {
            name: p.display_name ?? p.first_name ?? 'Member',
            avatar_url: p.avatar_url ?? null,
            updated_at: p.updated_at ?? null,
          },
        ])
      );

      const mapped: RosterRow[] = (members ?? []).map((m: any) => {
        const p = byId.get(m.user_id) ?? {
          name: 'Member',
          avatar_url: null,
          updated_at: null,
        };

        return {
          user_id: m.user_id,
          name: p.name,
          status: (m.status as RosterStatus) ?? 'pending',
          needs_sub: !!m.needs_sub,
          avatar_url: p.avatar_url,
          updated_at: p.updated_at,
        };
      });

      setRows(mapped);
      // Update ref for realtime filtering (doesn't trigger re-subscriptions)
      userIdsRef.current = new Set(mapped.map((r) => r.user_id));
    } finally {
      initialLoadDone.current = true;
      setLoading(false);
    }
  }, [eventId]);

  // Keep ref updated so realtime callbacks can call latest version
  loadRosterRef.current = loadRoster;

  useEffect(() => {
    initialLoadDone.current = false;
    setRows([]);
    userIdsRef.current = new Set();
    setLoading(true);
    void loadRoster();
  }, [loadRoster]);

  // Realtime: event_members changes for this event
  useEffect(() => {
    const ch = supabase
      .channel(`event:${eventId}:event-members-roster`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_members',
          filter: `event_id=eq.${eventId}`,
        },
        () => {
          void loadRosterRef.current?.();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId]);

  // Realtime: profile updates (patch rows if displayed users change)
  useEffect(() => {
    const chProf = supabase
      .channel(`event:${eventId}:profiles-roster-panel`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles' },
        (payload: any) => {
          const p = payload.new;
          if (!p) return;

          const userId = p.id as string;
          if (!userIdsRef.current.has(userId)) return;

          const name = (p.display_name ?? p.first_name ?? 'Member') as string;
          const avatar_url = (p.avatar_url ?? null) as string | null;
          const updated_at = (p.updated_at ?? null) as string | null;

          setRows((prev) =>
            prev.map((r) =>
              r.user_id === userId ? { ...r, name, avatar_url, updated_at } : r
            )
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(chProf);
    };
  }, [eventId]);

  const statusStyle = (s: RosterStatus) => {
    if (s === 'accepted') {
      return {
        bg: 'rgba(52, 211, 153, 0.1)',
        border: 'rgba(52, 211, 153, 0.3)',
        color: '#6ee7b7',
      };
    }
    if (s === 'declined') {
      return {
        bg: 'rgba(248, 113, 113, 0.1)',
        border: 'rgba(248, 113, 113, 0.3)',
        color: '#fca5a5',
      };
    }
    return {
      bg: 'rgba(251, 191, 36, 0.1)',
      border: 'rgba(251, 191, 36, 0.3)',
      color: '#fde68a',
    };
  };

  if (loading && !initialLoadDone.current) {
    return (
      <div
        style={{
          width: '100%',
          paddingBlock: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <IonSpinner name="dots" style={{ color: '#34d399' }} />
        <IonText color="medium">
          <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
            Loading roster…
          </p>
        </IonText>
      </div>
    );
  }

  if (!loading && rows.length === 0) {
    return (
      <IonText color="medium">
        <p style={{ margin: 0, fontSize: 13, color: '#9ca3af' }}>
          No members on this event.
        </p>
      </IonText>
    );
  }

  return (
    <div style={{ width: '100%' }}>
      {rows.map((r, i) => {
        const st = statusStyle(r.status);

        return (
          <div key={r.user_id}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                paddingBlock: 10,
              }}
            >
              <AvatarImageMobile
                name={r.name}
                bucket="profile-avatars"
                avatarPath={r.avatar_url || undefined}
                updatedAt={r.updated_at || undefined}
                size={40}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#e5e7eb',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {r.name}
                </span>
              </div>

              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingInline: 10,
                  paddingBlock: 5,
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap',
                  ...(r.needs_sub
                    ? {
                        background:
                          'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(37,99,235,0.1) 100%)',
                        border: '1px solid rgba(59,130,246,0.3)',
                        color: '#93c5fd',
                      }
                    : {
                        background: st.bg,
                        border: `1px solid ${st.border}`,
                        color: st.color,
                      }),
                }}
              >
                {r.needs_sub ? 'Sub requested' : r.status}
              </span>
            </div>

            {i < rows.length - 1 && (
              <div
                style={{
                  height: 1,
                  marginInline: 4,
                  background:
                    'linear-gradient(90deg, transparent 0%, rgba(148,163,184,0.1) 50%, transparent 100%)',
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
