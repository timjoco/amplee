import { IonIcon } from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';

type Props = {
  title: string;
  subtitle: string;
  onClick: () => void;
};

export function NavCard({ title, subtitle, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: '20px 24px',
        marginBottom: 16,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
        e.currentTarget.style.borderColor = 'rgba(52,211,153,0.3)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
        e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
      }}
    >
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: 16,
            fontWeight: 600,
            color: '#f9fafb',
            lineHeight: 1.3,
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 13,
            color: '#9ca3af',
          }}
        >
          {subtitle}
        </p>
      </div>
      <IonIcon
        icon={chevronBackOutline}
        style={{
          fontSize: 20,
          color: '#6b7280',
          transform: 'rotate(180deg)',
        }}
      />
    </div>
  );
}
