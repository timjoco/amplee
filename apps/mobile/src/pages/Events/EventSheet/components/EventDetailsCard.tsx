import { IonIcon } from '@ionic/react';
import {
  calendarOutline,
  checkmarkCircle,
  closeCircle,
  helpCircle,
  locationOutline,
  timeOutline,
} from 'ionicons/icons';
import { useMemo } from 'react';

type EventType = 'show' | 'practice';

type Event = {
  type: EventType | null;
  starts_at: string | null;
  location: string | null;
  is_cancelled: boolean;
  is_booked: boolean;
};

type EventDetailsCardProps = {
  event: Event;

  inviteeTotal: number;
  acceptedCount: number;
};

export default function EventDetailsCard({
  event,
  inviteeTotal,
  acceptedCount,
}: EventDetailsCardProps) {
  const allConfirmed = inviteeTotal > 0 && acceptedCount >= inviteeTotal;

  const status = useMemo(() => {
    if (event.is_cancelled) {
      return {
        label: 'Cancelled',
        color: '#fca5a5',
        icon: closeCircle,
      };
    }

    // ✅ treat as booked if DB says booked OR everyone is in
    if (event.is_booked || allConfirmed) {
      return {
        label: 'Booked',
        color: '#6ee7b7',
        icon: checkmarkCircle,
      };
    }

    return {
      label: 'Pending',
      color: '#fde68a',
      icon: helpCircle,
    };
  }, [event.is_cancelled, event.is_booked, allConfirmed]);

  const timeUntilEvent = useMemo(() => {
    if (!event.starts_at) return null;
    const now = new Date();
    const eventDate = new Date(event.starts_at);
    const diff = eventDate.getTime() - now.getTime();

    if (diff < 0) return 'Event passed';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return 'Soon!';
  }, [event.starts_at]);

  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
        border: '1px solid rgba(71, 85, 105, 0.3)',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Status Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 4,
            }}
          >
            <IonIcon
              icon={status.icon}
              style={{ fontSize: 20, color: status.color }}
            />
            <span
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: status.color,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
              }}
            >
              {status.label}
            </span>
          </div>

          <div
            style={{
              fontSize: 13,
              color: 'rgba(148, 163, 184, 0.8)',
            }}
          >
            {event.type === 'practice' ? 'Practice Session' : 'Show'}
            {/* optional helper line */}
            {!event.is_cancelled && inviteeTotal > 0 && (
              <>
                {' • '}
                {acceptedCount} / {inviteeTotal} in
              </>
            )}
          </div>
        </div>

        {timeUntilEvent && (
          <div
            style={{
              padding: '8px 16px',
              borderRadius: 12,
              background: 'rgba(52, 211, 153, 0.15)',
              border: '1px solid rgba(52, 211, 153, 0.3)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <IonIcon
              icon={timeOutline}
              style={{ fontSize: 16, color: '#34d399' }}
            />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: '#34d399',
              }}
            >
              {timeUntilEvent}
            </span>
          </div>
        )}
      </div>

      {/* Event Details */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {event.starts_at && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IonIcon
              icon={calendarOutline}
              style={{ fontSize: 18, color: 'rgba(148, 163, 184, 0.8)' }}
            />
            <span style={{ fontSize: 14, color: '#e5e7eb' }}>
              {new Date(event.starts_at).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
              {' • '}
              {new Date(event.starts_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </span>
          </div>
        )}

        {event.location && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <IonIcon
              icon={locationOutline}
              style={{ fontSize: 18, color: 'rgba(148, 163, 184, 0.8)' }}
            />
            <span style={{ fontSize: 14, color: '#e5e7eb' }}>
              {event.location}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
