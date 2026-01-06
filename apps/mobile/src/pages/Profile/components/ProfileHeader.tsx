import { Capacitor } from '@capacitor/core';
import { IonButton, IonHeader, IonIcon, IonToolbar } from '@ionic/react';
import { chevronBackOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';

const isAndroid = Capacitor.getPlatform() === 'android';

export function ProfileHeader() {
  const nav = useNavigate();

  return (
    <IonHeader>
      <IonToolbar
        style={{
          paddingTop: isAndroid
            ? 'env(safe-area-inset-top, 24px)'
            : undefined,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px',
            gap: 12,
          }}
        >
          <IonButton
            onClick={() => nav(-1)}
            fill="clear"
            style={{
              minWidth: 0,
              padding: 6,
              margin: 0,
              flexShrink: 0,
            }}
          >
            <IonIcon
              icon={chevronBackOutline}
              style={{ color: '#9ca3af', fontSize: 22 }}
            />
          </IonButton>

          <div style={{ flex: 1 }}>
            <h1
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: '#F9FAFB',
                margin: 0,
                letterSpacing: '-0.8px',
                lineHeight: 1.15,
              }}
            >
              Profile
            </h1>
            <div
              style={{
                fontSize: 13,
                color: '#9ca3af',
                marginTop: 4,
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
