import { Capacitor } from '@capacitor/core';
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import {
  addOutline,
  calendarOutline,
  chevronBack,
  chevronBackOutline,
  chevronForward,
  closeCircleOutline,
  createOutline,
  repeatOutline,
  timeOutline,
  trashOutline,
} from 'ionicons/icons';

const isAndroid = Capacitor.getPlatform() === 'android';
import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import AndroidBottomSafeArea from '../components/AndroidBottomSafeArea';
import { supabase } from '../lib/supabase';

type UnavailableDate = {
  id: string;
  date: string;
  note: string | null;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  source: 'manual' | 'recurring';
};

type AvailabilityRule = {
  id: string;
  day_of_week: number;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
  note: string | null;
  starts_on: string;
  ends_on: string | null;
};

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
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

function formatTime(time: string | null): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}:${minutes}${ampm}`;
}

function formatTimeRange(
  allDay: boolean,
  startTime: string | null,
  endTime: string | null
): string {
  if (allDay) return 'All day';
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

const MAX_NOTE_LENGTH = 100;
const TRUNCATE_LENGTH = 30;

function truncateNote(note: string): string {
  if (note.length <= TRUNCATE_LENGTH) return note;
  return note.slice(0, TRUNCATE_LENGTH).trim() + '...';
}

// Modal for adding/editing unavailable dates
function DateModal({
  isOpen,
  dateKey,
  existing,
  onClose,
  onSave,
  onDelete,
  saving,
}: {
  isOpen: boolean;
  dateKey: string;
  existing: UnavailableDate | null;
  onClose: () => void;
  onSave: (data: {
    all_day: boolean;
    start_time: string | null;
    end_time: string | null;
    note: string;
  }) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [allDay, setAllDay] = React.useState(true);
  const [startTime, setStartTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('17:00');
  const [note, setNote] = React.useState('');

  React.useEffect(() => {
    if (existing) {
      setAllDay(existing.all_day);
      setStartTime(existing.start_time || '09:00');
      setEndTime(existing.end_time || '17:00');
      setNote(existing.note || '');
    } else {
      setAllDay(true);
      setStartTime('09:00');
      setEndTime('17:00');
      setNote('');
    }
  }, [existing, isOpen]);

  if (!isOpen) return null;

  const displayDate = formatDisplayDate(dateKey);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a24',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 360,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#f9fafb',
            margin: '0 0 4px 0',
          }}
        >
          {existing ? 'Edit Unavailability' : 'Mark Unavailable'}
        </h3>
        <p style={{ fontSize: 14, color: '#9ca3af', margin: '0 0 20px 0' }}>
          {displayDate}
        </p>

        {/* All Day Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 14, color: '#e5e7eb' }}>All day</span>
          <button
            type="button"
            onClick={() => setAllDay(!allDay)}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              border: 'none',
              background: allDay
                ? 'rgba(167, 139, 250, 0.5)'
                : 'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                background: allDay ? '#a78bfa' : '#6b7280',
                position: 'absolute',
                top: 3,
                left: allDay ? 23 : 3,
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>

        {/* Time Pickers (if not all day) */}
        {!allDay && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: 12,
                  color: '#9ca3af',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Start time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: '#f9fafb',
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: 12,
                  color: '#9ca3af',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                End time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: '#f9fafb',
                  fontSize: 14,
                }}
              />
            </div>
          </div>
        )}

        {/* Note */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <label style={{ fontSize: 12, color: '#9ca3af' }}>
              Note (optional)
            </label>
            <span
              style={{
                fontSize: 11,
                color: note.length > MAX_NOTE_LENGTH * 0.8 ? '#fbbf24' : '#6b7280',
              }}
            >
              {note.length}/{MAX_NOTE_LENGTH}
            </span>
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
            placeholder="e.g., Doctor appointment"
            maxLength={MAX_NOTE_LENGTH}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: '#f9fafb',
              fontSize: 14,
            }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {existing && (
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#fca5a5',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: saving ? 0.5 : 1,
              }}
            >
              Remove
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#9ca3af',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: saving ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                all_day: allDay,
                start_time: allDay ? null : startTime,
                end_time: allDay ? null : endTime,
                note,
              })
            }
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modal for adding/editing recurring rules
function RuleModal({
  isOpen,
  existing,
  onClose,
  onSave,
  onDelete,
  saving,
}: {
  isOpen: boolean;
  existing: AvailabilityRule | null;
  onClose: () => void;
  onSave: (data: {
    day_of_week: number;
    all_day: boolean;
    start_time: string | null;
    end_time: string | null;
    note: string;
    ends_on: string | null;
  }) => void;
  onDelete: () => void;
  saving: boolean;
}) {
  const [dayOfWeek, setDayOfWeek] = React.useState(1); // Monday
  const [allDay, setAllDay] = React.useState(true);
  const [startTime, setStartTime] = React.useState('09:00');
  const [endTime, setEndTime] = React.useState('17:00');
  const [note, setNote] = React.useState('');
  const [hasEndDate, setHasEndDate] = React.useState(false);
  const [endsOn, setEndsOn] = React.useState('');

  React.useEffect(() => {
    if (existing) {
      setDayOfWeek(existing.day_of_week);
      setAllDay(existing.all_day);
      setStartTime(existing.start_time || '09:00');
      setEndTime(existing.end_time || '17:00');
      setNote(existing.note || '');
      setHasEndDate(!!existing.ends_on);
      setEndsOn(existing.ends_on || '');
    } else {
      setDayOfWeek(1);
      setAllDay(true);
      setStartTime('09:00');
      setEndTime('17:00');
      setNote('');
      setHasEndDate(false);
      setEndsOn('');
    }
  }, [existing, isOpen]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#1a1a24',
          borderRadius: 16,
          padding: 24,
          width: '100%',
          maxWidth: 360,
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#f9fafb',
            margin: '0 0 20px 0',
          }}
        >
          {existing ? 'Edit Recurring Rule' : 'Add Recurring Rule'}
        </h3>

        {/* Day of Week */}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 12,
              color: '#9ca3af',
              display: 'block',
              marginBottom: 8,
            }}
          >
            Day of week
          </label>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            {FULL_DAYS.map((day, idx) => (
              <button
                key={day}
                type="button"
                onClick={() => setDayOfWeek(idx)}
                style={{
                  padding: '8px 12px',
                  borderRadius: 8,
                  border:
                    dayOfWeek === idx
                      ? '1px solid rgba(167, 139, 250, 0.5)'
                      : '1px solid rgba(255,255,255,0.1)',
                  background:
                    dayOfWeek === idx
                      ? 'rgba(167, 139, 250, 0.2)'
                      : 'rgba(255,255,255,0.05)',
                  color: dayOfWeek === idx ? '#c4b5fd' : '#9ca3af',
                  fontSize: 13,
                  fontWeight: dayOfWeek === idx ? 600 : 400,
                  cursor: 'pointer',
                }}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* All Day Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 16,
          }}
        >
          <span style={{ fontSize: 14, color: '#e5e7eb' }}>All day</span>
          <button
            type="button"
            onClick={() => setAllDay(!allDay)}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              border: 'none',
              background: allDay
                ? 'rgba(167, 139, 250, 0.5)'
                : 'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                background: allDay ? '#a78bfa' : '#6b7280',
                position: 'absolute',
                top: 3,
                left: allDay ? 23 : 3,
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>

        {/* Time Pickers (if not all day) */}
        {!allDay && (
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: 12,
                  color: '#9ca3af',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                Start time
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: '#f9fafb',
                  fontSize: 14,
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label
                style={{
                  fontSize: 12,
                  color: '#9ca3af',
                  display: 'block',
                  marginBottom: 6,
                }}
              >
                End time
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10,
                  color: '#f9fafb',
                  fontSize: 14,
                }}
              />
            </div>
          </div>
        )}

        {/* Note */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 6,
            }}
          >
            <label style={{ fontSize: 12, color: '#9ca3af' }}>
              Note (optional)
            </label>
            <span
              style={{
                fontSize: 11,
                color: note.length > MAX_NOTE_LENGTH * 0.8 ? '#fbbf24' : '#6b7280',
              }}
            >
              {note.length}/{MAX_NOTE_LENGTH}
            </span>
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, MAX_NOTE_LENGTH))}
            placeholder="e.g., Day job"
            maxLength={MAX_NOTE_LENGTH}
            style={{
              width: '100%',
              padding: '10px 12px',
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10,
              color: '#f9fafb',
              fontSize: 14,
            }}
          />
        </div>

        {/* End Date Toggle */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: hasEndDate ? 12 : 20,
          }}
        >
          <span style={{ fontSize: 14, color: '#e5e7eb' }}>Set end date</span>
          <button
            type="button"
            onClick={() => setHasEndDate(!hasEndDate)}
            style={{
              width: 48,
              height: 28,
              borderRadius: 14,
              border: 'none',
              background: hasEndDate
                ? 'rgba(167, 139, 250, 0.5)'
                : 'rgba(255,255,255,0.1)',
              cursor: 'pointer',
              position: 'relative',
              transition: 'background 0.2s',
            }}
          >
            <div
              style={{
                width: 22,
                height: 22,
                borderRadius: 11,
                background: hasEndDate ? '#a78bfa' : '#6b7280',
                position: 'absolute',
                top: 3,
                left: hasEndDate ? 23 : 3,
                transition: 'left 0.2s',
              }}
            />
          </button>
        </div>

        {/* End Date Picker */}
        {hasEndDate && (
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                fontSize: 12,
                color: '#9ca3af',
                display: 'block',
                marginBottom: 6,
              }}
            >
              Ends on
            </label>
            <input
              type="date"
              value={endsOn}
              onChange={(e) => setEndsOn(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10,
                color: '#f9fafb',
                fontSize: 14,
              }}
            />
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          {existing && (
            <button
              type="button"
              onClick={onDelete}
              disabled={saving}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: 10,
                border: '1px solid rgba(239, 68, 68, 0.3)',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#fca5a5',
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                opacity: saving ? 0.5 : 1,
              }}
            >
              Delete
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.1)',
              background: 'rgba(255,255,255,0.05)',
              color: '#9ca3af',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: saving ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() =>
              onSave({
                day_of_week: dayOfWeek,
                all_day: allDay,
                start_time: allDay ? null : startTime,
                end_time: allDay ? null : endTime,
                note,
                ends_on: hasEndDate && endsOn ? endsOn : null,
              })
            }
            disabled={saving}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              opacity: saving ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfileAvailability() {
  const nav = useNavigate();

  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [userId, setUserId] = React.useState<string | null>(null);
  const [unavailableDates, setUnavailableDates] = React.useState<
    Map<string, UnavailableDate>
  >(new Map());
  const [rules, setRules] = React.useState<AvailabilityRule[]>([]);
  const [savingDates, setSavingDates] = React.useState<Set<string>>(new Set());
  const [savingRule, setSavingRule] = React.useState(false);

  // Modal state
  const [dateModalOpen, setDateModalOpen] = React.useState(false);
  const [selectedDateKey, setSelectedDateKey] = React.useState<string | null>(
    null
  );
  const [ruleModalOpen, setRuleModalOpen] = React.useState(false);
  const [editingRule, setEditingRule] = React.useState<AvailabilityRule | null>(
    null
  );

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

      // Fetch dates and rules in parallel
      const [datesResult, rulesResult] = await Promise.all([
        supabase
          .from('member_availability_dates')
          .select('id, date, note, all_day, start_time, end_time, source')
          .eq('profile_id', auth.user.id)
          .order('date', { ascending: true }),
        supabase
          .from('member_availability_rules')
          .select(
            'id, day_of_week, all_day, start_time, end_time, note, starts_on, ends_on'
          )
          .eq('profile_id', auth.user.id)
          .order('day_of_week', { ascending: true }),
      ]);

      if (!alive) return;

      if (datesResult.error) {
        console.error(datesResult.error);
        setError('Unable to load availability.');
        setLoading(false);
        return;
      }

      const dateMap = new Map<string, UnavailableDate>();
      (datesResult.data ?? []).forEach((row) => {
        dateMap.set(row.date, {
          id: row.id,
          date: row.date,
          note: row.note,
          all_day: row.all_day ?? true,
          start_time: row.start_time,
          end_time: row.end_time,
          source: (row.source as 'manual' | 'recurring') || 'manual',
        });
      });

      setUnavailableDates(dateMap);
      setRules(rulesResult.data ?? []);
      setLoading(false);
    })();

    return () => {
      alive = false;
    };
  }, []);

  // Compute recurring dates for current month view
  const recurringDatesForMonth = React.useMemo(() => {
    const result = new Map<string, AvailabilityRule>();
    const daysInMonth = getDaysInMonth(viewYear, viewMonth);

    for (const rule of rules) {
      // Check if rule is active
      const startsOn = new Date(rule.starts_on + 'T00:00:00');
      const endsOn = rule.ends_on
        ? new Date(rule.ends_on + 'T23:59:59')
        : null;

      for (let d = 1; d <= daysInMonth; d++) {
        const dateKey = formatDateKey(viewYear, viewMonth, d);
        const date = new Date(dateKey + 'T00:00:00');

        // Check if date matches rule's day of week
        if (date.getDay() !== rule.day_of_week) continue;

        // Check if date is within rule's active period
        if (date < startsOn) continue;
        if (endsOn && date > endsOn) continue;

        // Check if there's no manual override for this date
        if (!unavailableDates.has(dateKey)) {
          result.set(dateKey, rule);
        }
      }
    }

    return result;
  }, [rules, viewYear, viewMonth, unavailableDates]);

  const handleDateTap = (dateKey: string) => {
    setSelectedDateKey(dateKey);
    setDateModalOpen(true);
  };

  const handleSaveDate = async (data: {
    all_day: boolean;
    start_time: string | null;
    end_time: string | null;
    note: string;
  }) => {
    if (!userId || !selectedDateKey) return;

    setSavingDates((prev) => new Set(prev).add(selectedDateKey));

    try {
      const existing = unavailableDates.get(selectedDateKey);

      if (existing) {
        // Update existing
        const { error: updErr } = await supabase
          .from('member_availability_dates')
          .update({
            all_day: data.all_day,
            start_time: data.start_time,
            end_time: data.end_time,
            note: data.note || null,
          })
          .eq('id', existing.id);

        if (updErr) throw updErr;

        setUnavailableDates((prev) => {
          const next = new Map(prev);
          next.set(selectedDateKey, {
            ...existing,
            all_day: data.all_day,
            start_time: data.start_time,
            end_time: data.end_time,
            note: data.note || null,
          });
          return next;
        });
      } else {
        // Insert new
        const { data: inserted, error: insErr } = await supabase
          .from('member_availability_dates')
          .insert({
            profile_id: userId,
            date: selectedDateKey,
            all_day: data.all_day,
            start_time: data.start_time,
            end_time: data.end_time,
            note: data.note || null,
            source: 'manual',
          })
          .select('id, date, note, all_day, start_time, end_time, source')
          .single();

        if (insErr) throw insErr;

        setUnavailableDates((prev) => {
          const next = new Map(prev);
          next.set(selectedDateKey, {
            id: inserted.id,
            date: inserted.date,
            note: inserted.note,
            all_day: inserted.all_day ?? true,
            start_time: inserted.start_time,
            end_time: inserted.end_time,
            source: (inserted.source as 'manual' | 'recurring') || 'manual',
          });
          return next;
        });
      }

      setDateModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDates((prev) => {
        const next = new Set(prev);
        next.delete(selectedDateKey);
        return next;
      });
    }
  };

  const handleDeleteDate = async () => {
    if (!selectedDateKey) return;

    const existing = unavailableDates.get(selectedDateKey);
    if (!existing) {
      setDateModalOpen(false);
      return;
    }

    setSavingDates((prev) => new Set(prev).add(selectedDateKey));

    try {
      const { error: delErr } = await supabase
        .from('member_availability_dates')
        .delete()
        .eq('id', existing.id);

      if (delErr) throw delErr;

      setUnavailableDates((prev) => {
        const next = new Map(prev);
        next.delete(selectedDateKey);
        return next;
      });

      setDateModalOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingDates((prev) => {
        const next = new Set(prev);
        next.delete(selectedDateKey);
        return next;
      });
    }
  };

  const handleSaveRule = async (data: {
    day_of_week: number;
    all_day: boolean;
    start_time: string | null;
    end_time: string | null;
    note: string;
    ends_on: string | null;
  }) => {
    if (!userId) return;

    setSavingRule(true);

    try {
      if (editingRule) {
        // Update existing rule
        const { error: updErr } = await supabase
          .from('member_availability_rules')
          .update({
            day_of_week: data.day_of_week,
            all_day: data.all_day,
            start_time: data.start_time,
            end_time: data.end_time,
            note: data.note || null,
            ends_on: data.ends_on,
          })
          .eq('id', editingRule.id);

        if (updErr) throw updErr;

        setRules((prev) =>
          prev.map((r) =>
            r.id === editingRule.id
              ? {
                  ...r,
                  day_of_week: data.day_of_week,
                  all_day: data.all_day,
                  start_time: data.start_time,
                  end_time: data.end_time,
                  note: data.note || null,
                  ends_on: data.ends_on,
                }
              : r
          )
        );
      } else {
        // Insert new rule
        const { data: inserted, error: insErr } = await supabase
          .from('member_availability_rules')
          .insert({
            profile_id: userId,
            rule_type: 'weekly',
            day_of_week: data.day_of_week,
            all_day: data.all_day,
            start_time: data.start_time,
            end_time: data.end_time,
            note: data.note || null,
            ends_on: data.ends_on,
          })
          .select(
            'id, day_of_week, all_day, start_time, end_time, note, starts_on, ends_on'
          )
          .single();

        if (insErr) throw insErr;

        setRules((prev) => [...prev, inserted]);
      }

      setRuleModalOpen(false);
      setEditingRule(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRule(false);
    }
  };

  const handleDeleteRule = async () => {
    if (!editingRule) return;

    setSavingRule(true);

    try {
      const { error: delErr } = await supabase
        .from('member_availability_rules')
        .delete()
        .eq('id', editingRule.id);

      if (delErr) throw delErr;

      setRules((prev) => prev.filter((r) => r.id !== editingRule.id));
      setRuleModalOpen(false);
      setEditingRule(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingRule(false);
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

  // Get all unavailable dates for the month (manual + would show from recurring)
  const currentMonthUnavailable = Array.from(unavailableDates.values())
    .filter(
      (d) => d.date >= monthStart && d.date <= monthEnd && d.date >= todayKey
    )
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <IonPage>
      <IonHeader translucent className="ion-no-border">
        <IonToolbar
          style={{
            '--background': 'rgba(8, 8, 14, 0.95)',
            '--border-width': 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              gap: 12,
            }}
          >
            {/* Back Button */}
            <button
              onClick={() => nav(-1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                placeItems: 'center',
                color: '#9ca3af',
                flexShrink: 0,
              }}
            >
              <IonIcon icon={chevronBackOutline} style={{ fontSize: 20 }} />
            </button>

            {/* Title Section */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon
                  icon={calendarOutline}
                  style={{ color: '#a78bfa', fontSize: 20 }}
                />
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#f9fafb',
                    margin: 0,
                    letterSpacing: '-0.5px',
                  }}
                >
                  My Availability
                </h1>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#6b7280',
                  marginTop: 2,
                  marginLeft: 28,
                }}
              >
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
          '--padding-bottom': isAndroid
            ? '80px'
            : 'calc(env(safe-area-inset-bottom) + 24px)',
        } as React.CSSProperties}
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
            {/* Recurring Rules Section */}
            <div
              style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: 16,
                padding: '16px',
                marginTop: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: rules.length > 0 ? 12 : 0,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IonIcon
                    icon={repeatOutline}
                    style={{ fontSize: 18, color: '#a78bfa' }}
                  />
                  <span
                    style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}
                  >
                    Recurring Rules
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingRule(null);
                    setRuleModalOpen(true);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: '1px solid rgba(167, 139, 250, 0.3)',
                    background: 'rgba(167, 139, 250, 0.1)',
                    color: '#c4b5fd',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <IonIcon icon={addOutline} style={{ fontSize: 14 }} />
                  Add Rule
                </button>
              </div>

              {rules.length === 0 && (
                <p
                  style={{
                    fontSize: 13,
                    color: '#6b7280',
                    margin: '8px 0 0 0',
                  }}
                >
                  No recurring rules yet. Add one to block off regular
                  commitments like your day job.
                </p>
              )}

              {rules.length > 0 && (
                <div
                  style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {rules.map((rule) => (
                    <div
                      key={rule.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: 'rgba(167, 139, 250, 0.08)',
                        border: '1px solid rgba(167, 139, 250, 0.15)',
                        borderRadius: 10,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: 600,
                            color: '#e5e7eb',
                          }}
                        >
                          Every {FULL_DAYS[rule.day_of_week]}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#9ca3af',
                            marginTop: 2,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 4,
                            }}
                          >
                            <IonIcon
                              icon={timeOutline}
                              style={{ fontSize: 12 }}
                            />
                            {formatTimeRange(
                              rule.all_day,
                              rule.start_time,
                              rule.end_time
                            )}
                          </span>
                          {rule.note && (
                            <>
                              <span style={{ color: '#4b5563' }}>•</span>
                              <span title={rule.note}>{truncateNote(rule.note)}</span>
                            </>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRule(rule);
                          setRuleModalOpen(true);
                        }}
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 8,
                          border: 'none',
                          background: 'rgba(255,255,255,0.05)',
                          color: '#9ca3af',
                          cursor: 'pointer',
                          display: 'grid',
                          placeItems: 'center',
                        }}
                      >
                        <IonIcon icon={createOutline} style={{ fontSize: 16 }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
                  const manualEntry = unavailableDates.get(dateKey);
                  const recurringRule = recurringDatesForMonth.get(dateKey);
                  const isUnavailable = !!manualEntry || !!recurringRule;
                  const isRecurring = !manualEntry && !!recurringRule;
                  const isSaving = savingDates.has(dateKey);
                  const isToday = dateKey === todayKey;
                  const isPast = dateKey < todayKey;

                  return (
                    <button
                      key={dateKey}
                      type="button"
                      onClick={() => !isPast && handleDateTap(dateKey)}
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
                          ? isRecurring
                            ? 'repeating-linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0px, rgba(239, 68, 68, 0.15) 4px, rgba(239, 68, 68, 0.25) 4px, rgba(239, 68, 68, 0.25) 8px)'
                            : 'rgba(239, 68, 68, 0.2)'
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
                gap: 16,
                marginTop: 16,
                fontSize: 11,
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 4,
                    background:
                      'repeating-linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0px, rgba(239, 68, 68, 0.15) 2px, rgba(239, 68, 68, 0.25) 2px, rgba(239, 68, 68, 0.25) 4px)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                  }}
                />
                <span>Recurring</span>
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
                      <div>
                        <div style={{ fontSize: 13, color: '#e5e7eb' }}>
                          {formatDisplayDate(item.date)}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: '#9ca3af',
                            marginTop: 2,
                          }}
                        >
                          {formatTimeRange(
                            item.all_day,
                            item.start_time,
                            item.end_time
                          )}
                          {item.note && (
                            <span title={item.note}>
                              {' '}
                              • {truncateNote(item.note)}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDateTap(item.date)}
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
                          icon={createOutline}
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
                Band admins will see your unavailable dates and notes when
                scheduling events and proposals.
              </p>
            </div>
          </div>
        )}

        {/* Date Modal */}
        <DateModal
          isOpen={dateModalOpen}
          dateKey={selectedDateKey || ''}
          existing={
            selectedDateKey ? unavailableDates.get(selectedDateKey) || null : null
          }
          onClose={() => setDateModalOpen(false)}
          onSave={handleSaveDate}
          onDelete={handleDeleteDate}
          saving={savingDates.has(selectedDateKey || '')}
        />

        {/* Rule Modal */}
        <RuleModal
          isOpen={ruleModalOpen}
          existing={editingRule}
          onClose={() => {
            setRuleModalOpen(false);
            setEditingRule(null);
          }}
          onSave={handleSaveRule}
          onDelete={handleDeleteRule}
          saving={savingRule}
        />
      </IonContent>
      <AndroidBottomSafeArea />
    </IonPage>
  );
}
