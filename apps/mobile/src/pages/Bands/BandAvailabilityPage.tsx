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
import { chevronBackOutline } from 'ionicons/icons';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

type Member = {
  id: string;
  name: string;
  role: string | null;
  avatarUrl: string | null;
};

type UnavailableDate = {
  date: string;
  profileId: string;
};

type MembershipRole = 'admin' | 'member';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function formatDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(
    2,
    '0'
  )}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function getDateStatus(
  dateKey: string,
  members: Member[],
  unavailableDates: UnavailableDate[]
): {
  status: 'all' | 'most' | 'some' | 'none';
  count: number;
  unavailableMembers: Member[];
} {
  const unavailableIds = new Set(
    unavailableDates.filter((d) => d.date === dateKey).map((d) => d.profileId)
  );
  const unavailableMembers = members.filter((m) => unavailableIds.has(m.id));
  const availableCount = members.length - unavailableMembers.length;
  const total = members.length;

  if (availableCount === total)
    return { status: 'all', count: availableCount, unavailableMembers: [] };
  if (availableCount === 0)
    return { status: 'none', count: 0, unavailableMembers };
  if (availableCount >= total * 0.6)
    return { status: 'most', count: availableCount, unavailableMembers };
  return { status: 'some', count: availableCount, unavailableMembers };
}

