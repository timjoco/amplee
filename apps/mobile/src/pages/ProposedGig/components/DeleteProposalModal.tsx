import { IonContent, IonModal } from '@ionic/react';

type Props = {
  isOpen: boolean;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function DeleteProposalModal({ isOpen, deleting, onConfirm, onCancel }: Props) {
  return (
    <IonModal isOpen={isOpen} onDidDismiss={() => !deleting && onCancel()}>
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
              maxWidth: 360,
              borderRadius: 20,
              padding: 24,
              background: 'rgba(15, 23, 42, 0.95)',
              border: '1px solid rgba(248, 113, 113, 0.4)',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8)',
            }}
          >
            <h3
              style={{
                margin: 0,
                marginBottom: 12,
                fontSize: 20,
                fontWeight: 800,
                color: 'rgba(248, 113, 113, 0.95)',
              }}
            >
              Delete Proposal?
            </h3>
            <p
              style={{
                margin: 0,
                marginBottom: 20,
                fontSize: 15,
                color: '#9ca3af',
                lineHeight: 1.5,
              }}
            >
              This will remove the proposal and all date options. This action cannot be
              undone.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                disabled={deleting}
                onClick={onConfirm}
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  borderRadius: 12,
                  border: '1px solid rgba(248, 113, 113, 0.5)',
                  background: 'rgba(248, 113, 113, 0.95)',
                  color: '#000000',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
              <button
                type="button"
                disabled={deleting}
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
