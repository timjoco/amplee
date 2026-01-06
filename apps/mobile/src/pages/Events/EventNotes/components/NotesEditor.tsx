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
          background: 'rgba(17, 24, 39, 0.6)',
          border: '1px solid rgba(55, 65, 81, 0.6)',
          borderRadius: 12,
          overflow: 'hidden',
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
            padding: 16,
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
      <div style={{ display: 'flex', gap: 10 }}>
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
            background: '#16a34a',
            color: '#fff',
            border: 'none',
            borderRadius: 10,
            padding: '14px 16px',
            fontSize: 15,
            fontWeight: 600,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            opacity: isSaving ? 0.7 : 1,
            transition: 'all 0.15s ease',
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
            background: 'rgba(31, 41, 55, 0.8)',
            color: '#d1d5db',
            border: '1px solid rgba(55, 65, 81, 0.6)',
            borderRadius: 10,
            padding: '14px 20px',
            fontSize: 15,
            fontWeight: 500,
            cursor: isSaving ? 'not-allowed' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <IonIcon icon={closeOutline} style={{ fontSize: 18 }} />
          Cancel
        </button>
      </div>
    </div>
  );
}
