import { IonContent, IonModal } from '@ionic/react';
import { useState, useEffect } from 'react';

type Props = {
  isOpen: boolean;
  saving: boolean;
  initialTitle: string;
  initialVenue: string;
  onSave: (title: string, venue: string) => void;
  onCancel: () => void;
};

export function EditProposalModal({
  isOpen,
  saving,
  initialTitle,
  initialVenue,
  onSave,
  onCancel,
}: Props) {
  const [editTitle, setEditTitle] = useState(initialTitle);
  const [editVenue, setEditVenue] = useState(initialVenue);

  useEffect(() => {
    if (isOpen) {
      setEditTitle(initialTitle);
      setEditVenue(initialVenue);
    }
  }, [isOpen, initialTitle, initialVenue]);

  return (
    <IonModal isOpen={isOpen} onDidDismiss={() => !saving && onCancel()}>
      <IonContent
        style={{
          '--background':
            'linear-gradient(135deg, rgba(15, 23, 42, 0.98), rgba(15, 23, 42, 0.95))',
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
              borderRadius: 20,
              padding: 24,
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(251, 191, 36, 0.4)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: 20,
                fontSize: 20,
                fontWeight: 800,
                color: 'rgba(251, 191, 36, 0.95)',
              }}
            >
              Edit Proposal
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#9ca3af',
                  }}
                >
                  Title
                </label>
                <input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Gig title"
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    padding: 12,
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#e5e7eb',
                    fontSize: 14,
                  }}
                />
              </div>

              <div>
                <label
                  style={{
                    display: 'block',
                    marginBottom: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#9ca3af',
                  }}
                >
                  Location
                </label>
                <input
                  value={editVenue}
                  onChange={(e) => setEditVenue(e.target.value)}
                  placeholder="Venue"
                  style={{
                    width: '100%',
                    borderRadius: 12,
                    border: '1px solid rgba(251, 191, 36, 0.3)',
                    padding: 12,
                    background: 'rgba(15, 23, 42, 0.8)',
                    color: '#e5e7eb',
                    fontSize: 14,
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
                marginTop: 20,
              }}
            >
              <button
                type="button"
                disabled={saving}
                onClick={() => onSave(editTitle, editVenue)}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(251, 191, 36, 0.5)',
                  background: 'rgba(251, 191, 36, 0.95)',
                  color: '#000000',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={onCancel}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(148, 163, 184, 0.3)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#9ca3af',
                  fontSize: 15,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </IonContent>
    </IonModal>
  );
}
