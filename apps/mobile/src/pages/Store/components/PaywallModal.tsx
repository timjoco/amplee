import { IonIcon } from '@ionic/react';
import {
  checkmarkCircleOutline,
  closeOutline,
  starOutline,
  storefrontOutline,
} from 'ionicons/icons';
import type { ProductRow } from '../types/subscriptionTypes';

// Premium purple/violet theme
const PREMIUM = {
  primary: '#8b5cf6',
  light: '#a78bfa',
  glow: 'rgba(139, 92, 246, 0.4)',
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

type PaywallModalProps = {
  product: ProductRow;
  bandId: string;
  bandName?: string;
  onClose: () => void;
  onStartTrial: () => void;
  onSubscribe: () => void;
  isStartingTrial?: boolean;
  trialError?: string | null;
};

export function PaywallModal({
  product,
  bandId,
  bandName,
  onClose,
  onStartTrial,
  onSubscribe,
  isStartingTrial = false,
  trialError = null,
}: PaywallModalProps) {
  const features = Array.isArray(product.features) ? product.features : [];

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding: 16,
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          ...glassCard,
          width: '100%',
          maxWidth: 400,
          maxHeight: '90vh',
          overflow: 'auto',
          background:
            'linear-gradient(180deg, rgba(20, 20, 30, 0.98) 0%, rgba(10, 10, 18, 0.98) 100%)',
          border: `1px solid ${PREMIUM.border}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            padding: '20px 20px 0',
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: `linear-gradient(135deg, ${PREMIUM.primary} 0%, ${PREMIUM.light} 100%)`,
              display: 'grid',
              placeItems: 'center',
              boxShadow: `0 8px 24px ${PREMIUM.glow}`,
            }}
          >
            <IonIcon
              icon={storefrontOutline}
              style={{ fontSize: 28, color: '#fff' }}
            />
          </div>
          <button
            onClick={onClose}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'grid',
              placeItems: 'center',
              color: '#9ca3af',
            }}
          >
            <IonIcon icon={closeOutline} style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Title */}
        <div style={{ padding: '16px 20px' }}>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: '#f9fafb',
              letterSpacing: '-0.5px',
            }}
          >
            {product.name}
          </h2>
          {bandName && (
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>
              for {bandName}
            </div>
          )}
          {product.description && (
            <p
              style={{
                margin: '12px 0 0',
                fontSize: 15,
                color: '#9ca3af',
                lineHeight: 1.5,
              }}
            >
              {product.description}
            </p>
          )}
        </div>

        {/* Features */}
        <div style={{ padding: '0 20px 16px' }}>
          <div
            style={{
              ...glassCard,
              padding: 16,
              border: `1px solid ${PREMIUM.border}`,
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
                icon={starOutline}
                style={{ fontSize: 16, color: PREMIUM.light }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                What's Included
              </span>
            </div>
            <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
              {features.map((feature, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '8px 0',
                    borderTop:
                      i > 0 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                  }}
                >
                  <IonIcon
                    icon={checkmarkCircleOutline}
                    style={{
                      fontSize: 18,
                      color: PREMIUM.light,
                      flexShrink: 0,
                      marginTop: 1,
                    }}
                  />
                  <span
                    style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.4 }}
                  >
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Error Message */}
        {trialError && (
          <div
            style={{
              margin: '0 20px 16px',
              padding: 12,
              borderRadius: 10,
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
            }}
          >
            <p style={{ margin: 0, fontSize: 13, color: '#f87171' }}>
              {trialError}
            </p>
          </div>
        )}

        {/* Actions */}
        <div style={{ padding: '0 20px 24px' }}>
          {/* Primary CTA - Start Trial */}
          <button
            onClick={onStartTrial}
            disabled={isStartingTrial}
            style={{
              width: '100%',
              padding: '16px 20px',
              borderRadius: 14,
              background: `linear-gradient(135deg, ${PREMIUM.primary} 0%, ${PREMIUM.light} 100%)`,
              border: 'none',
              color: '#fff',
              fontSize: 16,
              fontWeight: 700,
              boxShadow: `0 6px 20px ${PREMIUM.glow}`,
              marginBottom: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: isStartingTrial ? 0.7 : 1,
            }}
          >
            {isStartingTrial ? (
              'Starting trial...'
            ) : (
              <>
                <IonIcon icon={storefrontOutline} style={{ fontSize: 20 }} />
                Start 30-Day Free Trial
              </>
            )}
          </button>

          {/* Secondary CTA - Subscribe */}
          <button
            onClick={onSubscribe}
            style={{
              width: '100%',
              padding: '14px 20px',
              borderRadius: 14,
              background: 'rgba(255, 255, 255, 0.04)',
              border: `1px solid ${PREMIUM.border}`,
              color: PREMIUM.light,
              fontSize: 15,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            See Subscription Options
          </button>

          {/* Fine print */}
          <p
            style={{
              margin: '16px 0 0',
              fontSize: 12,
              color: '#6b7280',
              textAlign: 'center',
              lineHeight: 1.5,
            }}
          >
            No credit card required for trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}
