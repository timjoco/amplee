import { IonIcon } from '@ionic/react';
import { folderOpenOutline } from 'ionicons/icons';

type Props = {
  isAdmin: boolean;
};

export function EmptyFilesState({ isAdmin }: Props) {
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
          icon={folderOpenOutline}
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
        No Files Yet
      </h3>
      <p
        style={{
          margin: 0,
          fontSize: 14,
          color: '#9ca3af',
          lineHeight: 1.5,
        }}
      >
        {isAdmin
          ? 'Upload stage plots, contracts, or other event files.'
          : 'No files have been uploaded for this event yet.'}
      </p>
    </div>
  );
}
