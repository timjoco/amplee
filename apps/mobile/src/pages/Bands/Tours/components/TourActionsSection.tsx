import { IonIcon } from '@ionic/react';
import { createOutline, trashOutline } from 'ionicons/icons';
import { glassCard, RED, TEAL } from '../lib/styles';

type Props = {
  onEditClick: () => void;
  onDeleteClick: () => void;
  isEditPressed: boolean;
  isDeletePressed: boolean;
};

export function TourActionsSection({
  onEditClick,
  onDeleteClick,
  isEditPressed,
  isDeletePressed,
}: Props) {
  return (
    <div style={{ marginBottom: 24 }}>
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: '#6b7280',
          }}
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
          Tour Settings
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* Edit Tour */}
        <button
          onClick={onEditClick}
          style={{
            ...glassCard,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: `1px solid ${TEAL.border}`,
            textAlign: 'left',
            color: 'inherit',
            transform: isEditPressed ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 120ms ease-out',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: TEAL.subtle,
              border: `1px solid ${TEAL.border}`,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <IonIcon
              icon={createOutline}
              style={{ fontSize: 18, color: TEAL.light }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: '#f9fafb',
                marginBottom: 2,
              }}
            >
              Edit Tour
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              Change name, dates, or status
            </div>
          </div>
        </button>

        {/* Delete Tour */}
        <button
          onClick={onDeleteClick}
          style={{
            ...glassCard,
            padding: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: `1px solid ${RED.border}`,
            textAlign: 'left',
            color: 'inherit',
            transform: isDeletePressed ? 'scale(0.98)' : 'scale(1)',
            transition: 'all 120ms ease-out',
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              background: RED.subtle,
              border: `1px solid ${RED.border}`,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            <IonIcon
              icon={trashOutline}
              style={{ fontSize: 18, color: RED.light }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: RED.light,
                marginBottom: 2,
              }}
            >
              Delete Tour
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>
              Permanently delete this tour and all stops
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
