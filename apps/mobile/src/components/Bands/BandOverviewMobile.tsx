/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonText,
} from '@ionic/react';
import { calendarOutline, navigateOutline } from 'ionicons/icons';
import * as React from 'react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { supabase } from '../../lib/supabase';

type EventRow = {
  id: string;
  band_id: string;
  title: string;
  type: 'show' | 'practice' | string;
  starts_at: string | null;
  location: string | null;
  is_cancelled: boolean | null;
};

type RosterRow = {
  user_id: string;
  name: string;
  avatar_url?: string | null;
  role: 'admin' | 'member';
  title?: string | null;
};

type ProposalLite = {
  id: string;
  title: string | null;
  venue: string | null;
  created_at: string;
  yes_count?: number | null;
  member_count?: number | null;
};

type Props = {
  bandId: string;
};

export default function BandOverviewMobile({ bandId }: Props) {
  const [loading, setLoading] = React.useState(true);
  const [err, setErr] = React.useState<string | null>(null);
  const [nextEvent, setNextEvent] = React.useState<EventRow | null>(null);
  const [roster, setRoster] = React.useState<RosterRow[]>([]);
  const [memberCount, setMemberCount] = React.useState(0);
  const [showsPlayed, setShowsPlayed] = React.useState(0);
  const [yearsActive, setYearsActive] = React.useState<string>('—');
  const [proposals, setProposals] = React.useState<ProposalLite[]>([]);

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }),
    []
  );

  const nav = useNavigate();

  const openEvent = (bId: string, eventId: string) => {
    nav(`/bands/${bId}/events/${eventId}`);
  };

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setErr(null);

      try {
        // next upcoming event for this band
        const { data: events, error: eErr } = await supabase
          .from('events')
          .select('id, band_id, title, type, starts_at, location, is_cancelled')
          .eq('band_id', bandId)
          .gte('starts_at', new Date().toISOString())
          .order('starts_at', { ascending: true })
          .limit(1);

        if (eErr) throw eErr;
        if (!alive) return;
        const e = (events?.[0] as EventRow) ?? null;
        setNextEvent(e ?? null);

        // roster / member count
        const { data: members, error: mErr } = await supabase
          .from('band_members')
          .select('user_id, role, title')
          .eq('band_id', bandId);

        if (mErr) throw mErr;

        const ids = (members ?? []).map((m: any) => m.user_id);
        setMemberCount(ids.length);

        let merged: RosterRow[] = [];
        if (ids.length > 0) {
          const { data: profiles, error: pErr } = await supabase
            .from('profiles')
            .select('id, display_name, first_name, avatar_url')
            .in('id', ids);

          if (pErr) throw pErr;

          const byId = new Map<string, any>(
            (profiles ?? []).map((p: any) => [p.id, p])
          );
          merged = (members ?? []).map((m: any) => {
            const p = byId.get(m.user_id) || {};
            return {
              user_id: m.user_id,
              name: p.display_name ?? p.first_name ?? 'Member',
              avatar_url: p.avatar_url ?? null,
              role: m.role === 'admin' ? 'admin' : 'member',
              title: m.title ?? null,
            };
          });
        }
        if (!alive) return;
        setRoster(merged);

        // shows played
        const { count: sCount } = await supabase
          .from('events')
          .select('*', { head: true, count: 'exact' })
          .eq('band_id', bandId)
          .eq('type', 'show')
          .eq('is_cancelled', false);

        setShowsPlayed(sCount ?? 0);

        // years active
        const { data: bandRow } = await supabase
          .from('bands')
          .select('created_at')
          .eq('id', bandId)
          .maybeSingle();

        if (bandRow?.created_at) {
          const created = new Date(bandRow.created_at);
          const now = new Date();
          const diffYears = now.getFullYear() - created.getFullYear();

          if (diffYears <= 0) setYearsActive('<1 yr');
          else if (diffYears === 1) setYearsActive('1 yr');
          else setYearsActive(`${diffYears} yrs`);
        }

        // proposed gigs (overview slice)
        const { data: props, error: pErr2 } = await supabase
          .from('gig_proposals')
          .select('id, title, venue, created_at')
          .eq('band_id', bandId)
          .order('created_at', { ascending: false })
          .limit(3);

        if (pErr2) throw pErr2;
        if (!alive) return;
        setProposals((props ?? []) as ProposalLite[]);
      } catch (e: any) {
        console.error('BandOverviewMobile error', e);
        if (alive) setErr(e?.message || 'Failed to load overview.');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId, timeFmt]);

  if (loading) {
    return (
      <div style={{ padding: 16 }}>
        <IonText color="medium">
          <p>Loading overview…</p>
        </IonText>
      </div>
    );
  }

  if (err) {
    return (
      <div style={{ padding: 16 }}>
        <IonText color="danger">
          <p>{err}</p>
        </IonText>
      </div>
    );
  }

  return (
    <div style={{ padding: 12, paddingBottom: 24 }}>
      {/* Next Event */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Next Upcoming Event</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {!nextEvent ? (
            <IonText color="medium">
              <p>No upcoming events scheduled.</p>
            </IonText>
          ) : (
            <>
              <IonItem
                button
                detail
                lines="none"
                onClick={() => openEvent(nextEvent.band_id, nextEvent.id)}
              >
                <IonLabel>
                  <h2
                    style={{
                      fontWeight: 700,
                      fontSize: 16,
                      marginBottom: 4,
                    }}
                  >
                    {nextEvent.title}
                  </h2>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      fontSize: 13,
                      color: '#9CA3AF',
                    }}
                  >
                    {nextEvent.location && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <IonIcon
                          icon={navigateOutline}
                          style={{
                            fontSize: 14,
                            marginRight: 4,
                            color: 'rgba(139, 92, 246, 0.96)',
                          }}
                        />
                        {nextEvent.location}
                      </span>
                    )}
                    {nextEvent.starts_at && (
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <IonIcon
                          icon={calendarOutline}
                          style={{
                            fontSize: 14,
                            marginRight: 4,
                            color: 'rgba(139, 92, 246, 0.96)',
                          }}
                        />
                        {timeFmt.format(new Date(nextEvent.starts_at))}
                      </span>
                    )}
                  </div>
                </IonLabel>
              </IonItem>

              <div style={{ marginTop: 12 }}>
                <IonButton
                  fill="outline"
                  size="small"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('amplee:band-tab', {
                        detail: { tab: 'events' },
                      })
                    )
                  }
                  style={
                    {
                      '--color': 'rgba(52, 211, 153, 0.95)',
                      '--border-color': 'rgba(52, 211, 153, 0.95)',
                      '--background-activated': 'rgba(52, 211, 153, 0.95)',
                      '--border-color-activated': 'rgba(52, 211, 153, 0.95)',
                      '--color-activated': '#000000',
                    } as React.CSSProperties
                  }
                >
                  View all events
                </IonButton>
              </div>
            </>
          )}
        </IonCardContent>
      </IonCard>

      {/* Proposed gigs overview */}
      <IonCard>
        <IonCardHeader>
          <IonCardTitle>Proposed gigs</IonCardTitle>
        </IonCardHeader>
        <IonCardContent>
          {proposals.length === 0 ? (
            <IonText color="medium">
              <p>No proposed gigs yet.</p>
            </IonText>
          ) : (
            <>
              <IonList lines="none">
                {proposals.map((p) => {
                  const title = p.title || 'Proposed gig';
                  const sub = p.venue?.trim()
                    ? `Venue: ${p.venue}`
                    : 'Tap to add time options';

                  // 👇 summary stats – rename if needed
                  const yesCount = p.yes_count ?? 0;
                  const memberCount = p.member_count ?? 0;
                  const yesPct =
                    memberCount > 0
                      ? Math.round((yesCount / memberCount) * 100)
                      : 0;

                  return (
                    <IonItem key={p.id} lines="none">
                      <IonLabel>
                        <h3
                          style={{
                            fontWeight: 600,
                            fontSize: 15,
                            marginBottom: 2,
                          }}
                        >
                          {title}
                        </h3>

                        <p
                          style={{
                            fontSize: 12,
                            color: '#9CA3AF',
                            marginBottom: 6,
                          }}
                        >
                          {sub}
                        </p>

                        {/* YES PROGRESS BAR */}
                        {memberCount > 0 && (
                          <div style={{ marginTop: 2 }}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: 11,
                                color: '#9CA3AF',
                                marginBottom: 3,
                              }}
                            >
                              <span>Yes leaning</span>
                              <span>
                                {yesPct}% ({yesCount}/{memberCount})
                              </span>
                            </div>
                            <div
                              style={{
                                width: '100%',
                                height: 6,
                                borderRadius: 999,
                                background: 'rgba(31,41,55,0.9)',
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${yesPct}%`,
                                  height: '100%',
                                  borderRadius: 999,
                                  background:
                                    'linear-gradient(90deg, rgba(52,211,153,0.95), rgba(16,185,129,0.98))',
                                  transition: 'width 160ms ease-out',
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </IonLabel>
                    </IonItem>
                  );
                })}
              </IonList>

              <div style={{ marginTop: 12 }}>
                <IonButton
                  fill="outline"
                  size="small"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent('amplee:band-tab', {
                        detail: { tab: 'proposals' },
                      })
                    )
                  }
                  style={
                    {
                      '--color': 'rgba(245, 158, 11, 0.95)',
                      '--border-color': 'rgba(245, 158, 11, 0.95)',
                      '--background-activated': 'rgba(245, 158, 11, 0.95)',
                      '--border-color-activated': 'rgba(245, 158, 11, 0.95)',
                      '--color-activated': '#000000', // black on press
                    } as React.CSSProperties
                  }
                >
                  View all proposals
                </IonButton>
              </div>
            </>
          )}
        </IonCardContent>
      </IonCard>
    </div>
  );
}
