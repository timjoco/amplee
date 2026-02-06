import { IonIcon } from '@ionic/react';
import {
  checkmarkCircleOutline,
  musicalNotesOutline,
  timeOutline,
} from 'ionicons/icons';
import { useEffect, useState } from 'react';
import { getAvatarUrl } from '../../../lib/cache/avatarUrlCache';
import {
  formatTrialDaysLeft,
  SUBSCRIPTION_STATUS_COLORS,
  SUBSCRIPTION_STATUS_LABELS,
} from '../types/subscriptionTypes';

// Premium purple/violet theme
const PREMIUM = {
  primary: '#8b5cf6',
  light: '#a78bfa',
  subtle: 'rgba(139, 92, 246, 0.08)',
  border: 'rgba(139, 92, 246, 0.25)',
};

const glassCard = {
  background: 'rgba(255, 255, 255, 0.02)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  borderRadius: 16,
};

type SubscriptionItem = {
  bandId: string;
  bandName: string;
  bandAvatarUrl: string | null;
  productSlug: string;
  productName: string;
  hasAccess: boolean;
  isTrialing: boolean;
  isSubscribed: boolean;
  trialDaysLeft: number | null;
};

type ActiveSubscriptionsProps = {
  subscriptions: SubscriptionItem[];
  onManage?: (bandId: string, productSlug: string) => void;
};

export function ActiveSubscriptions({
  subscriptions,
  onManage,
}: ActiveSubscriptionsProps) {
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});

  // Load avatar URLs
  useEffect(() => {
    let alive = true;

    const loadAvatars = async () => {
      const urlMap: Record<string, string> = {};
      await Promise.all(
        subscriptions.map(async (sub) => {
          if (sub.bandAvatarUrl) {
            try {
              const url = await getAvatarUrl('band-avatars', sub.bandAvatarUrl);
              if (url) urlMap[sub.bandId] = url;
            } catch (e) {
              console.warn('[ActiveSubscriptions] avatar error', e);
            }
          }
        })
      );

      if (alive) setAvatarUrls(urlMap);
    };

    void loadAvatars();

    return () => {
      alive = false;
    };
  }, [subscriptions]);

  if (subscriptions.length === 0) {
    return (
      <div
        style={{
          ...glassCard,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.04)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 12px',
          }}
        >
          <IonIcon
            icon={musicalNotesOutline}
            style={{ fontSize: 22, color: '#6b7280' }}
          />
        </div>
        <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
          No active subscriptions yet
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        ...glassCard,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
          }}
        >
          Your Subscriptions
        </h3>
      </div>

      {/* List */}
      <div>
        {subscriptions.map((sub, index) => {
          const isUrgent = sub.isTrialing && (sub.trialDaysLeft ?? 0) <= 5;

          return (
            <div
              key={`${sub.bandId}-${sub.productSlug}`}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 16px',
                borderTop: index > 0 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
              }}
            >
              {/* Band Avatar */}
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: avatarUrls[sub.bandId]
                    ? 'transparent'
                    : `linear-gradient(135deg, ${PREMIUM.primary} 0%, ${PREMIUM.light} 100%)`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                  fontSize: 16,
                  fontWeight: 600,
                  color: '#fff',
                }}
              >
                {avatarUrls[sub.bandId] ? (
                  <img
                    src={avatarUrls[sub.bandId]}
                    alt={sub.bandName}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  sub.bandName.charAt(0).toUpperCase()
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#f9fafb',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {sub.bandName}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 2,
                  }}
                >
                  <span style={{ fontSize: 12, color: '#6b7280' }}>
                    {sub.productName}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 8,
                  background: sub.isTrialing
                    ? isUrgent
                      ? 'rgba(245, 158, 11, 0.1)'
                      : 'rgba(59, 130, 246, 0.1)'
                    : sub.hasAccess
                    ? 'rgba(34, 197, 94, 0.1)'
                    : 'rgba(107, 114, 128, 0.1)',
                  border: `1px solid ${
                    sub.isTrialing
                      ? isUrgent
                        ? 'rgba(245, 158, 11, 0.25)'
                        : 'rgba(59, 130, 246, 0.25)'
                      : sub.hasAccess
                      ? 'rgba(34, 197, 94, 0.25)'
                      : 'rgba(107, 114, 128, 0.25)'
                  }`,
                }}
              >
                <IonIcon
                  icon={sub.isTrialing ? timeOutline : checkmarkCircleOutline}
                  style={{
                    fontSize: 14,
                    color: sub.isTrialing
                      ? isUrgent
                        ? '#f59e0b'
                        : '#3b82f6'
                      : sub.hasAccess
                      ? '#22c55e'
                      : '#6b7280',
                  }}
                />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: sub.isTrialing
                      ? isUrgent
                        ? '#f59e0b'
                        : '#3b82f6'
                      : sub.hasAccess
                      ? '#22c55e'
                      : '#6b7280',
                  }}
                >
                  {sub.isTrialing
                    ? formatTrialDaysLeft(sub.trialDaysLeft ?? 0)
                    : sub.hasAccess
                    ? 'Active'
                    : 'Expired'}
                </span>
              </div>

              {/* Manage/Cancel Button */}
              {onManage && sub.isSubscribed && sub.hasAccess && (
                <button
                  onClick={() => onManage(sub.bandId, sub.productSlug)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    color: '#9ca3af',
                    fontSize: 12,
                    fontWeight: 600,
                  }}
                >
                  Manage / Cancel
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
