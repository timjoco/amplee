import { IonIcon, IonSpinner } from '@ionic/react';
import { cloudUploadOutline } from 'ionicons/icons';
import { RefObject } from 'react';

type Props = {
  uploading: boolean;
  fileInputRef: RefObject<HTMLInputElement>;
  onUploadClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
};

export function FileUploadButton({
  uploading,
  fileInputRef,
  onUploadClick,
  onFileChange,
}: Props) {
  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
        onChange={onFileChange}
        style={{ display: 'none' }}
      />
      <button
        type="button"
        onClick={onUploadClick}
        disabled={uploading}
        style={{
          width: '100%',
          background:
            'linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
          border: '2px dashed rgba(52, 211, 153, 0.3)',
          borderRadius: 20,
          padding: '32px 24px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.7 : 1,
          transition: 'all 0.2s ease',
          marginBottom: 16,
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              background:
                'linear-gradient(135deg, rgba(52, 211, 153, 0.15) 0%, rgba(52, 211, 153, 0.08) 100%)',
              border: '1px solid rgba(52, 211, 153, 0.2)',
              borderRadius: 14,
              display: 'grid',
              placeItems: 'center',
            }}
          >
            {uploading ? (
              <IonSpinner
                name="crescent"
                style={{ width: 24, height: 24, color: '#34d399' }}
              />
            ) : (
              <IonIcon
                icon={cloudUploadOutline}
                style={{ fontSize: 24, color: '#6ee7b7' }}
              />
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <p
              style={{
                margin: 0,
                fontSize: 15,
                fontWeight: 600,
                color: '#F9FAFB',
              }}
            >
              {uploading ? 'Uploading…' : 'Upload File'}
            </p>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 13,
                color: '#9ca3af',
              }}
            >
              PDF, JPG, PNG, DOC (Max 10MB)
            </p>
          </div>
        </div>
      </button>
    </>
  );
}
