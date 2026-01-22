import { IonIcon, IonSpinner } from '@ionic/react';
import { checkmarkOutline, closeOutline } from 'ionicons/icons';

type Props = {
  editedNotes: string;
  isSaving: boolean;
  onNotesChange: (notes: string) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function NotesEditor({
  editedNotes,
  isSaving,
  onNotesChange,
  onSave,
  onCancel,
}: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '1px solid rgba(148,163,184,0.12)',
          borderRadius: 20,
          overflow: 'hidden',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <textarea
          value={editedNotes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Add event notes, instructions, or important details..."
          autoFocus
          style={{
            width: '100%',
            minHeight: 320,
            background: 'transparent',
            border: 'none',
            padding: 20,
            color: '#F9FAFB',
            fontSize: 15,
            lineHeight: 1.6,
            resize: 'none',
            outline: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            background:
              'linear-gradient(135deg, rgba(52,211,153,0.9) 0%, rgba(16,185,129,0.9) 100%)',
            color: '#fff',
            border: '1px solid rgba(52,211,153,0.4)',
            borderRadius: 14,
            padding: '14px 16px',
            fontSize: 14,
            fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 14px rgba(52,211,153,0.3)',
          }}
        >
          {isSaving ? (
            <IonSpinner name="crescent" style={{ width: 18, height: 18 }} />
          ) : (
            <IonIcon icon={checkmarkOutline} style={{ fontSize: 18 }} />
          )}
          {isSaving ? 'Saving…' : 'Save Notes'}
        </button>

        <button
          type="button"
          onClick={onCancel}
          disabled={isSaving}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background:
              'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            color: '#e5e7eb',
            border: '1px solid rgba(148,163,184,0.12)',
            borderRadius: 14,
            padding: '14px 20px',
            fontSize: 14,
            fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s ease',
          }}
        >
          <IonIcon icon={closeOutline} style={{ fontSize: 18 }} />
          Cancel
        </button>
      </div>
    </div>
  );
}
