import { IonIcon } from '@ionic/react';
import { sparklesOutline, timeOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import { formatTrialDaysLeft } from '../types/subscriptionTypes';

// Premium purple/violet theme
const PREMIUM = {
  primary: '#8b5cf6',
  light: '#a78bfa',
  subtle: 'rgba(139, 92, 246, 0.08)',
  border: 'rgba(139, 92, 246, 0.25)',
};

type TrialBannerProps = {
  daysLeft: number;
  productName?: string;
  bandId?: string;
  compact?: boolean;
};

/**
 * Subtle banner showing trial status.
 * Use at the top of feature pages when user is on a trial.
 */
export function TrialBanner({
  daysLeft,
  productName = 'Pro',
  bandId,
  compact = false,
}: TrialBannerProps) {
  const nav = useNavigate();

  const isUrgent = daysLeft <= 5;
  const urgentColor = '#f59e0b';

  if (compact) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 8,
          background: isUrgent ? 'rgba(245, 158, 11, 0.1)' : PREMIUM.subtle,
          border: `1px solid ${isUrgent ? 'rgba(245, 158, 11, 0.25)' : PREMIUM.border}`,
        }}
      >
        <IonIcon
          icon={timeOutline}
          style={{
            fontSize: 14,
            color: isUrgent ? urgentColor : PREMIUM.light,
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 600,
            color: isUrgent ? urgentColor : PREMIUM.light,
          }}
        >
          {formatTrialDaysLeft(daysLeft)}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 14px',
        borderRadius: 12,
        background: isUrgent ? 'rgba(245, 158, 11, 0.08)' : PREMIUM.subtle,
        border: `1px solid ${isUrgent ? 'rgba(245, 158, 11, 0.2)' : PREMIUM.border}`,
        marginBottom: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: isUrgent ? 'rgba(245, 158, 11, 0.15)' : 'rgba(139, 92, 246, 0.15)',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <IonIcon
            icon={isUrgent ? timeOutline : sparklesOutline}
            style={{
              fontSize: 16,
              color: isUrgent ? urgentColor : PREMIUM.light,
            }}
          />
        </div>
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isUrgent ? urgentColor : PREMIUM.light,
            }}
          >
            {formatTrialDaysLeft(daysLeft)} in your {productName} trial
          </div>
          {isUrgent && (
            <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
              Subscribe to keep access
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => nav('/store')}
        style={{
          padding: '6px 12px',
          borderRadius: 8,
          background: isUrgent ? urgentColor : PREMIUM.primary,
          border: 'none',
          color: '#fff',
          fontSize: 12,
          fontWeight: 600,
        }}
      >
        {isUrgent ? 'Subscribe' : 'Upgrade'}
      </button>
    </div>
  );
}
