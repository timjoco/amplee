import { IonIcon, IonSpinner } from '@ionic/react';
import { alertCircleOutline, closeOutline } from 'ionicons/icons';
import { glassCard, RED } from '../lib/styles';

type Props = {
  isOpen: boolean;
  tourName: string;
  stopCount: number;
  deletingTour: boolean;
  onClose: () => void;
  onDelete: () => void;
};

export function DeleteTourModal({
  isOpen,
  tourName,
  stopCount,
  deletingTour,
  onClose,
  onDelete,
}: Props) {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(4px)',
        }}
      />

      {/* Modal */}
      <div
        style={{
          ...glassCard,
          position: 'relative',
          width: '100%',
          maxWidth: 380,
          padding: 0,
          overflow: 'hidden',
          border: `1px solid ${RED.border}`,
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: RED.subtle,
                border: `1px solid ${RED.border}`,
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <IonIcon
                icon={alertCircleOutline}
                style={{ fontSize: 18, color: RED.light }}
              />
            </div>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: '#f9fafb',
              }}
            >
              Delete Tour
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'grid',
              placeItems: 'center',
              color: '#9ca3af',
            }}
          >
            <IonIcon icon={closeOutline} style={{ fontSize: 20 }} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: 20 }}>
          <p
            style={{
              margin: 0,
              fontSize: 15,
              color: '#d1d5db',
              lineHeight: 1.5,
              marginBottom: 12,
            }}
          >
            Are you sure you want to delete{' '}
            <strong style={{ color: '#f9fafb' }}>{tourName}</strong>?
          </p>

          <p
            style={{
              margin: 0,
              fontSize: 14,
              color: '#6b7280',
              lineHeight: 1.5,
            }}
          >
            This will permanently delete the tour and all {stopCount}{' '}
            {stopCount === 1 ? 'stop' : 'stops'}, including financials and files.
            This action cannot be undone.
          </p>
        </div>

        {/* Actions */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            padding: '0 20px 20px',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={deletingTour}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#9ca3af',
              fontSize: 14,
              fontWeight: 600,
              opacity: deletingTour ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={deletingTour}
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: 10,
              background: RED.primary,
              border: 'none',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: `0 4px 14px ${RED.glow}`,
              opacity: deletingTour ? 0.6 : 1,
            }}
          >
            {deletingTour ? (
              <>
                <IonSpinner
                  style={{ '--color': '#fff', width: 16, height: 16 }}
                />
                Deleting...
              </>
            ) : (
              'Delete Tour'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
