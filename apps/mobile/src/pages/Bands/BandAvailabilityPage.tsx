/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import {
  chevronBackOutline,
  chevronDownOutline,
  chevronUpOutline,
  personOutline,
  shieldCheckmarkOutline,
  timeOutline,
} from 'ionicons/icons';
import { MdOutlineEventAvailable } from 'react-icons/md';
import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Hook to detect larger screens (tablets, desktops)
function useIsLargeScreen(breakpoint = 768) {
  const [isLarge, setIsLarge] = React.useState(
    typeof window !== 'undefined' && window.innerWidth >= breakpoint
  );

  React.useEffect(() => {
    const handleResize = () => setIsLarge(window.innerWidth >= breakpoint);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [breakpoint]);

  return isLarge;
}

type Member = {
  id: string;
  name: string;
  role: string | null;
  avatarUrl: string | null;
};

type UnavailableDate = {
  date: string;
  profileId: string;
  note: string | null;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
};

type AvailabilityRule = {
  profileId: string;
  dayOfWeek: number;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  note: string | null;
  startsOn: string;
  endsOn: string | null;
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

// Avatar component with error handling
function Avatar({
  src,
  name,
  size = 32,
  variant = 'available',
}: {
  src: string | null;
  name: string;
  size?: number;
  variant?: 'available' | 'unavailable';
}) {
  const [imgError, setImgError] = React.useState(false);

  const gradients = {
    available: 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
    unavailable: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  };

  const showImage = src && !imgError;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: gradients[variant],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.34,
        fontWeight: 700,
        color: '#fff',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      {showImage ? (
        <img
          src={src}
          alt={name}
          onError={() => setImgError(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      ) : (
        getInitials(name)
      )}
    </div>
  );
}

// Note modal for viewing full text
function NoteModal({
  isOpen,
  memberName,
  note,
  timeRange,
  onClose,
}: {
  isOpen: boolean;
  memberName: string;
  note: string;
  timeRange: string;
  onClose: () => void;
}) {
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
          padding: 20,
          width: '100%',
          maxWidth: 340,
          border: '1px solid rgba(255,255,255,0.1)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            fontSize: 11,
            color: '#fca5a5',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 4,
          }}
        >
          Unavailable
        </div>
        <div
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#f9fafb',
            marginBottom: 4,
          }}
        >
          {memberName}
        </div>
        <div
          style={{
            fontSize: 13,
            color: '#9ca3af',
            marginBottom: 16,
          }}
        >
          {timeRange}
        </div>
        <div
          style={{
            fontSize: 14,
            color: '#e5e7eb',
            lineHeight: 1.5,
            background: 'rgba(255,255,255,0.03)',
            padding: '12px 14px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.06)',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {note}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            marginTop: 16,
            padding: '12px 16px',
            borderRadius: 10,
            border: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)',
            color: '#9ca3af',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Truncated note with tap to expand
const MAX_NOTE_LENGTH = 30;

function TruncatedNote({
  note,
  memberName,
  timeRange,
}: {
  note: string;
  memberName: string;
  timeRange: string;
}) {
  const [showModal, setShowModal] = React.useState(false);
  const isTruncated = note.length > MAX_NOTE_LENGTH;
  const displayText = isTruncated
    ? note.slice(0, MAX_NOTE_LENGTH).trim() + '...'
    : note;

  return (
    <>
      <span
        onClick={isTruncated ? () => setShowModal(true) : undefined}
        style={{
          cursor: isTruncated ? 'pointer' : 'default',
          textDecoration: isTruncated ? 'underline' : 'none',
          textDecorationStyle: 'dotted',
          textUnderlineOffset: 2,
        }}
      >
        {displayText}
      </span>
      <NoteModal
        isOpen={showModal}
        memberName={memberName}
        note={note}
        timeRange={timeRange}
        onClose={() => setShowModal(false)}
      />
    </>
  );
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

type UnavailableMemberInfo = {
  member: Member;
  note: string | null;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
};

function getDateStatus(
  dateKey: string,
  members: Member[],
  unavailableDates: UnavailableDate[],
  expandedRules: Map<string, AvailabilityRule>
): {
  status: 'all' | 'most' | 'some' | 'none';
  count: number;
  unavailableMembers: UnavailableMemberInfo[];
  hasPartialDay: boolean;
} {
  // Get unavailable from explicit dates
  const dateEntries = unavailableDates.filter((d) => d.date === dateKey);
  const unavailableMap = new Map<string, UnavailableMemberInfo>();

  for (const entry of dateEntries) {
    const member = members.find((m) => m.id === entry.profileId);
    if (member) {
      unavailableMap.set(entry.profileId, {
        member,
        note: entry.note,
        allDay: entry.allDay,
        startTime: entry.startTime,
        endTime: entry.endTime,
      });
    }
  }

  // Add from expanded rules (if not already in explicit dates)
  for (const [profileId, rule] of expandedRules) {
    if (!unavailableMap.has(profileId)) {
      const member = members.find((m) => m.id === profileId);
      if (member) {
        unavailableMap.set(profileId, {
          member,
          note: rule.note,
          allDay: rule.allDay,
          startTime: rule.startTime,
          endTime: rule.endTime,
        });
      }
    }
  }

  const unavailableMembers = Array.from(unavailableMap.values());
  const hasPartialDay = unavailableMembers.some((u) => !u.allDay);
  const availableCount = members.length - unavailableMembers.length;
  const total = members.length;

  if (availableCount === total)
    return { status: 'all', count: availableCount, unavailableMembers: [], hasPartialDay: false };
  if (availableCount === 0)
    return { status: 'none', count: 0, unavailableMembers, hasPartialDay };
  if (availableCount >= total * 0.6)
    return { status: 'most', count: availableCount, unavailableMembers, hasPartialDay };
  return { status: 'some', count: availableCount, unavailableMembers, hasPartialDay };
}

// Collapsible section component
function CollapsibleSection({
  title,
  count,
  defaultOpen,
  children,
  variant,
}: {
  title: string;
  count: number;
  defaultOpen: boolean;
  children: React.ReactNode;
  variant: 'available' | 'unavailable';
}) {
  const [isOpen, setIsOpen] = React.useState(defaultOpen);

  const colors = {
    available: {
      bg: 'rgba(34, 197, 94, 0.08)',
      border: 'rgba(34, 197, 94, 0.15)',
      text: '#4ade80',
    },
    unavailable: {
      bg: 'rgba(239, 68, 68, 0.08)',
      border: 'rgba(239, 68, 68, 0.15)',
      text: '#fca5a5',
    },
  };

  const color = colors[variant];

  return (
    <div
      style={{
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 14px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: color.text }}>
            {variant === 'available' ? '✓' : '✗'} {title}
          </span>
          <span
            style={{
              fontSize: 11,
              color: '#9ca3af',
              background: 'rgba(255,255,255,0.05)',
              padding: '2px 8px',
              borderRadius: 10,
            }}
          >
            {count}
          </span>
        </div>
        <IonIcon
          icon={isOpen ? chevronUpOutline : chevronDownOutline}
          style={{ fontSize: 16, color: '#9ca3af' }}
        />
      </button>
      {isOpen && <div style={{ padding: '0 14px 14px' }}>{children}</div>}
    </div>
  );
}

// Avatar stack component for available members
function AvatarStack({
  members,
  maxVisible = 5,
}: {
  members: Member[];
  maxVisible?: number;
}) {
  const visibleMembers = members.slice(0, maxVisible);
  const remaining = members.length - maxVisible;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div style={{ display: 'flex', marginLeft: 0 }}>
        {visibleMembers.map((member, idx) => (
          <div
            key={member.id}
            style={{
              marginLeft: idx === 0 ? 0 : -10,
              position: 'relative',
              zIndex: maxVisible - idx,
              border: '2px solid #1a1a24',
              borderRadius: '50%',
            }}
            title={member.name}
          >
            <Avatar
              src={member.avatarUrl}
              name={member.name}
              size={32}
              variant="available"
            />
          </div>
        ))}
      </div>
      {remaining > 0 && (
        <span
          style={{
            fontSize: 12,
            color: '#9ca3af',
            marginLeft: 8,
          }}
        >
          +{remaining} more
        </span>
      )}
    </div>
  );
}

export default function BandAvailabilityPage() {
  const navigate = useNavigate();
  const { bandId } = useParams<{ bandId: string }>();
  const isLargeScreen = useIsLargeScreen();

  const [loading, setLoading] = React.useState(true);
  const [bandName, setBandName] = React.useState('');
  const [members, setMembers] = React.useState<Member[]>([]);
  const [unavailableDates, setUnavailableDates] = React.useState<
    UnavailableDate[]
  >([]);
  const [rules, setRules] = React.useState<AvailabilityRule[]>([]);
  const [selectedDate, setSelectedDate] = React.useState<string | null>(null);
  const [myRole, setMyRole] = React.useState<MembershipRole | null>(null);

  const isAdmin = myRole === 'admin';
  const isLargeBand = members.length >= 20;

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

      // Get availability and rules (for all members in this band)
      if (memberList.length > 0) {
        const profileIds = memberList.map((m) => m.id);

        const [availResult, rulesResult] = await Promise.all([
          supabase
            .from('member_availability_dates')
            .select('date, profile_id, note, all_day, start_time, end_time')
            .in('profile_id', profileIds)
            .gte('date', todayKey),
          supabase
            .from('member_availability_rules')
            .select(
              'profile_id, day_of_week, all_day, start_time, end_time, note, starts_on, ends_on'
            )
            .in('profile_id', profileIds),
        ]);

        if (alive) {
          setUnavailableDates(
            (availResult.data ?? []).map((row) => ({
              date: row.date,
              profileId: row.profile_id,
              note: row.note,
              allDay: row.all_day ?? true,
              startTime: row.start_time,
              endTime: row.end_time,
            }))
          );

          setRules(
            (rulesResult.data ?? []).map((row) => ({
              profileId: row.profile_id,
              dayOfWeek: row.day_of_week,
              allDay: row.all_day ?? true,
              startTime: row.start_time,
              endTime: row.end_time,
              note: row.note,
              startsOn: row.starts_on,
              endsOn: row.ends_on,
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

  // Expand rules into date-based entries for a given date
  const getExpandedRulesForDate = React.useCallback(
    (dateKey: string): Map<string, AvailabilityRule> => {
      const result = new Map<string, AvailabilityRule>();
      const date = new Date(dateKey + 'T00:00:00');
      const dayOfWeek = date.getDay();

      for (const rule of rules) {
        if (rule.dayOfWeek !== dayOfWeek) continue;

        const startsOn = new Date(rule.startsOn + 'T00:00:00');
        const endsOn = rule.endsOn
          ? new Date(rule.endsOn + 'T23:59:59')
          : null;

        if (date < startsOn) continue;
        if (endsOn && date > endsOn) continue;

        // Check if there's an explicit entry for this date
        const hasExplicit = unavailableDates.some(
          (d) => d.date === dateKey && d.profileId === rule.profileId
        );

        if (!hasExplicit) {
          result.set(rule.profileId, rule);
        }
      }

      return result;
    },
    [rules, unavailableDates]
  );

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
    ? getDateStatus(
        selectedDate,
        members,
        unavailableDates,
        getExpandedRulesForDate(selectedDate)
      )
    : null;

  const availableMembers = selectedDateInfo
    ? members.filter(
        (m) => !selectedDateInfo.unavailableMembers.find((u) => u.member.id === m.id)
      )
    : [];

  // Count stats for month
  let allFreeCount = 0;
  let partialCount = 0;
  let noneFreeCount = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dk = formatDateKey(viewYear, viewMonth, d);
    if (dk < todayKey) continue;
    const { status } = getDateStatus(
      dk,
      members,
      unavailableDates,
      getExpandedRulesForDate(dk)
    );
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
              onClick={() => navigate(`/bands/${bandId}`)}
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
                <MdOutlineEventAvailable
                  style={{ color: '#14b8a6', fontSize: 20 }}
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
                  Availability
                </h1>
              </div>
              {bandName && (
                <div
                  style={{
                    fontSize: 13,
                    color: '#6b7280',
                    marginTop: 2,
                    marginLeft: 28,
                  }}
                >
                  {bandName}
                </div>
              )}
            </div>

            {/* Role Badge */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 10,
                background: isAdmin
                  ? 'rgba(20, 184, 166, 0.08)'
                  : 'rgba(255, 255, 255, 0.04)',
                border: `1px solid ${
                  isAdmin ? 'rgba(20, 184, 166, 0.25)' : 'rgba(255, 255, 255, 0.08)'
                }`,
              }}
            >
              <IonIcon
                icon={isAdmin ? shieldCheckmarkOutline : personOutline}
                style={{
                  fontSize: 14,
                  color: isAdmin ? '#14b8a6' : '#6b7280',
                }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isAdmin ? '#14b8a6' : '#6b7280',
                }}
              >
                {isAdmin ? 'Admin' : 'Member'}
              </span>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #050509 0%, #020109 100%)',
          '--padding-bottom': 'calc(env(safe-area-inset-bottom) + 24px)',
        } as React.CSSProperties}
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
              maxWidth: 900,
              margin: '0 auto',
              padding: isLargeScreen ? '0 24px 120px' : '0 16px 120px',
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
                borderRadius: isLargeScreen ? 20 : 16,
                padding: isLargeScreen ? 24 : 16,
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: isLargeScreen ? 8 : 4,
                  marginBottom: isLargeScreen ? 12 : 8,
                }}
              >
                {DAYS.map((day) => (
                  <div
                    key={day}
                    style={{
                      textAlign: 'center',
                      fontSize: isLargeScreen ? 13 : 11,
                      fontWeight: 600,
                      color: '#6b7280',
                      padding: isLargeScreen ? '12px 0' : '8px 0',
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
                  gap: isLargeScreen ? 8 : 4,
                }}
              >
                {calendarCells.map((day, idx) => {
                  if (day === null) return <div key={`empty-${idx}`} />;

                  const dateKey = formatDateKey(viewYear, viewMonth, day);
                  const { status, count, hasPartialDay } = getDateStatus(
                    dateKey,
                    members,
                    unavailableDates,
                    getExpandedRulesForDate(dateKey)
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
                        borderRadius: isLargeScreen ? 12 : 10,
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
                        gap: isLargeScreen ? 4 : 2,
                        position: 'relative',
                      }}
                    >
                      <span
                        style={{
                          fontSize: isLargeScreen ? 16 : 14,
                          fontWeight: 600,
                          color: isSelected ? '#c4b5fd' : colors.text,
                        }}
                      >
                        {day}
                      </span>
                      <span
                        style={{
                          fontSize: isLargeScreen ? 11 : 9,
                          color: isSelected
                            ? '#a78bfa'
                            : 'rgba(255,255,255,0.5)',
                        }}
                      >
                        {count}/{members.length}
                      </span>
                      {/* Partial day indicator */}
                      {hasPartialDay && !isPast && (
                        <div
                          style={{
                            position: 'absolute',
                            top: isLargeScreen ? 4 : 3,
                            right: isLargeScreen ? 4 : 3,
                            width: isLargeScreen ? 8 : 6,
                            height: isLargeScreen ? 8 : 6,
                            borderRadius: isLargeScreen ? 4 : 3,
                            background: '#a78bfa',
                          }}
                          title="Some members have partial-day unavailability"
                        />
                      )}
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
                {/* Summary Bar */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 16,
                    paddingBottom: 16,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 700,
                        color: '#f9fafb',
                      }}
                    >
                      {new Date(selectedDate + 'T00:00:00').toLocaleDateString(
                        'en-US',
                        { weekday: 'long', month: 'long', day: 'numeric' }
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        color: '#9ca3af',
                        marginTop: 4,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span style={{ color: '#4ade80' }}>
                        ✓ {availableMembers.length} available
                      </span>
                      <span style={{ color: '#6b7280' }}>•</span>
                      <span style={{ color: '#fca5a5' }}>
                        ✗ {selectedDateInfo.unavailableMembers.length} unavailable
                      </span>
                    </div>
                  </div>
                </div>

                {/* Collapsible Sections */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {/* Available Section */}
                  <CollapsibleSection
                    title="Available"
                    count={availableMembers.length}
                    defaultOpen={!isLargeBand}
                    variant="available"
                  >
                    {availableMembers.length > 0 ? (
                      <AvatarStack
                        members={availableMembers}
                        maxVisible={isLargeBand ? 8 : 10}
                      />
                    ) : (
                      <p style={{ fontSize: 13, color: '#9ca3af', margin: 0 }}>
                        No one is available on this date
                      </p>
                    )}
                  </CollapsibleSection>

                  {/* Unavailable Section */}
                  {selectedDateInfo.unavailableMembers.length > 0 && (
                    <CollapsibleSection
                      title="Unavailable"
                      count={selectedDateInfo.unavailableMembers.length}
                      defaultOpen={true}
                      variant="unavailable"
                    >
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        {selectedDateInfo.unavailableMembers.map((info) => (
                          <div
                            key={info.member.id}
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              gap: 10,
                              padding: '10px 12px',
                              background: 'rgba(0,0,0,0.2)',
                              borderRadius: 10,
                            }}
                          >
                            <Avatar
                              src={info.member.avatarUrl}
                              name={info.member.name}
                              size={32}
                              variant="unavailable"
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div
                                style={{
                                  fontSize: 14,
                                  fontWeight: 600,
                                  color: '#e5e7eb',
                                }}
                              >
                                {info.member.name}
                              </div>
                              <div
                                style={{
                                  fontSize: 12,
                                  color: '#9ca3af',
                                  marginTop: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  flexWrap: 'wrap',
                                }}
                              >
                                {info.note && (
                                  <>
                                    <TruncatedNote
                                      note={info.note}
                                      memberName={info.member.name}
                                      timeRange={formatTimeRange(
                                        info.allDay,
                                        info.startTime,
                                        info.endTime
                                      )}
                                    />
                                    <span style={{ color: '#4b5563' }}>•</span>
                                  </>
                                )}
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
                                    info.allDay,
                                    info.startTime,
                                    info.endTime
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CollapsibleSection>
                  )}
                </div>

                {/* Actions */}
                {isAdmin && (
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 10,
                      marginTop: 16,
                      paddingTop: 16,
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
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
                  </div>
                )}
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
