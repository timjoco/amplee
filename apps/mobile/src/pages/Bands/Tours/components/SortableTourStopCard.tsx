import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { IonIcon } from '@ionic/react';
import {
  bedOutline,
  chevronForwardOutline,
  locationOutline,
  menuOutline,
  moonOutline,
} from 'ionicons/icons';
import { glassCard, TEAL } from '../lib/styles';
import type { TourStopWithFinancials } from '../types/tourTypes';

type Props = {
  stop: TourStopWithFinancials;
  onClick: () => void;
  isAdmin: boolean;
};

export function SortableTourStopCard({ stop, onClick, isAdmin }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id, disabled: !isAdmin });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 1000 : 'auto',
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

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
    <div ref={setNodeRef} style={style}>
      <div
        style={{
          ...glassCard,
          padding: 0,
          border: `1px solid ${stop.is_day_off ? 'rgba(139, 92, 246, 0.25)' : TEAL.border}`,
          display: 'flex',
          overflow: 'hidden',
        }}
      >
        {/* Drag Handle (Admin only) */}
        {isAdmin && (
          <div
            {...attributes}
            {...listeners}
            style={{
              width: 40,
              display: 'grid',
              placeItems: 'center',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRight: '1px solid rgba(255, 255, 255, 0.06)',
              cursor: 'grab',
              touchAction: 'none',
            }}
          >
            <IonIcon
              icon={menuOutline}
              style={{ color: '#4b5563', fontSize: 18 }}
            />
          </div>
        )}

        {/* Main Content (clickable) */}
        <button
          onClick={onClick}
          style={{
            flex: 1,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            textAlign: 'left',
            background: 'transparent',
            border: 'none',
            color: 'inherit',
          }}
        >
          {/* Date Badge */}
          <div
            style={{
              minWidth: 52,
              padding: '8px 10px',
              borderRadius: 10,
              background: stop.is_day_off
                ? 'rgba(139, 92, 246, 0.1)'
                : TEAL.subtle,
              border: `1px solid ${stop.is_day_off ? 'rgba(139, 92, 246, 0.25)' : TEAL.border}`,
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: stop.is_day_off ? '#a78bfa' : TEAL.light,
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
              {stop.is_day_off ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <IonIcon
                    icon={moonOutline}
                    style={{ color: '#a78bfa', fontSize: 14 }}
                  />
                  <span
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: '#a78bfa',
                    }}
                  >
                    Day Off
                  </span>
                </div>
              ) : (
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
              )}
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
      </div>
    </div>
  );
}
