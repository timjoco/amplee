import { IonContent, IonIcon, IonModal, IonSpinner } from '@ionic/react';
import { trashOutline } from 'ionicons/icons';
import { glassCard, RED } from '../lib/styles';

export function DeleteTemplateModal({
  isOpen,
  templateName,
  songCount,
  deletingTemplate,
  onClose,
  onDelete,
}: {
  isOpen: boolean;
  templateName: string;
  songCount: number;
  deletingTemplate: boolean;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={onClose}>
      <IonContent
        style={{
          '--background': 'rgba(8, 8, 14, 0.98)',
        }}
      >
        <div
          style={{
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: 380,
              ...glassCard,
              border: `1px solid ${RED.border}`,
              padding: 24,
              boxShadow: `0 18px 36px rgba(0,0,0,0.45), 0 0 18px ${RED.glow}`,
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 14,
                background: RED.subtle,
                border: `1px solid ${RED.border}`,
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 16px',
              }}
            >
              <IonIcon
                icon={trashOutline}
                style={{ fontSize: 26, color: RED.light }}
              />
            </div>

            <h3
              style={{
                margin: 0,
                marginBottom: 8,
                fontSize: 20,
                fontWeight: 700,
                color: '#f9fafb',
                textAlign: 'center',
              }}
            >
              Delete Setlist?
            </h3>
            <p
              style={{
                margin: 0,
                marginBottom: 24,
                fontSize: 14,
                color: '#6b7280',
                lineHeight: 1.5,
                textAlign: 'center',
              }}
            >
              This will permanently remove "{templateName}" and all {songCount}{' '}
              song{songCount === 1 ? '' : 's'}. This can't be undone.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                disabled={deletingTemplate}
                onClick={onClose}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  color: '#e5e7eb',
                  fontSize: 15,
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                disabled={deletingTemplate}
                onClick={onDelete}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: RED.primary,
                  border: 'none',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  opacity: deletingTemplate ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                {deletingTemplate ? (
                  <>
                    <IonSpinner
                      style={{ '--color': '#fff', width: 16, height: 16 }}
                    />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
}
