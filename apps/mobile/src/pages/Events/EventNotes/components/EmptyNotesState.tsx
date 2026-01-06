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
        background: 'rgba(17, 24, 39, 0.6)',
        border: '1px solid rgba(55, 65, 81, 0.6)',
        borderRadius: 12,
        padding: '48px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          margin: '0 auto 16px',
          background: 'rgba(31, 41, 55, 0.8)',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <IonIcon
          icon={documentTextOutline}
          style={{ fontSize: 28, color: '#4b5563' }}
        />
      </div>

      <h3
        style={{
          margin: '0 0 8px',
          fontSize: 16,
          fontWeight: 600,
          color: '#9ca3af',
        }}
      >
        No notes yet
      </h3>
      <p
        style={{
          margin: '0 0 20px',
          fontSize: 14,
          color: '#6b7280',
          lineHeight: 1.5,
        }}
      >
        {isAdmin
          ? 'Add important details like load-in times, parking info, or special instructions'
          : 'No notes have been added for this event yet'}
      </p>

      {isAdmin && (
        <button
          type="button"
          onClick={onEdit}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '12px 20px',
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <IonIcon icon={createOutline} style={{ fontSize: 18 }} />
          Add Notes
        </button>
      )}
    </div>
  );
}
