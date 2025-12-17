import { IonContent, IonModal } from '@ionic/react';
import { glassCard, PINK } from '../lib/styles';

export function RenameTemplateModal({
  isOpen,
  editName,
  setEditName,
  savingTemplate,
  onClose,
  onSave,
}: {
  isOpen: boolean;
  editName: string;
  setEditName: (v: string) => void;
  savingTemplate: boolean;
  onClose: () => void;
  onSave: () => void;
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
              border: `1px solid ${PINK.border}`,
              padding: 24,
              boxShadow: `0 18px 36px rgba(0,0,0,0.45), 0 0 18px ${PINK.glow}`,
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: 20,
                fontSize: 20,
                fontWeight: 700,
                color: '#f9fafb',
              }}
            >
              Rename Setlist
            </h3>

            <div style={{ marginBottom: 24 }}>
              <label
                style={{
                  display: 'block',
                  marginBottom: 8,
                  fontSize: 12,
                  fontWeight: 600,
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                Name
              </label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Setlist name"
                autoFocus
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${
                    editName ? PINK.border : 'rgba(255, 255, 255, 0.08)'
                  }`,
                  color: '#f9fafb',
                  fontSize: 16,
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                disabled={savingTemplate}
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
                disabled={savingTemplate}
                onClick={onSave}
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  borderRadius: 12,
                  background: PINK.primary,
                  border: 'none',
                  color: '#fff',
                  fontSize: 15,
                  fontWeight: 600,
                  opacity: savingTemplate ? 0.7 : 1,
                  boxShadow: `0 4px 12px ${PINK.glow}`,
                }}
              >
                {savingTemplate ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
}
