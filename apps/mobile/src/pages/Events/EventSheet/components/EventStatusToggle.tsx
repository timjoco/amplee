import { IonIcon, IonSpinner } from '@ionic/react';
import {
  checkmarkCircle,
  chevronDownOutline,
  closeCircle,
  helpCircle,
} from 'ionicons/icons';
import { useState } from 'react';

type EventStatus = 'pending' | 'booked' | 'cancelled';

type EventStatusToggleProps = {
  currentIsBooked: boolean;
  currentIsCancelled: boolean;
  isAdmin: boolean;
  onStatusChange: (isBooked: boolean, isCancelled: boolean) => Promise<void>;
};

export default function EventStatusToggle({
  currentIsBooked,
  currentIsCancelled,
  isAdmin,
  onStatusChange,
}: EventStatusToggleProps) {
  const [updating, setUpdating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  // Derive current status from flags
  const currentStatus: EventStatus = currentIsCancelled
    ? 'cancelled'
    : currentIsBooked
    ? 'booked'
    : 'pending';

  // Define status order for cycling
  const statusOrder: EventStatus[] = ['pending', 'booked', 'cancelled'];

  const getNextStatus = (current: EventStatus): EventStatus => {
    const currentIndex = statusOrder.indexOf(current);
    const nextIndex = (currentIndex + 1) % statusOrder.length;
    return statusOrder[nextIndex];
  };

  const getStatusConfig = (status: EventStatus) => {
    switch (status) {
      case 'cancelled':
        return {
          label: 'Cancelled',
          color: '#fca5a5',
          bgColor: 'rgba(239, 68, 68, 0.12)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          icon: closeCircle,
        };
      case 'booked':
        return {
          label: 'Booked',
          color: '#6ee7b7',
          bgColor: 'rgba(34, 197, 94, 0.12)',
          borderColor: 'rgba(34, 197, 94, 0.3)',
          icon: checkmarkCircle,
        };
      case 'pending':
      default:
        return {
          label: 'Pending',
          color: '#fde68a',
          bgColor: 'rgba(251, 191, 36, 0.12)',
          borderColor: 'rgba(251, 191, 36, 0.3)',
          icon: helpCircle,
        };
    }
  };

  const handleCycle = async () => {
    if (!isAdmin || updating) return;

    const nextStatus = getNextStatus(currentStatus);
    setUpdating(true);

    try {
      // Map status to database flags
      let isBooked = false;
      let isCancelled = false;

      if (nextStatus === 'booked') {
        isBooked = true;
      } else if (nextStatus === 'cancelled') {
        isCancelled = true;
      }

      await onStatusChange(isBooked, isCancelled);
    } finally {
      setUpdating(false);
    }
  };

  const config = getStatusConfig(currentStatus);
  const nextStatus = getNextStatus(currentStatus);
  const nextConfig = getStatusConfig(nextStatus);

  if (!isAdmin) {
    // Non-admin: just show current status (non-clickable)
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 14px',
          borderRadius: 10,
          background: config.bgColor,
          border: `1px solid ${config.borderColor}`,
        }}
      >
        <IonIcon
          icon={config.icon}
          style={{ fontSize: 18, color: config.color }}
        />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: config.color,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {config.label}
        </span>
      </div>
    );
  }

  // Admin: show clickable button with dropdown indicator
  return (
    <button
      type="button"
      onClick={handleCycle}
      disabled={updating}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 14px 8px 14px',
        borderRadius: 10,
        background:
          isHovered && !updating ? 'rgba(255,255,255,0.06)' : config.bgColor,
        border: `1px solid ${
          isHovered && !updating ? 'rgba(255,255,255,0.15)' : config.borderColor
        }`,
        cursor: updating ? 'not-allowed' : 'pointer',
        transition: 'all 150ms ease-out',
        opacity: updating ? 0.6 : 1,
        position: 'relative',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {updating ? (
          <IonSpinner
            name="crescent"
            style={{
              width: 18,
              height: 18,
              '--color': config.color,
            }}
          />
        ) : (
          <IonIcon
            icon={config.icon}
            style={{ fontSize: 18, color: config.color }}
          />
        )}
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: config.color,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {config.label}
        </span>
      </div>

      {/* Dropdown indicator with next status hint */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          paddingLeft: 8,
          borderLeft: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <IonIcon
          icon={chevronDownOutline}
          style={{
            fontSize: 14,
            color: 'rgba(148, 163, 184, 0.7)',
            transition: 'transform 150ms ease-out',
            transform: isHovered ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        />
      </div>

      {/* Tooltip on hover */}
      {isHovered && !updating && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            marginTop: 8,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(15, 23, 42, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            whiteSpace: 'nowrap',
            fontSize: 11,
            fontWeight: 600,
            color: 'rgba(148, 163, 184, 0.9)',
            zIndex: 10,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          Click to set as{' '}
          <span style={{ color: nextConfig.color }}>{nextConfig.label}</span>
        </div>
      )}
    </button>
  );
}
