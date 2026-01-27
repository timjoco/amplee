import { IonHeader, IonIcon, IonToolbar } from '@ionic/react';
import { chevronBackOutline, personOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

export function ProfileHeader() {
  const nav = useNavigate();

  return (
    <IonHeader translucent className="ion-no-border">
      <IonToolbar
        style={{
          '--background': 'rgba(8, 8, 14, 0.95)',
          '--border-width': 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '12px 16px',
            gap: 12,
          }}
        >
          {/* Back Button */}
          <button
            onClick={() => nav(-1)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'grid',
              placeItems: 'center',
              color: '#9ca3af',
              flexShrink: 0,
            }}
          >
            <IonIcon icon={chevronBackOutline} style={{ fontSize: 20 }} />
          </button>

          {/* Title Section */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <IonIcon
                icon={personOutline}
                style={{ color: '#a78bfa', fontSize: 20 }}
              />
              <h1
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: '#f9fafb',
                  margin: 0,
                  letterSpacing: '-0.5px',
                }}
              >
                Profile
              </h1>
            </div>
            <div
              style={{
                fontSize: 13,
                color: '#6b7280',
                marginTop: 2,
                marginLeft: 28,
              }}
            >
              Manage your account settings
            </div>
          </div>
        </div>
      </IonToolbar>
    </IonHeader>
  );
}
