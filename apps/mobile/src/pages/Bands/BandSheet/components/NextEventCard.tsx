import { IonIcon } from '@ionic/react';
import { calendarOutline, chevronForwardOutline, timeOutline } from 'ionicons/icons';
import type { NextEvent } from '../types';
import { computeTimeUntilEvent, formatEventDate, formatEventTime } from '../utils';

type Props = {
  event: NextEvent;
  isPressed: boolean;
  onPress: () => void;
};

export function NextEventCard({ event, isPressed, onPress }: Props) {
  const timeUntil = computeTimeUntilEvent(event.starts_at);

  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: '100%',
        background:
          'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
        border: '1px solid rgba(71, 85, 105, 0.3)',
        borderRadius: 24,
        padding: '20px',
        marginBottom: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        cursor: 'pointer',
        textAlign: 'left',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        position: 'relative',
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 120ms ease-out, box-shadow 120ms ease-out',
      }}
    >
      <IonIcon
        icon={chevronForwardOutline}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          fontSize: 24,
          color: 'rgba(148, 163, 184, 0.6)',
          opacity: 0.7,
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          paddingRight: 32,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'rgba(52, 211, 153, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(52, 211, 153, 0.3)',
          }}
        >
          <IonIcon
            icon={calendarOutline}
            style={{ fontSize: 26, color: '#34d399' }}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: '#BBF7D0',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 2,
            }}
          >
            Next Event
          </div>
          {timeUntil && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(15, 118, 110, 0.4)',
              }}
            >
              <IonIcon
                icon={timeOutline}
                style={{ fontSize: 12, color: '#A7F3D0' }}
              />
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#ECFDF5',
                }}
              >
                {timeUntil}
              </span>
            </div>
          )}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 800,
            color: '#F9FAFB',
            marginBottom: 8,
            letterSpacing: '-0.3px',
          }}
        >
          {event.title}
        </div>
        <div
          style={{
            fontSize: 14,
            color: '#E5E7EB',
            lineHeight: 1.5,
          }}
        >
          {formatEventDate(event.starts_at)}
          {' • '}
          {formatEventTime(event.starts_at)}
        </div>
        {event.location && (
          <div
            style={{
              fontSize: 13,
              color: 'rgba(203, 213, 225, 0.9)',
              marginTop: 4,
            }}
          >
            {event.location}
          </div>
        )}
      </div>
    </button>
  );
}
