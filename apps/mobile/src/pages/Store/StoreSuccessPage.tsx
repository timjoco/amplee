import {
  IonContent,
  IonIcon,
  IonPage,
} from '@ionic/react';
import {
  checkmarkCircleOutline,
  homeOutline,
  sparklesOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

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

export default function StoreSuccessPage() {
  const nav = useNavigate();

  return (
    <IonPage>
      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100%',
            padding: 24,
            textAlign: 'center',
          }}
        >
          {/* Success Icon */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 24,
              background: `linear-gradient(135deg, ${PREMIUM.primary} 0%, ${PREMIUM.light} 100%)`,
              display: 'grid',
              placeItems: 'center',
              marginBottom: 24,
              boxShadow: `0 12px 32px ${PREMIUM.glow}`,
            }}
          >
            <IonIcon
              icon={checkmarkCircleOutline}
              style={{ fontSize: 40, color: '#fff' }}
            />
          </div>

          {/* Title */}
          <h1
            style={{
              margin: 0,
              fontSize: 28,
              fontWeight: 700,
              color: '#f9fafb',
              letterSpacing: '-0.5px',
            }}
          >
            You're all set!
          </h1>

          {/* Subtitle */}
          <p
            style={{
              margin: '12px 0 0',
              fontSize: 16,
              color: '#9ca3af',
              maxWidth: 320,
              lineHeight: 1.5,
            }}
          >
            Your subscription is now active. Enjoy all the Pro features!
          </p>

          {/* Features Card */}
          <div
            style={{
              ...glassCard,
              padding: 20,
              marginTop: 32,
              width: '100%',
              maxWidth: 340,
              border: `1px solid ${PREMIUM.border}`,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginBottom: 16,
              }}
            >
              <IonIcon
                icon={sparklesOutline}
                style={{ fontSize: 20, color: PREMIUM.light }}
              />
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#f9fafb',
                }}
              >
                What's unlocked
              </span>
            </div>

            <ul
              style={{
                margin: 0,
                padding: 0,
                listStyle: 'none',
              }}
            >
              {[
                'Unlimited tours and stops',
                'Financial tracking',
                'Tour chat with your band',
                'File attachments',
              ].map((feature, i) => (
                <li
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '8px 0',
                    borderTop: i > 0 ? '1px solid rgba(255, 255, 255, 0.04)' : 'none',
                  }}
                >
                  <IonIcon
                    icon={checkmarkCircleOutline}
                    style={{ fontSize: 16, color: '#22c55e' }}
                  />
                  <span style={{ fontSize: 14, color: '#d1d5db' }}>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              marginTop: 32,
              width: '100%',
              maxWidth: 340,
            }}
          >
            <button
              onClick={() => nav('/home')}
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
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <IonIcon icon={homeOutline} style={{ fontSize: 20 }} />
              Go Home
            </button>

            <button
              onClick={() => nav('/store')}
              style={{
                width: '100%',
                padding: '14px 20px',
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#9ca3af',
                fontSize: 15,
                fontWeight: 600,
              }}
            >
              View your subscriptions
            </button>
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}
