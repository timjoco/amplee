import { IonIcon } from '@ionic/react';
import { folderOpenOutline } from 'ionicons/icons';

type Props = {
  isAdmin: boolean;
};

export function EmptyFilesState({ isAdmin }: Props) {
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
          icon={folderOpenOutline}
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
        No files yet
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          color: '#6b7280',
          lineHeight: 1.5,
        }}
      >
        {isAdmin
          ? 'Upload stage plots, contracts, or other event files'
          : 'No files have been uploaded for this event yet'}
      </p>
    </div>
  );
}
