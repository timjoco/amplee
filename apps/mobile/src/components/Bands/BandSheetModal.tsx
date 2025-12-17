/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import {
  IonContent,
  IonIcon,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonText,
} from '@ionic/react';
import {
  chevronForwardOutline,
  personAddOutline,
  settingsOutline,
} from 'ionicons/icons';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import AvatarImageMobile from '../ui/AvatarImageMobile';

type MembershipRole = 'admin' | 'member';

type MemberRow = {
  user_id: string;
  name: string;
  avatar_path: string | null;
  avatar_updated_at: string | null;
  role: MembershipRole | string | null;
  band_role: string | null;
};

type Props = {
  isOpen: boolean;
  onDismiss: () => void;
  bandId: string;
  bandName: string;
  avatarPath?: string | null;
  isAdmin?: boolean;
};

export default function BandSheetModal({
  isOpen,
  onDismiss,
  bandId,
  bandName,
  avatarPath,
  isAdmin,
}: Props) {
  const nav = useNavigate();

  const [members, setMembers] = useState<MemberRow[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState<string | null>(null);

  const [showsPlayed, setShowsPlayed] = useState<number | undefined>(undefined);
  const [yearsActive, setYearsActive] = useState<number | undefined>(undefined);

  const isAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';

  const refreshBandSummary = useCallback(
    async (reason: string) => {
      try {
        const nowIso = new Date().toISOString();

        const { count, error } = await supabase
          .from('events')
          .select('id', { head: true, count: 'exact' })
          .eq('band_id', bandId)
          .eq('type', 'show')
          .lte('starts_at', nowIso);

        if (error) return;
        setShowsPlayed(count ?? 0);
      } catch (e) {
        console.warn('[BandSheetModal] refreshBandSummary exception', e);
      }
    },
    [bandId]
  );

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    // helper: refresh "shows played" (past shows) in a consistent way
    const refreshShowsPlayed = async () => {
      try {
        const nowIso = new Date().toISOString();

        const { count, error } = await supabase
          .from('events')
          .select('id', { head: true, count: 'exact' })
          .eq('band_id', bandId)
          .eq('type', 'show')
          .lte('starts_at', nowIso);

        if (!active) return;

        if (error) {
          console.warn('[BandSheetModal] showsPlayed count error', error);
          return;
        }

        setShowsPlayed(count ?? 0);
      } catch (e) {
        console.warn('[BandSheetModal] refreshShowsPlayed error', e);
      }
    };

    // load members
    (async () => {
      try {
        setMembersLoading(true);
        setMembersError(null);

        const { data, error } = await supabase
          .from('band_members')
          .select(
            'user_id, role, band_role, profiles(display_name, avatar_url, updated_at)'
          )
          .eq('band_id', bandId)
          .order('created_at', { ascending: true });

        if (!active) return;

        if (error) {
          setMembersError(error.message);
          setMembers([]);
          return;
        }

        const rows: MemberRow[] =
          (data ?? []).map((r: any) => ({
            user_id: r.user_id,
            role: r.role,
            band_role: r.band_role,
            name: r.profiles?.display_name || 'Band member',
            avatar_path: r.profiles?.avatar_url || null,
            avatar_updated_at: r.profiles?.updated_at || null,
          })) ?? [];

        setMembers(rows);
      } catch (e: any) {
        if (!active) return;
        setMembersError(e?.message || 'Failed to load members.');
      } finally {
        if (active) setMembersLoading(false);
      }
    })();

    // snapshot events/years (keep your existing approach)
    (async () => {
      try {
        const { data: events, error: evErr } = await supabase
          .from('events')
          .select('id, starts_at, type')
          .eq('band_id', bandId);

        if (!active) return;
        if (evErr) {
          console.warn('Band snapshot events error', evErr);
          return;
        }

        // ✅ initial shows played (uses your original list-based calc)
        const now = new Date();
        const shows = (events ?? []).filter((e: any) => {
          if (e.type !== 'show') return false;
          if (!e.starts_at) return false;
          const d = new Date(e.starts_at);
          return d <= now;
        }).length;
        setShowsPlayed(shows);

        // years active from earliest event or band.created_at
        let born: Date | null = null;

        const eventDates =
          (events ?? [])
            .map((e: any) => (e.starts_at ? new Date(e.starts_at) : null))
            .filter((d: Date | null): d is Date => !!d) || [];

        if (eventDates.length > 0) {
          born = new Date(Math.min(...eventDates.map((d) => d.getTime())));
        }

        if (!born) {
          const { data: band, error: bandErr } = await supabase
            .from('bands')
            .select('created_at')
            .eq('id', bandId)
            .maybeSingle();

          if (!active) return;
          if (!bandErr && band?.created_at) {
            born = new Date(band.created_at);
          }
        }

        if (born) {
          const diffYears =
            (now.getTime() - born.getTime()) / (1000 * 60 * 60 * 24 * 365);
          const years = Math.max(1, Math.floor(diffYears) || 1);
          setYearsActive(years);
        }

        // ensure showsPlayed aligns to realtime “count” logic immediately
        // (optional but nice — avoids edge cases if you later add pagination/filters)
        await refreshShowsPlayed();
      } catch (e) {
        console.warn('Band snapshot load error', e);
      }
    })();

    // realtime: refresh shows count when events change
    refreshBandSummary('initial');

    // realtime: refresh shows count when events change
    const channelName = `band:${bandId}:band_summary`;
    console.log('[BandSheetModal] subscribing', { channelName, bandId });

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'events',
          filter: `band_id=eq.${bandId}`,
        },
        (payload) => {
          console.log('[BandSheetModal] realtime fired', {
            channelName,
            bandId,
            eventType: payload.eventType,
            table: payload.table,
            new: payload.new,
            old: payload.old,
          });
          refreshBandSummary(`realtime:${payload.eventType}`);
        }
      )
      .subscribe((status) => {
        console.log('[BandSheetModal] realtime status', {
          channelName,
          bandId,
          status,
        });
      });

    const tick = setInterval(() => {
      refreshShowsPlayed();
    }, 60_000);

    return () => {
      active = false;
      clearInterval(tick);
      supabase.removeChannel(channel);
    };
  }, [isOpen, bandId]);

  const memberCount = members.length || undefined;

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onDismiss}
      breakpoints={[0, 0.9]}
      initialBreakpoint={0.9}
      handleBehavior="cycle"
      className="event-info-sheet"
    >
      <IonContent
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        <div
          style={{
            position: 'relative',
            padding: 16,
            paddingBottom: `calc(env(safe-area-inset-bottom, 0px) + ${
              isAndroid ? 18 : 12
            }px)`,
            height: '100%',
            color: '#e5e7eb',
            display: 'flex',
            flexDirection: 'column',
            maxWidth: 600,
            margin: '0 auto',
          }}
        >
          {/* Grabber */}
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 999,
              margin: '4px auto 16px',
              background: 'rgba(168,85,247,0.85)',
            }}
          />

          {/* Header row: name + gear */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 24,
                  fontWeight: 800,
                  color: '#f9fafb',
                  lineHeight: 1.2,
                }}
              >
                {bandName || 'Band'}
              </h2>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 14,
                  color: '#9ca3af',
                }}
              >
                Members, stats, and quick actions
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onDismiss();
                nav(`/bands/${bandId}/settings`);
              }}
              style={{
                width: 36,
                height: 36,
                borderRadius: 999,
                border: '1px solid rgba(168,85,247,0.3)',
                backgroundColor: 'rgba(168,85,247,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.15)';
                e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(168,85,247,0.1)';
                e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
              }}
            >
              <IonIcon
                icon={settingsOutline}
                style={{ fontSize: 18, color: '#a78bfa' }}
              />
            </button>
          </div>

          {/* Invite button */}
          {isAdmin && (
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: 16,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                  }}
                >
                  Invite members
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  nav(`/invite?band=${bandId}`);
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: 'none',
                  background:
                    'linear-gradient(135deg, rgba(88,28,135,0.95), rgba(88,28,135,0.85))',
                  color: '#f5f3ff',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(88,28,135,1), rgba(88,28,135,0.95))';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background =
                    'linear-gradient(135deg, rgba(88,28,135,0.95), rgba(88,28,135,0.85))';
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    overflow: 'hidden',
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.1)',
                      border: '1px solid rgba(168,85,247,0.4)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IonIcon
                      icon={personAddOutline}
                      style={{ fontSize: 18, color: '#e9d5ff' }}
                    />
                  </span>
                  <span
                    style={{
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    Invite band members
                  </span>
                </div>
                <IonIcon
                  icon={chevronForwardOutline}
                  style={{ fontSize: 18, color: '#f5f3ff', flexShrink: 0 }}
                />
              </button>
            </div>
          )}

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              paddingRight: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 16,
            }}
          >
            {/* Members Card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                  }}
                >
                  Band members
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  Who's in the band and their roles
                </p>
              </div>

              {membersLoading ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#9ca3af',
                  }}
                >
                  Loading members…
                </p>
              ) : members.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 14,
                    color: '#6b7280',
                  }}
                >
                  No members found.
                </p>
              ) : (
                <IonList
                  lines="none"
                  style={{
                    margin: 0,
                    background: 'transparent',
                  }}
                >
                  {members.map((m) => {
                    const permissionRole =
                      m.role === 'admin' ? 'Admin' : 'Member';
                    return (
                      <IonItem
                        key={m.user_id}
                        lines="none"
                        style={
                          {
                            '--background': 'transparent',
                            paddingInline: 0,
                            '--padding-start': '0',
                            '--inner-padding-end': '0',
                          } as any
                        }
                      >
                        <AvatarImageMobile
                          name={m.name}
                          bucket="profile-avatars"
                          avatarPath={m.avatar_path ?? undefined}
                          updatedAt={m.avatar_updated_at ?? undefined}
                          size={36}
                        />
                        <IonLabel className="ion-margin-start">
                          <h3
                            style={{
                              fontWeight: 600,
                              fontSize: 15,
                              marginBottom: 2,
                              color: '#f9fafb',
                            }}
                          >
                            {m.name}
                          </h3>
                          <p
                            style={{
                              fontSize: 13,
                              color: '#9ca3af',
                            }}
                          >
                            {m.band_role || permissionRole}
                            {m.role === 'admin' && m.band_role && ' • Admin'}
                          </p>
                        </IonLabel>
                      </IonItem>
                    );
                  })}
                </IonList>
              )}

              {membersError && (
                <p
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    color: '#fca5a5',
                  }}
                >
                  {membersError}
                </p>
              )}
            </div>

            {/* Stats Card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(168,85,247,0.3)',
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div style={{ marginBottom: 12 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 12,
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    textTransform: 'uppercase',
                    color: '#9ca3af',
                  }}
                >
                  Band summary
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 13,
                    color: '#6b7280',
                  }}
                >
                  High-level stats for this band
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  textAlign: 'center',
                  marginTop: 8,
                }}
              >
                <StatBlock label="Members" value={memberCount} emoji="👥" />
                <StatBlock label="Shows" value={showsPlayed} emoji="🎤" />
                <StatBlock
                  label="Years active"
                  value={yearsActive}
                  emoji="⏳"
                />
              </div>
            </div>

            <IonText>
              <p
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  textAlign: 'center',
                  color: '#6b7280',
                }}
              >
                Need deeper controls? Tap the gear to open band settings
              </p>
            </IonText>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
}

function StatBlock({
  label,
  value,
  emoji,
}: {
  label: string;
  value?: number;
  emoji: string;
}) {
  const display =
    value === undefined || Number.isNaN(value) ? '—' : String(value);

  return (
    <div>
      <div style={{ fontSize: 24, marginBottom: 6 }}>{emoji}</div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          marginBottom: 4,
          color: '#f9fafb',
        }}
      >
        {display}
      </div>
      <div
        style={{
          fontSize: 12,
          color: '#9ca3af',
        }}
      >
        {label}
      </div>
    </div>
  );
}
