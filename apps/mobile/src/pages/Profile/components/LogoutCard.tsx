import { IonIcon } from '@ionic/react';
import { logOutOutline } from 'ionicons/icons';

type Props = {
  onClick: () => void;
};

export function LogoutCard({ onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(239,68,68,0.05)',
        border: '1px solid rgba(239,68,68,0.2)',
        borderRadius: 16,
        padding: '20px 24px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(239,68,68,0.05)';
        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
      }}
    >
      <span
        style={{
          fontSize: 16,
          fontWeight: 600,
          color: '#ef4444',
        }}
      >
        Log out
      </span>
      <IonIcon
        icon={logOutOutline}
        style={{ fontSize: 20, color: '#ef4444', opacity: 0.9 }}
      />
    </div>
  );
}
