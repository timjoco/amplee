/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import {
  calendarOutline,
  chevronBackOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type AvailabilityStatus = 'open' | 'limited' | 'unavailable';

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const STATUS_CONFIG: { [key in AvailabilityStatus]: StatusConfig } = {
  open: {
    label: 'Available',
    color: '#23a559', // Discord green
    bgColor: 'rgba(35, 165, 89, 0.12)',
    borderColor: 'rgba(35, 165, 89, 0.4)',
  },
  limited: {
    label: 'Maybe',
    color: '#f0b232', // Discord yellow
    bgColor: 'rgba(240, 178, 50, 0.12)',
    borderColor: 'rgba(240, 178, 50, 0.4)',
  },
  unavailable: {
    label: 'Busy',
    color: '#ed4245', // Discord red
    bgColor: 'rgba(237, 66, 69, 0.12)',
    borderColor: 'rgba(237, 66, 69, 0.4)',
  },
};

type RosterMember = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  role: string;
  avatar_url: string | null;
  availability: {
    status: AvailabilityStatus;
    status_note: string | null;
    away_until: string | null;
  } | null;
};

export default function BandRosterPage() {
  const { bandId } = useParams<{ bandId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [bandName, setBandName] = useState('');
  const [members, setMembers] = useState<RosterMember[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      if (!alive || !bandId) return;

      try {
        // Get band info
        const { data: band, error: bandErr } = await supabase
          .from('bands')
          .select('name')
          .eq('id', bandId)
          .maybeSingle();

        if (bandErr) throw bandErr;
        if (band) {
          setBandName(band.name);
        }

        // Get roster members with availability
        const { data: rosterData, error: rosterErr } = await supabase
          .from('band_members')
          .select(
            `
    role,
    user_id,
    profiles!band_memberships_user_id_fkey(
      id,
      first_name,
      last_name,
      display_name,
      avatar_url
    )
  `
          )
          .eq('band_id', bandId)
          .order('created_at', { ascending: true });

        if (rosterErr) throw rosterErr;

        if (!alive) return;

        if (rosterData) {
          // Now fetch availability for each user
          const userIds = rosterData.map((m: any) => m.user_id).filter(Boolean);

          const { data: availabilityData } = await supabase
            .from('profile_availability')
            .select('profile_id, status, status_note, away_until')
            .in('profile_id', userIds);

          // Create a map of availability by profile_id
          const availabilityMap = new Map(
            availabilityData?.map((a: any) => [a.profile_id, a]) || []
          );

          const formattedMembers: RosterMember[] = rosterData.map((m: any) => {
            const profile = Array.isArray(m.profiles)
              ? m.profiles[0]
              : m.profiles;
            const availability = availabilityMap.get(m.user_id);

            return {
              id: m.id,
              first_name: profile?.first_name || null,
              last_name: profile?.last_name || null,
              display_name: profile?.display_name || null,
              role: m.role,
              avatar_url: profile?.avatar_url || null,
              availability: availability
                ? {
                    status: availability.status as AvailabilityStatus,
                    status_note: availability.status_note,
                    away_until: availability.away_until,
                  }
                : null,
            };
          });
          setMembers(formattedMembers);
        }
      } catch (err: any) {
        console.error('[BandRosterPage] error:', err);
        if (alive) {
          setError(err.message || 'Failed to load roster');
        }
      } finally {
        if (alive) {
          setLoading(false);
        }
      }
    })();

    return () => {
      alive = false;
    };
  }, [bandId]);

  const formatAwayDate = (dateStr: string) => {
    const date = dateStr.includes('T')
      ? new Date(dateStr)
      : new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <IonPage>
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px',
              gap: 12,
            }}
          >
            <IonButton
              onClick={() => navigate(`/bands/${bandId}`)}
              fill="clear"
              style={{
                minWidth: 0,
                padding: 6,
                margin: 0,
                flexShrink: 0,
              }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#9ca3af', fontSize: 22 }}
              />
            </IonButton>

            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#F9FAFB',
                  margin: 0,
                  letterSpacing: '-0.8px',
                  lineHeight: 1.15,
                }}
              >
                Roster
              </h1>
              {bandName && (
                <div
                  style={{
                    fontSize: 13,
                    color: '#9ca3af',
                    marginTop: 4,
                  }}
                >
                  {bandName}
                </div>
              )}
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        scrollY={true}
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
            }}
          >
            <IonSpinner style={{ '--color': '#38bdf8' }} />
          </div>
        ) : error ? (
          <div
            style={{
              padding: '16px',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: 16,
                padding: '16px',
                color: '#fca5a5',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: '16px',
              maxWidth: '600px',
              margin: '0 auto',
              paddingBottom: '40px',
            }}
          >
            {/* Info callout */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '14px 16px',
                background: 'rgba(59, 130, 246, 0.08)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 12,
                marginBottom: 16,
              }}
            >
              <IonIcon
                icon={informationCircleOutline}
                style={{
                  color: '#60a5fa',
                  fontSize: 18,
                  flexShrink: 0,
                  marginTop: 1,
                }}
              />
              <p
                style={{
                  fontSize: 13,
                  color: '#b5bac1',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Member availability helps when you're picking dates for events.
              </p>
            </div>

            {/* Member cards */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              {members.map((member) => {
                const availability = member.availability;
                const status = availability?.status || 'open';
                const config = STATUS_CONFIG[status];

                // Create full name
                const fullName = [member.first_name, member.last_name]
                  .filter(Boolean)
                  .join(' ');
                const displayName =
                  member.display_name || fullName || 'Unknown';

                // Get initial for avatar
                const initial = (member.display_name ||
                  member.first_name ||
                  '?')[0].toUpperCase();

                return (
                  <div
                    key={member.id}
                    style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: 16,
                      padding: '16px',
                    }}
                  >
                    {/* Member header */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom:
                          availability?.status_note || availability?.away_until
                            ? 12
                            : 0,
                      }}
                    >
                      {/* Avatar placeholder */}
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 12,
                          background: 'rgba(255,255,255,0.08)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 18,
                          fontWeight: 600,
                          color: '#9ca3af',
                          flexShrink: 0,
                        }}
                      >
                        {initial}
                      </div>

                      {/* Name and role */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 600,
                            color: '#f9fafb',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {displayName}
                        </div>
                        {/* Show full name if different from display name */}
                        {member.display_name &&
                          fullName &&
                          member.display_name !== fullName && (
                            <div
                              style={{
                                fontSize: 11,
                                color: '#6b7280',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {fullName}
                            </div>
                          )}
                        <div
                          style={{
                            fontSize: 12,
                            color: '#9ca3af',
                            textTransform: 'capitalize',
                          }}
                        >
                          {member.role}
                        </div>
                      </div>

                      {/* Status badge */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          padding: '6px 12px',
                          borderRadius: 20,
                          background: config.bgColor,
                          border: `1px solid ${config.borderColor}`,
                          flexShrink: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: config.color,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: config.color,
                          }}
                        >
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Additional availability details */}
                    {(availability?.status_note ||
                      availability?.away_until) && (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 6,
                          paddingTop: 12,
                          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        {availability.away_until && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6,
                              fontSize: 12,
                              color: 'rgba(255, 255, 255, 0.6)',
                            }}
                          >
                            <IonIcon
                              icon={calendarOutline}
                              style={{ fontSize: 12 }}
                            />
                            <span>
                              Back {formatAwayDate(availability.away_until)}
                            </span>
                          </div>
                        )}
                        {availability.status_note && (
                          <div
                            style={{
                              fontSize: 12,
                              color: 'rgba(255, 255, 255, 0.6)',
                              fontStyle: 'italic',
                              paddingLeft: availability.away_until ? 18 : 0,
                            }}
                          >
                            "{availability.status_note}"
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
