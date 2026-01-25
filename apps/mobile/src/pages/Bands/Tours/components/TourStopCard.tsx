import { IonIcon } from '@ionic/react';
import {
  bedOutline,
  chevronForwardOutline,
  locationOutline,
} from 'ionicons/icons';
import { glassCard, TEAL } from '../lib/styles';
import type { TourStopWithFinancials } from '../types/tourTypes';

type Props = {
  stop: TourStopWithFinancials;
  onClick: () => void;
};

export function TourStopCard({ stop, onClick }: Props) {
  const formatTime = (timeStr: string | null) => {
    if (!timeStr) return null;
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const statusColors = {
    tentative: '#f59e0b',
    confirmed: '#10b981',
    cancelled: '#ef4444',
  };

  const hasHotel = !!stop.hotel_name;
  const setTime = formatTime(stop.set_time);

  return (
    <button
      onClick={onClick}
      style={{
        ...glassCard,
        padding: 14,
        border: `1px solid ${TEAL.border}`,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        textAlign: 'left',
        width: '100%',
      }}
    >
      {/* Date Badge */}
      <div
        style={{
          minWidth: 52,
          padding: '8px 10px',
          borderRadius: 10,
          background: TEAL.subtle,
          border: `1px solid ${TEAL.border}`,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: TEAL.light,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          {new Date(stop.date + 'T00:00:00').toLocaleDateString(undefined, {
            weekday: 'short',
          })}
        </div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: '#f9fafb',
            lineHeight: 1.2,
          }}
        >
          {new Date(stop.date + 'T00:00:00').getDate()}
        </div>
      </div>

      {/* Details */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: 4,
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: '#f9fafb',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {stop.venue_name}
          </span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color: statusColors[stop.status],
              background: `${statusColors[stop.status]}20`,
              padding: '2px 5px',
              borderRadius: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.3px',
              flexShrink: 0,
            }}
          >
            {stop.status}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          {stop.venue_city && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <IonIcon icon={locationOutline} style={{ fontSize: 12 }} />
              {stop.venue_city}
              {stop.venue_state ? `, ${stop.venue_state}` : ''}
            </span>
          )}
          {setTime && <span>{setTime}</span>}
          {hasHotel && (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <IonIcon icon={bedOutline} style={{ fontSize: 12 }} />
              Hotel
            </span>
          )}
        </div>
      </div>

      {/* Chevron */}
      <IonIcon
        icon={chevronForwardOutline}
        style={{
          fontSize: 18,
          color: '#4b5563',
          flexShrink: 0,
        }}
      />
    </button>
  );
}
