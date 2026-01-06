import { IonIcon } from '@ionic/react';
import { createOutline } from 'ionicons/icons';

type Props = {
  notes: string;
  isAdmin: boolean;
  onEdit: () => void;
};

export function NotesViewer({ notes, isAdmin, onEdit }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background: 'rgba(17, 24, 39, 0.6)',
          border: '1px solid rgba(55, 65, 81, 0.6)',
          borderRadius: 12,
          padding: 16,
        }}
      >
        <p
          style={{
            margin: 0,
            color: '#e5e7eb',
            fontSize: 15,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}
        >
          {notes}
        </p>
      </div>

      {isAdmin && (
        <button
          type="button"
          onClick={onEdit}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background: 'rgba(17, 24, 39, 0.6)',
            color: '#d1d5db',
            border: '1px solid rgba(55, 65, 81, 0.6)',
            borderRadius: 10,
            padding: '14px 16px',
            fontSize: 15,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <IonIcon icon={createOutline} style={{ fontSize: 18 }} />
          Edit Notes
        </button>
      )}

      {/* Admin hint */}
      {isAdmin && (
        <div
          style={{
            background: 'rgba(17, 24, 39, 0.4)',
            border: '1px solid rgba(55, 65, 81, 0.4)',
            borderRadius: 8,
            padding: 12,
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>
            Only band admins can edit event notes
          </p>
        </div>
      )}
    </div>
  );
}
