import { IonIcon, IonSpinner } from '@ionic/react';
import { alertCircleOutline } from 'ionicons/icons';
import { TEAL } from '../lib/styles';

type Props = {
  variant: 'loading' | 'notFound' | 'empty';
  message?: string;
  icon?: string;
  title?: string;
};

export function EmptyState({ variant, message, icon, title }: Props) {
  if (variant === 'loading') {
    return (
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          height: '100%',
          padding: 40,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <IonSpinner
            style={{
              '--color': TEAL.primary,
              width: 32,
              height: 32,
            }}
          />
          <div
            style={{
              color: '#6b7280',
              fontSize: 14,
              marginTop: 12,
            }}
          >
            {message || 'Loading...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        height: '100%',
        padding: 40,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'grid',
            placeItems: 'center',
            margin: '0 auto 16px',
          }}
        >
          <IonIcon
            icon={icon || alertCircleOutline}
            style={{ fontSize: 28, color: '#f87171' }}
          />
        </div>
        <h3
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 700,
            color: '#e5e7eb',
            marginBottom: 8,
          }}
        >
          {title || 'Not Found'}
        </h3>
        <p
          style={{
            margin: 0,
            fontSize: 14,
            color: '#6b7280',
            lineHeight: 1.5,
          }}
        >
          {message || 'The requested resource could not be found.'}
        </p>
      </div>
    </div>
  );
}
