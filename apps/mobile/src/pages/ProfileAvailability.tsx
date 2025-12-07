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
  chevronBack,
  chevronBackOutline,
  chevronForward,
  closeCircleOutline,
} from 'ionicons/icons';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type UnavailableDate = {
  id: string;
  date: string;
  note: string | null;
};

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

function formatDisplayDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function ProfileAvailability() {
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [unavailableDates, setUnavailableDates] = React.useState<
    Map<string, UnavailableDate>
  >(new Map());
  const [savingDates, setSavingDates] = React.useState<Set<string>>(new Set());

  const today = new Date();
  const [viewYear, setViewYear] = React.useState(today.getFullYear());
  const [viewMonth, setViewMonth] = React.useState(today.getMonth());

  const todayKey = formatDateKey(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  React.useEffect(() => {
    let alive = true;

    (async () => {
      setLoading(true);
      setError(null);

      const { data: auth, error: authErr } = await supabase.auth.getUser();
      if (authErr || !auth?.user) {
        if (alive) {
          setError('Unable to load session.');
          setLoading(false);
        }
        return;
      }

      setUserId(auth.user.id);

      const { data, error: fetchErr } = await supabase
        .from('member_availability_dates')
        .select('id, date, note')
        .eq('profile_id', auth.user.id)
        .order('date', { ascending: true });

      if (!alive) return;

      if (fetchErr) {
        console.error(fetchErr);
        setError('Unable to load availability.');
        setLoading(false);
        return;
      }

      const dateMap = new Map<string, UnavailableDate>();
      (data ?? []).forEach((row) => {
        dateMap.set(row.date, { id: row.id, date: row.date, note: row.note });
      });

      setUnavailableDates(dateMap);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  const toggleDate = async (dateKey: string) => {
    if (!userId || savingDates.has(dateKey)) return;

    const existing = unavailableDates.get(dateKey);
    setSavingDates((prev) => new Set(prev).add(dateKey));

    try {
      if (existing) {
        const { error: delErr } = await supabase
          .from('member_availability_dates')
          .delete()
          .eq('id', existing.id);

        if (delErr) throw delErr;

        setUnavailableDates((prev) => {
          const next = new Map(prev);
          next.delete(dateKey);
          return next;
        });
      } else {
        const { data, error: insErr } = await supabase
          .from('member_availability_dates')
          .insert({ profile_id: userId, date: dateKey })
          .select('id, date, note')
          .single();

        if (insErr) throw insErr;

        setUnavailableDates((prev) => {
          const next = new Map(prev);
          next.set(dateKey, { id: data.id, date: data.date, note: data.note });
          return next;
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDates((prev) => {
        const next = new Set(prev);
        next.delete(dateKey);
        return next;
      });
    }
  };

  const goToPrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
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

  const monthStart = formatDateKey(viewYear, viewMonth, 1);
  const monthEnd = formatDateKey(viewYear, viewMonth, daysInMonth);
  const currentMonthUnavailable = Array.from(unavailableDates.values())
    .filter(
      (d) => d.date >= monthStart && d.date <= monthEnd && d.date >= todayKey
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <IonPage>
      <IonHeader>
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
              onClick={() => nav(-1)}
              fill="clear"
              style={{ minWidth: 0, padding: 6, margin: 0 }}
            >
              <IonIcon
                icon={chevronBackOutline}
                style={{ color: '#9ca3af', fontSize: 22 }}
              />
            </IonButton>
            <div style={{ flex: 1 }}>
              <h1
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  color: '#F9FAFB',
                  margin: 0,
                }}
              >
                My Availability
              </h1>
              <div style={{ fontSize: 13, color: '#949ba4', marginTop: 2 }}>
                Tap dates when you're unavailable
              </div>
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
        {loading && (
          <div
            style={{ display: 'grid', placeItems: 'center', height: '60vh' }}
          >
            <IonSpinner style={{ '--color': '#a78bfa' }} />
          </div>
        )}

        {!loading && error && (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              gap: 8,
              height: '60vh',
              padding: '0 24px',
            }}
          >
            <p style={{ color: '#ef4444', fontSize: 14, textAlign: 'center' }}>
              {error}
            </p>
          </div>
        )}

        {!loading && !error && (
          <div
            style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px 32px' }}
          >
            {/* Month Navigation */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 0 12px',
              }}
            >
              <button
                type="button"
                onClick={goToPrevMonth}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 10,
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IonIcon
                  icon={chevronBack}
                  style={{ color: '#9ca3af', fontSize: 18 }}
                />
              </button>

              <div style={{ textAlign: 'center' }}>
                <div
                  style={{ fontSize: 18, fontWeight: 700, color: '#f9fafb' }}
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
                  padding: '10px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <IonIcon
                  icon={chevronForward}
                  style={{ color: '#9ca3af', fontSize: 18 }}
                />
              </button>
            </div>

            {/* Calendar Card */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '16px',
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
                  const isUnavailable = unavailableDates.has(dateKey);
                  const isSaving = savingDates.has(dateKey);
                  const isToday = dateKey === todayKey;
                  const isPast = dateKey < todayKey;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => !isPast && toggleDate(dateKey)}
                      disabled={isPast || isSaving}
                      style={{
                        aspectRatio: '1',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 10,
                        border: isToday
                          ? '2px solid rgba(167, 139, 250, 0.5)'
                          : isUnavailable
                          ? '1px solid rgba(239, 68, 68, 0.4)'
                          : '1px solid transparent',
                        background: isUnavailable
                          ? 'rgba(239, 68, 68, 0.2)'
                          : 'rgba(255,255,255,0.02)',
                        cursor: isPast ? 'default' : 'pointer',
                        opacity: isPast ? 0.35 : 1,
                        transition: 'all 0.15s ease',
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 14,
                          fontWeight: isToday || isUnavailable ? 600 : 400,
                          color: isUnavailable
                            ? '#fca5a5'
                            : isToday
                            ? '#c4b5fd'
                            : '#d1d5db',
                        }}
                      >
                        {day}
                      </span>
                      {isSaving && (
                        <IonSpinner
                          style={{
                            position: 'absolute',
                            width: 12,
                            height: 12,
                            '--color': '#a78bfa',
                          }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Legend */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                gap: 20,
                marginTop: 16,
                fontSize: 12,
                color: '#9ca3af',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 4,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                />
                <span>Available</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 4,
                    background: 'rgba(239, 68, 68, 0.2)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                  }}
                />
                <span>Unavailable</span>
              </div>
            </div>

            {/* This Month's Unavailable Dates */}
            {currentMonthUnavailable.length > 0 && (
              <div
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16,
                  padding: '16px 20px',
                  marginTop: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  <IonIcon
                    icon={calendarOutline}
                    style={{ fontSize: 16, color: '#9ca3af' }}
                  />
                  <span
                    style={{ fontSize: 13, fontWeight: 600, color: '#b5bac1' }}
                  >
                    {MONTHS[viewMonth]} Unavailable
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: '#6b7280',
                      background: 'rgba(255,255,255,0.05)',
                      padding: '2px 8px',
                      borderRadius: 10,
                    }}
                  >
                    {currentMonthUnavailable.length}{' '}
                    {currentMonthUnavailable.length === 1 ? 'day' : 'days'}
                  </span>
                </div>

                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {currentMonthUnavailable.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.15)',
                        borderRadius: 10,
                      }}
                    >
                      <span style={{ fontSize: 13, color: '#e5e7eb' }}>
                        {formatDisplayDate(item.date)}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleDate(item.date)}
                        disabled={savingDates.has(item.date)}
                        style={{
                          background: 'none',
                          border: 'none',
                          padding: 4,
                          cursor: 'pointer',
                          opacity: savingDates.has(item.date) ? 0.5 : 1,
                        }}
                      >
                        <IonIcon
                          icon={closeCircleOutline}
                          style={{
                            fontSize: 18,
                            color: 'rgba(255,255,255,0.4)',
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Info Callout */}
            <div
              style={{
                display: 'flex',
                gap: 10,
                padding: '14px 16px',
                background: 'rgba(139, 92, 246, 0.08)',
                border: '1px solid rgba(139, 92, 246, 0.2)',
                borderRadius: 12,
                marginTop: 16,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  color: '#b5bac1',
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                Band admins will see your unavailable dates when scheduling
                events and proposals.
              </p>
            </div>
          </div>
        )}
      </IonContent>
    </IonPage>
  );
}
