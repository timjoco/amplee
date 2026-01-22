import { IonIcon } from '@ionic/react';
import { createOutline, documentTextOutline } from 'ionicons/icons';

type Props = {
  isAdmin: boolean;
  onEdit: () => void;
};

export function EmptyNotesState({ isAdmin, onEdit }: Props) {
  return (
    <div
      style={{
        background:
          'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
        border: '1px solid rgba(148,163,184,0.12)',
        borderRadius: 20,
        padding: '40px 24px',
        textAlign: 'center',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          margin: '0 auto 20px',
          background:
            'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(52, 211, 153, 0.08) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.2)',
          borderRadius: 16,
          display: 'grid',
          placeItems: 'center',
        }}
      >
        <IonIcon
          icon={documentTextOutline}
          style={{ fontSize: 28, color: '#6ee7b7' }}
        />
      </div>

      <h3
        style={{
          margin: '0 0 8px',
          fontSize: 18,
          fontWeight: 700,
          color: '#e5e7eb',
        }}
      >
        No Notes Yet
      </h3>
      <p
        style={{
          margin: '0 0 20px',
          fontSize: 14,
          color: '#9ca3af',
          lineHeight: 1.5,
        }}
      >
        {isAdmin
          ? 'Add important details like load-in times, parking info, or special instructions.'
          : 'No notes have been added for this event yet.'}
      </p>

      {isAdmin && (
        <button
          type="button"
          onClick={onEdit}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background:
              'linear-gradient(135deg, rgba(52,211,153,0.9) 0%, rgba(16,185,129,0.9) 100%)',
            color: '#fff',
            border: '1px solid rgba(52,211,153,0.4)',
            borderRadius: 14,
            padding: '14px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px rgba(52,211,153,0.3)',
          }}
        >
          <IonIcon icon={createOutline} style={{ fontSize: 18 }} />
          Add Notes
        </button>
      )}
    </div>
  );
}
