import { IonIcon } from '@ionic/react';
import {
  checkmarkCircleOutline,
  mapOutline,
  sparklesOutline,
} from 'ionicons/icons';
import type { ProductRow } from '../types/subscriptionTypes';
import { formatPrice } from '../types/subscriptionTypes';

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

// Map product slugs to icons
const PRODUCT_ICONS: Record<string, string> = {
  'tour-pro': mapOutline,
};

type ProductCardProps = {
  product: ProductRow;
  onStartTrial: () => void;
  onSubscribe: () => void;
};

export function ProductCard({
  product,
  onStartTrial,
  onSubscribe,
}: ProductCardProps) {
  const features = Array.isArray(product.features) ? product.features : [];
  const icon = PRODUCT_ICONS[product.slug] || sparklesOutline;

  return (
    <div
      style={{
        ...glassCard,
        border: `1px solid ${PREMIUM.border}`,
        overflow: 'hidden',
        width: '100%',
        maxWidth: 360,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: 20,
          borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              background: `linear-gradient(135deg, ${PREMIUM.primary} 0%, ${PREMIUM.light} 100%)`,
              display: 'grid',
              placeItems: 'center',
              boxShadow: `0 6px 20px ${PREMIUM.glow}`,
              flexShrink: 0,
            }}
          >
            <IonIcon icon={icon} style={{ fontSize: 24, color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: '#f9fafb',
                letterSpacing: '-0.3px',
              }}
            >
              {product.name}
            </h3>
            <div
              style={{
                display: 'flex',
                alignItems: 'baseline',
                gap: 4,
                marginTop: 4,
              }}
            >
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  color: PREMIUM.light,
                }}
              >
                {formatPrice(product.price_cents)}
              </span>
              <span style={{ fontSize: 14, color: '#6b7280' }}>/month</span>
            </div>
          </div>
        </div>
        {product.description && (
          <p
            style={{
              margin: '14px 0 0',
              fontSize: 14,
              color: '#9ca3af',
              lineHeight: 1.5,
            }}
          >
            {product.description}
          </p>
        )}
      </div>

      {/* Features */}
      {features.length > 0 && (
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255, 255, 255, 0.04)', flex: 1 }}>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {features.slice(0, 4).map((feature, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '6px 0',
                }}
              >
                <IonIcon
                  icon={checkmarkCircleOutline}
                  style={{
                    fontSize: 16,
                    color: PREMIUM.light,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 13, color: '#d1d5db' }}>{feature}</span>
              </li>
            ))}
            {features.length > 4 && (
              <li
                style={{
                  fontSize: 12,
                  color: '#6b7280',
                  paddingTop: 6,
                  paddingLeft: 26,
                }}
              >
                +{features.length - 4} more features
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div style={{ padding: 16, display: 'flex', gap: 10 }}>
        <button
          onClick={onStartTrial}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 12,
            background: `linear-gradient(135deg, ${PREMIUM.primary} 0%, ${PREMIUM.light} 100%)`,
            border: 'none',
            color: '#fff',
            fontSize: 14,
            fontWeight: 600,
            boxShadow: `0 4px 14px ${PREMIUM.glow}`,
          }}
        >
          Try Free 30 Days
        </button>
        <button
          onClick={onSubscribe}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(255, 255, 255, 0.04)',
            border: `1px solid ${PREMIUM.border}`,
            color: PREMIUM.light,
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          Subscribe
        </button>
      </div>
    </div>
  );
}
