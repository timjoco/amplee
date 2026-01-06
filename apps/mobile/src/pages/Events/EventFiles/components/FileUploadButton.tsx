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
          background: 'rgba(17, 24, 39, 0.6)',
          border: '2px dashed rgba(55, 65, 81, 0.8)',
          borderRadius: 12,
          padding: '32px 24px',
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.7 : 1,
          transition: 'all 0.15s ease',
          marginBottom: 16,
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
              background: 'rgba(22, 163, 74, 0.1)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {uploading ? (
              <IonSpinner
                name="crescent"
                style={{ width: 24, height: 24, color: '#16a34a' }}
              />
            ) : (
              <IonIcon
                icon={cloudUploadOutline}
                style={{ fontSize: 24, color: '#16a34a' }}
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
                color: '#6b7280',
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
