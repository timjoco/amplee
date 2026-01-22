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
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(148,163,184,0.12)',
          borderRadius: 20,
          padding: 20,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
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
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            color: '#e5e7eb',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 14,
            padding: '14px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <IonIcon icon={createOutline} style={{ fontSize: 18, color: '#34d399' }} />
          Edit Notes
        </button>
      )}

      {/* Admin hint */}
      {isAdmin && (
        <div
          style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(148,163,184,0.08)',
            borderRadius: 12,
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
