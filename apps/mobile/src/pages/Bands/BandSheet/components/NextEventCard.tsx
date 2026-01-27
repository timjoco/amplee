import { IonIcon } from '@ionic/react';
import { calendarOutline, chevronForwardOutline, timeOutline } from 'ionicons/icons';
import * as React from 'react';
import type { NextEvent } from '../types';
import { computeTimeUntilEvent, formatEventDate, formatEventTime } from '../utils';

// Hook to detect screen size for responsive layouts
// Large = 1026px+ (desktop layout), Medium = 768-1025px, Small = <768px
function useScreenSize() {
  const [size, setSize] = React.useState<'small' | 'medium' | 'large'>(() => {
    if (typeof window === 'undefined') return 'small';
    if (window.innerWidth >= 1026) return 'large';
    if (window.innerWidth >= 768) return 'medium';
    return 'small';
  });

  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1026) setSize('large');
      else if (window.innerWidth >= 768) setSize('medium');
      else setSize('small');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}

type Props = {
  event: NextEvent;
  isPressed: boolean;
  onPress: () => void;
  inline?: boolean;
};

export function NextEventCard({ event, isPressed, onPress, inline = false }: Props) {
  const timeUntil = computeTimeUntilEvent(event.starts_at);
  const screenSize = useScreenSize();
  const isLarge = screenSize === 'large';

  return (
    <button
      type="button"
      onClick={onPress}
      style={{
        width: '100%',
        height: inline ? '100%' : undefined,
        background:
          'linear-gradient(135deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.3) 100%)',
        border: '1px solid rgba(71, 85, 105, 0.3)',
        borderRadius: isLarge ? 28 : 24,
        padding: isLarge ? '28px' : '20px',
        marginBottom: inline ? 0 : isLarge ? 28 : 24,
        display: 'flex',
        flexDirection: 'column',
        gap: isLarge ? 20 : 16,
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
          top: isLarge ? 28 : 20,
          right: isLarge ? 28 : 20,
          fontSize: isLarge ? 28 : 24,
          color: 'rgba(148, 163, 184, 0.6)',
          opacity: 0.7,
        }}
      />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: isLarge ? 14 : 10,
          paddingRight: 32,
        }}
      >
        <div
          style={{
            width: isLarge ? 56 : 48,
            height: isLarge ? 56 : 48,
            borderRadius: isLarge ? 16 : 14,
            background: 'rgba(52, 211, 153, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid rgba(52, 211, 153, 0.3)',
          }}
        >
          <IonIcon
            icon={calendarOutline}
            style={{ fontSize: isLarge ? 30 : 26, color: '#34d399' }}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: isLarge ? 13 : 11,
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
                padding: isLarge ? '5px 12px' : '4px 10px',
                borderRadius: 999,
                background: 'rgba(15, 118, 110, 0.4)',
              }}
            >
              <IonIcon
                icon={timeOutline}
                style={{ fontSize: isLarge ? 14 : 12, color: '#A7F3D0' }}
              />
              <span
                style={{
                  fontSize: isLarge ? 14 : 12,
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
            fontSize: isLarge ? 26 : 20,
            fontWeight: 800,
            color: '#F9FAFB',
            marginBottom: isLarge ? 10 : 8,
            letterSpacing: '-0.3px',
          }}
        >
          {event.title}
        </div>
        <div
          style={{
            fontSize: isLarge ? 17 : 14,
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
              fontSize: isLarge ? 15 : 13,
              color: 'rgba(203, 213, 225, 0.9)',
              marginTop: isLarge ? 6 : 4,
            }}
          >
            {event.location}
          </div>
        )}
      </div>
    </button>
  );
}
