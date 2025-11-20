/* eslint-disable @typescript-eslint/no-explicit-any */
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
import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!isOpen) return;

    let active = true;

    (async () => {
      try {
        setMembersLoading(true);
        setMembersError(null);

        // load members + profiles
        const { data, error } = await supabase
          .from('band_members')
          .select(
            'user_id, role, profiles(display_name, avatar_url, updated_at)'
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

    // snapshot events/years
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
      } catch (e) {
        console.warn('Band snapshot load error', e);
      }
    })();

    return () => {
      active = false;
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
      <IonContent>
        <div
          style={{
            position: 'relative',
            padding: 16,
            paddingBottom: 24,
            height: '100%',
            color: '#E5E7EB',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Grabber */}
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 999,
              margin: '4px auto 12px',
              background: 'rgba(168,85,247,0.85)',
            }}
          />

          {/* Header row: avatar + name + gear */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2
                style={{
                  margin: 0,
                  fontSize: 18,
                  fontWeight: 800,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#F5F3FF',
                }}
              >
                {bandName || 'Band'}
              </h2>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: 12,
                  color: 'rgba(196,181,253,0.9)',
                }}
              >
                Members, stats, and quick actions.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                onDismiss();
                nav(`/bands/${bandId}/settings`);
              }}
              style={{
                width: 30,
                height: 30,
                borderRadius: 999,
                border: '1px solid rgba(148,163,184,0.8)',
                backgroundColor: 'rgba(15,23,42,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <IonIcon
                icon={settingsOutline}
                style={{ fontSize: 16, color: '#E5E7EB' }}
              />
            </button>
          </div>

          {/* Invite button (admin only) */}
          {isAdmin && (
            <div
              style={{
                borderRadius: 18,
                background:
                  'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                border: '1px solid rgba(88,28,135,0.7)',
                padding: 14,
                marginBottom: 16,
                boxShadow: '0 22px 45px rgba(0,0,0,0.9)',
              }}
            >
              <div style={{ marginBottom: 10 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 0.04,
                    textTransform: 'uppercase',
                    color: 'rgba(237,233,254,0.96)',
                  }}
                >
                  Invite band members
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 12,
                    color: 'rgba(196,181,253,0.9)',
                  }}
                >
                  Send an invite link to add new bandmates.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onDismiss();
                  nav(`/invite?band=${bandId}`);
                }}
                style={{
                  width: '100%', // stretch full container
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between', // text left, chevron right
                  padding: '10px 14px',
                  borderRadius: 14, // more square, card-like
                  border: 'none',
                  background:
                    'linear-gradient(135deg, rgba(147,51,234,0.96), rgba(88,28,135,0.98))',
                  color: '#F9FAFB',
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: 0.02,
                  boxShadow: '0 14px 30px rgba(0,0,0,0.85)',
                  cursor: 'pointer',
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
                      width: 28,
                      height: 28,
                      borderRadius: 999,
                      background: '#01030bff',
                      border: '1px solid rgba(209,213,219,0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <IonIcon
                      icon={personAddOutline}
                      style={{ fontSize: 16, color: '#e0d9e3ff' }}
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
                  style={{ fontSize: 18, color: '#E5E7EB', flexShrink: 0 }}
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
              gap: 12,
            }}
          >
            <div
              style={{
                borderRadius: 18,
                background:
                  'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                border: '1px solid rgba(88,28,135,0.7)',
                padding: 14,
                boxShadow: '0 22px 45px rgba(0,0,0,0.9)',
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 0.04,
                    textTransform: 'uppercase',
                    color: 'rgba(237,233,254,0.96)',
                  }}
                >
                  Band members
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 12,
                    color: 'rgba(196,181,253,0.9)',
                  }}
                >
                  Who’s in the band and their roles.
                </p>
              </div>

              {membersLoading ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'rgba(196,181,253,0.8)',
                  }}
                >
                  Loading members…
                </p>
              ) : members.length === 0 ? (
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    color: 'rgba(156,163,175,0.9)',
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
                    const role = m.role === 'admin' ? 'Admin' : 'Member';
                    return (
                      <IonItem
                        key={m.user_id}
                        lines="none"
                        style={
                          {
                            '--background': 'transparent',
                            paddingInline: 0,
                          } as any
                        }
                      >
                        <AvatarImageMobile
                          name={m.name}
                          bucket="profile-avatars"
                          avatarPath={m.avatar_path ?? undefined}
                          updatedAt={m.avatar_updated_at ?? undefined}
                          size={32}
                        />
                        <IonLabel className="ion-margin-start">
                          <h3
                            style={{
                              fontWeight: 600,
                              fontSize: 15,
                              marginBottom: 2,
                            }}
                          >
                            {m.name}
                          </h3>
                          <p
                            style={{
                              fontSize: 12,
                              color: m.role === 'admin' ? '#FBBF24' : '#9CA3AF',
                            }}
                          >
                            {role}
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
                    marginTop: 6,
                    fontSize: 12,
                    color: '#FCA5A5',
                  }}
                >
                  {membersError}
                </p>
              )}
            </div>

            <div
              style={{
                borderRadius: 18,
                background:
                  'linear-gradient(145deg, #08070d, #050509 55%, #0b0614)',
                border: '1px solid rgba(88,28,135,0.7)',
                padding: 14,
                boxShadow: '0 22px 45px rgba(0,0,0,0.9)',
              }}
            >
              <div style={{ marginBottom: 8 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: 0.04,
                    textTransform: 'uppercase',
                    color: 'rgba(237,233,254,0.96)',
                  }}
                >
                  Band summary
                </p>
                <p
                  style={{
                    margin: '4px 0 0',
                    fontSize: 12,
                    color: 'rgba(196,181,253,0.9)',
                  }}
                >
                  High-level stats for this band.
                </p>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-around',
                  textAlign: 'center',
                  marginTop: 4,
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

            <IonText color="medium">
              <p
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  textAlign: 'center',
                  color: '#9CA3AF',
                }}
              >
                Need deeper controls? Tap the gear to open band settings.
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
      <div style={{ fontSize: 22, marginBottom: 4 }}>{emoji}</div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 700,
          marginBottom: 2,
          color: '#F9FAFB',
        }}
      >
        {display}
      </div>
      <div
        style={{
          fontSize: 12,
          color: '#9CA3AF',
        }}
      >
        {label}
      </div>
    </div>
  );
}
