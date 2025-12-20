/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon, IonText } from '@ionic/react';
import { addOutline } from 'ionicons/icons';

export default function EmptyStateCard({
  variant,
  isAdmin,
  canCreateEvent,
  onCreate,
  icon,
}: {
  variant: 'active' | 'archived';
  isAdmin: boolean;
  canCreateEvent: boolean;
  onCreate?: () => void;
  icon: string;
}) {
  const isArchived = variant === 'archived';

  return (
    <div style={{ padding: '16px', maxWidth: 600, margin: '0 auto' }}>
      <div
        style={{
          background: 'transparent',
          border: isArchived
            ? '1px solid rgba(148, 163, 184, 0.18)'
            : '1px solid rgba(52, 211, 153, 0.2)',
          borderRadius: 20,
          padding: '32px 24px',
          textAlign: 'center',
          marginTop: 24,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: isArchived
              ? 'rgba(148, 163, 184, 0.08)'
              : 'rgba(52, 211, 153, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            border: isArchived
              ? '1px solid rgba(148, 163, 184, 0.18)'
              : '1px solid rgba(52, 211, 153, 0.2)',
          }}
        >
          <IonIcon
            icon={icon}
            style={{
              fontSize: 32,
              color: isArchived
                ? 'rgba(148, 163, 184, 0.9)'
                : 'rgba(52, 211, 153, 0.9)',
            }}
          />
        </div>

        <IonText color="light">
          <h2
            style={{
              margin: '0 0 8px',
              fontSize: 18,
              fontWeight: 700,
              color: 'rgba(241, 245, 249, 0.95)',
              letterSpacing: '-0.01em',
            }}
          >
            {isArchived ? 'No Archived Events' : 'No Events Yet'}
          </h2>

          <p
            style={{
              margin: 0,
              color: 'rgba(148, 163, 184, 0.9)',
              fontSize: 14,
              lineHeight: 1.5,
            }}
          >
            {isArchived
              ? isAdmin
                ? 'Archived events will show up here after you archive past shows or practices.'
                : 'Once an admin archives past events, they will appear here.'
              : isAdmin
              ? 'Create your first show or practice to get started.'
              : 'Events will appear here once your band admin schedules them.'}
          </p>
        </IonText>

        {!isArchived && canCreateEvent && (
          <button
            type="button"
            onClick={onCreate}
            style={{
              marginTop: 24,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 20px',
              borderRadius: 12,
              border: '1px solid rgba(52, 211, 153, 0.25)',
              background: 'rgba(52, 211, 153, 0.1)',
              color: 'rgba(52, 211, 153, 0.95)',
              fontSize: 14.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <IonIcon icon={addOutline} style={{ fontSize: 18 }} />
            Create event
          </button>
        )}
      </div>
    </div>
  );
}
