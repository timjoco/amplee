import { IonIcon, IonSpinner } from '@ionic/react';
import { checkmarkCircle } from 'ionicons/icons';

type Props = {
  saving: boolean;
  saveSuccess: boolean;
  onSave: () => void;
};

export function SaveButton({ saving, saveSuccess, onSave }: Props) {
  return (
    <button
      type="button"
      onClick={onSave}
      disabled={saving}
      style={{
        width: '100%',
        marginTop: 20,
        padding: '14px 20px',
        borderRadius: 12,
        border: 'none',
        fontSize: 15,
        fontWeight: 700,
        cursor: saving ? 'default' : 'pointer',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: saveSuccess
          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
          : saving
          ? 'rgba(139, 92, 246, 0.4)'
          : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
        color: '#fff',
        boxShadow: saveSuccess
          ? '0 4px 20px rgba(16, 185, 129, 0.4)'
          : saving
          ? 'none'
          : '0 4px 20px rgba(139, 92, 246, 0.4)',
      }}
    >
      {saving ? (
        <>
          <IonSpinner
            style={{
              '--color': '#fff',
              width: 18,
              height: 18,
            }}
          />
          <span>Saving...</span>
        </>
      ) : saveSuccess ? (
        <>
          <IonIcon icon={checkmarkCircle} style={{ fontSize: 20 }} />
          <span>Saved!</span>
        </>
      ) : (
        <span>Save changes</span>
      )}
    </button>
  );
}
