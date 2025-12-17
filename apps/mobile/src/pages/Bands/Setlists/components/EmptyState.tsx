import { IonIcon, IonSpinner } from '@ionic/react';
import { PINK } from '../lib/styles';

type EmptyStateProps = {
  variant: 'loading' | 'notFound';
  title?: string;
  message?: string;
  icon?: any;
};

export function EmptyState({ variant, title, message, icon }: EmptyStateProps) {
  const isLoading = variant === 'loading';

  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        height: '50vh',
        gap: 12,
        padding: 24,
        textAlign: 'center',
      }}
    >
      {isLoading ? (
        <div style={{ textAlign: 'center' }}>
          <IonSpinner
            style={{
              '--color': PINK.primary,
              width: 32,
              height: 32,
            }}
          />
          <div style={{ color: '#6b7280', fontSize: 13, marginTop: 12 }}>
            {message ?? 'Loading...'}
          </div>
        </div>
      ) : (
        <>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 16,
              background: PINK.subtle,
              border: `1px solid ${PINK.border}`,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {icon && (
              <IonIcon
                icon={icon}
                style={{ fontSize: 28, color: PINK.light }}
              />
            )}
          </div>

          <h3
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: '#e5e7eb',
            }}
          >
            {title ?? 'Not found'}
          </h3>

          <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
            {message ?? 'This item may have been deleted or moved.'}
          </p>
        </>
      )}
    </div>
  );
}