export default function BandAvailabilityPage() {
  const navigate = useNavigate();
  const { bandId } = useParams<{ bandId: string }>();

  const [loading, setLoading] = React.useState(true);
  const [bandName, setBandName] = React.useState('');
  const [members, setMembers] = React.useState<Member[]>([]);
  const [unavailableDates, setUnavailableDates] = React.useState<
    UnavailableDate[]
  >([]);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [myRole, setMyRole] = React.useState<MembershipRole | null>(null);

  const isAdmin = myRole === 'admin';

  const today = new Date();
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());

  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // Load data
  React.useEffect(() => {
    if (!bandId) return;
    let alive = true;

    (async () => {
      setLoading(true);

      // current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!alive) return;
      const myUserId = user?.id ?? null;

      // Get band info
      const { data: band } = await supabase
        .from('bands')
        .select('name')
        .eq('id', bandId)
        .single();

      if (!alive) return;

      if (band) setBandName(band.name);

      // Get members
      const { data: memberData } = await supabase
        .from('band_members')
        .select(
          `
          user_id,
          role,
          profiles:user_id (
            id,
            display_name,
            first_name,
            last_name,
            avatar_url
          )
        `
        )
        .eq('band_id', bandId);

      if (!alive) return;

      const memberList: Member[] = (memberData ?? []).map((m: any) => {
        const p = m.profiles;
        const name =
          p?.display_name ||
          [p?.first_name, p?.last_name].filter(Boolean).join(' ') ||
          'Unknown';
        return {
          id: m.user_id,
          name,
          role: m.role,
          avatarUrl: p?.avatar_url ?? null,
        };
      });

      setMembers(memberList);

      // figure out my role in this band
      if (myUserId) {
        const me = memberList.find((m) => m.id === myUserId);
        if (me?.role === 'admin') {
          setMyRole('admin');
        } else if (me) {
          setMyRole('member');
        } else {
          setMyRole(null);
        }
      } else {
        setMyRole(null);
      }

      // Get availability (for all members in this band)
      if (memberList.length > 0) {
        const profileIds = memberList.map((m) => m.id);
        const { data: availData } = await supabase
          .from('member_availability_dates')
          .select('date, profile_id')
          .in('profile_id', profileIds)
          .gte('date', todayKey);

        if (alive) {
          setUnavailableDates(
            (availData ?? []).map((row) => ({
              date: row.date,
              profileId: row.profile_id,
            }))
          );
        }
      }

      if (alive) setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, [bandId, todayKey]);

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
    setSelectedDate(null);
  };

  const goToToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  const calendarCells: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) calendarCells.push(null);
  for (let d = 1; d <= daysInMonth; d++) calendarCells.push(d);

  const selectedDateInfo = selectedDate
    ? getDateStatus(selectedDate, members, unavailableDates)
    : null;

  // Count stats for month
  let allFreeCount = 0;
  let partialCount = 0;
  let noneFreeCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dk = formatDateKey(viewYear, viewMonth, d);
    if (dk < todayKey) continue;
    const { status } = getDateStatus(dk, members, unavailableDates);
    if (status === 'all') allFreeCount++;
    else if (status === 'none') noneFreeCount++;
    else partialCount++;
  }

  const handleCreateEvent = () => {
    if (!selectedDate || !bandId || !isAdmin) return;
    const starts = new Date(`${selectedDate}T20:00:00`);

    if (Number.isNaN(+starts)) return;

    window.dispatchEvent(
      new CustomEvent('amplee:global-create', {
        detail: {
          kind: 'event',
          bandId,
          startsAt: starts.toISOString(),
        },
      })
    );
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
                Availability
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
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
        }}
      >
        {loading ? (
          <div
            style={{ display: 'grid', placeItems: 'center', height: '60vh' }}
          >
            <IonSpinner style={{ '--color': '#a78bfa' }} />
          </div>
        ) : (
          <div
            style={{
              maxWidth: 600,
              margin: '0 auto',
              padding: '0 16px 120px', // extra bottom padding so it clears bottom nav
            }}
          >
            {/* Legend */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 16,
                padding: '16px 0',
                fontSize: 11,
                color: '#9ca3af',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: 'rgba(34, 197, 94, 0.3)',
                    border: '1px solid rgba(34, 197, 94, 0.5)',
                  }}
                />
                <span>All available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: 'rgba(250, 204, 21, 0.3)',
                    border: '1px solid rgba(250, 204, 21, 0.5)',
                  }}
                />
                <span>Partial</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: 3,
                    background: 'rgba(239, 68, 68, 0.3)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                  }}
                />
                <span>None free</span>
              </div>
            </div>

            {/* Month Navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 0 16px',
              }}
            >
              <button
                type="button"
                onClick={goToPrevMonth}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  fontSize: 16,
                }}
              >
                ‹
              </button>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{ fontSize: 20, fontWeight: 700, color: '#f9fafb' }}
                >
                  {MONTHS[viewMonth]} {viewYear}
                </div>
                <button
                  type="button"
                  onClick={goToToday}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 12,
                    color: '#a78bfa',
                    cursor: 'pointer',
                    marginTop: 2,
                  }}
                >
                  Today
                </button>
              </div>
              <button
                type="button"
                onClick={goToNextMonth}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '10px 16px',
                  cursor: 'pointer',
                  color: '#9ca3af',
                  fontSize: 16,
                }}
              >
                ›
              </button>
            </div>

            {/* Calendar */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: 16,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 4,
                  marginBottom: 8,
                }}
              >
                {DAYS.map((day) => (
                  <div
                    key={day}
                    style={{
                      textAlign: 'center',
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#6b7280',
                      padding: '8px 0',
                    }}
                  >
                    {day}
                  </div>
                ))}
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 4,
                }}
              >
                {calendarCells.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} />;

                  const dateKey = formatDateKey(viewYear, viewMonth, day);
                  const { status, count } = getDateStatus(
                    dateKey,
                    members,
                    unavailableDates
                  );
                  const isSelected = selectedDate === dateKey;
                  const isToday = dateKey === todayKey;
                  const isPast = dateKey < todayKey;

                  const statusColors = {
                    all: {
                      bg: 'rgba(34, 197, 94, 0.15)',
                      border: 'rgba(34, 197, 94, 0.4)',
                      text: '#4ade80',
                    },
                    most: {
                      bg: 'rgba(34, 197, 94, 0.1)',
                      border: 'rgba(34, 197, 94, 0.25)',
                      text: '#86efac',
                    },
                    some: {
                      bg: 'rgba(250, 204, 21, 0.15)',
                      border: 'rgba(250, 204, 21, 0.4)',
                      text: '#fde047',
                    },
                    none: {
                      bg: 'rgba(239, 68, 68, 0.15)',
                      border: 'rgba(239, 68, 68, 0.4)',
                      text: '#fca5a5',
                    },
                  };

                  const colors = statusColors[status];

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() =>
                        !isPast && setSelectedDate(isSelected ? null : dateKey)
                      }
                      disabled={isPast}
                      style={{
                        aspectRatio: '1',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 10,
                        border: isSelected
                          ? '2px solid #a78bfa'
                          : isToday
                          ? '2px solid rgba(167, 139, 250, 0.4)'
                          : `1px solid ${colors.border}`,
                        background: isSelected
                          ? 'rgba(167, 139, 250, 0.2)'
                          : colors.bg,
                        cursor: isPast ? 'default' : 'pointer',
                        opacity: isPast ? 0.4 : 1,
                        gap: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: 600,
                          color: isSelected ? '#c4b5fd' : colors.text,
                        }}
                      >
                        {day}
                      </span>
                      <span
                        style={{
                          fontSize: 9,
                          color: isSelected
                            ? '#a78bfa'
                            : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {count}/{members.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Detail */}
            {selectedDate && selectedDateInfo && (
              <div
                style={{
                  background: 'rgba(139, 92, 246, 0.08)',
                  border: '1px solid rgba(139, 92, 246, 0.25)',
                  borderRadius: 16,
                  padding: 20,
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#a78bfa',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px',
                      }}
                    >
                      Selected Date
                    </div>
                    <div
                      style={{ fontSize: 18, fontWeight: 700, marginTop: 4 }}
                    >
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString(
                        'en-US',
                        { weekday: 'long', month: 'long', day: 'numeric' }
                      )}
                    </div>
                  </div>
                  <div
                    style={{
                      background:
                        selectedDateInfo.status === 'all'
                          ? 'rgba(34, 197, 94, 0.2)'
                          : selectedDateInfo.status === 'none'
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(250, 204, 21, 0.2)',
                      padding: '8px 14px',
                      borderRadius: 20,
                      fontSize: 13,
                      fontWeight: 600,
                      color:
                        selectedDateInfo.status === 'all'
                          ? '#4ade80'
                          : selectedDateInfo.status === 'none'
                          ? '#fca5a5'
                          : '#fde047',
                    }}
                  >
                    {selectedDateInfo.count}/{members.length} available
                  </div>
                </div>

                {/* Available */}
                <div style={{ marginBottom: 16 }}>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#9ca3af',
                      marginBottom: 10,
                      fontWeight: 600,
                    }}
                  >
                    ✓ Available
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {members
                      .filter(
                        (m) =>
                          !selectedDateInfo.unavailableMembers.find(
                            (u) => u.id === m.id
                          )
                      )
                      .map((member) => (
                        <div
                          key={member.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            border: '1px solid rgba(34, 197, 94, 0.2)',
                            borderRadius: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background:
                                'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#e5e7eb',
                              }}
                            >
                              {member.name}
                            </div>
                            {member.role && (
                              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                {member.role}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Unavailable */}
                {selectedDateInfo.unavailableMembers.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#9ca3af',
                        marginBottom: 10,
                        fontWeight: 600,
                      }}
                    >
                      ✗ Unavailable
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {selectedDateInfo.unavailableMembers.map((member) => (
                        <div
                          key={member.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            borderRadius: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background:
                                'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {getInitials(member.name)}
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#e5e7eb',
                              }}
                            >
                              {member.name}
                            </div>
                            {member.role && (
                              <div style={{ fontSize: 11, color: '#9ca3af' }}>
                                {member.role}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: 10,
                    marginTop: 20,
                    paddingTop: 16,
                    borderTop: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  {/* Only admins can create events */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleCreateEvent}
                      style={{
                        flex: 1,
                        padding: '12px 16px',
                        borderRadius: 10,
                        border: '1px solid rgba(34, 197, 94, 0.3)',
                        background: 'rgba(34, 197, 94, 0.15)',
                        color: '#86efac',
                        fontSize: 13,
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Create Event
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Summary Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
                marginTop: 16,
              }}
            >
              <div
                style={{
                  background: 'rgba(34, 197, 94, 0.08)',
                  border: '1px solid rgba(34, 197, 94, 0.15)',
                  borderRadius: 12,
                  padding: 14,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{ fontSize: 24, fontWeight: 700, color: '#4ade80' }}
                >
                  {allFreeCount}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                  All Available
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(250, 204, 21, 0.08)',
                  border: '1px solid rgba(250, 204, 21, 0.15)',
                  borderRadius: 12,
                  padding: 14,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{ fontSize: 24, fontWeight: 700, color: '#fde047' }}
                >
                  {partialCount}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                  Partial
                </div>
              </div>
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.15)',
                  borderRadius: 12,
                  padding: 14,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{ fontSize: 24, fontWeight: 700, color: '#fca5a5' }}
                >
                  {noneFreeCount}
                </div>
                <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>
                  None Free
                </div>
              </div>
            </div>

            {/* Info */}
            <div
              style={{
                padding: '14px 16px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 12,
                marginTop: 16,
                fontSize: 13,
                color: '#9ca3af',
                lineHeight: 1.5,
              }}
            >
              Tap any date to see who's available. Members update their own
              availability from their profile.
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
