import { IonHeader, IonIcon, IonToolbar } from '@ionic/react';
import {
  chevronForwardOutline,
  personAddOutline,
  settingsOutline,
} from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import AvatarImageMobile from '../../../../components/ui/AvatarImageMobile';
import BandSettingsSheetMobile from '../../../../components/Bands/BandSheetModal';

type Props = {
  bandId: string;
  bandName: string;
  bandAvatarUrl: string | null;
  bandAvatarUpdatedAt: string | null;
  isAdmin: boolean;
  showSettings: boolean;
  onShowSettings: () => void;
  onHideSettings: () => void;
  isLarge?: boolean;
};

export function BandHeader({
  bandId,
  bandName,
  bandAvatarUrl,
  bandAvatarUpdatedAt,
  isAdmin,
  showSettings,
  onShowSettings,
  onHideSettings,
  isLarge = false,
}: Props) {
  const navigate = useNavigate();

  // Large screen: static header with action icons
  if (isLarge) {
    return (
      <IonHeader translucent>
        <IonToolbar
          style={{
            '--background': 'rgba(8,8,12,0.98)',
            borderBottom: '0.5px solid rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              width: '100%',
              padding: '14px 24px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
            }}
          >
            <AvatarImageMobile
              name={bandName}
              bucket="band-avatars"
              avatarPath={bandAvatarUrl || undefined}
              updatedAt={bandAvatarUpdatedAt || undefined}
              size={80}
            />

            <div
              style={{
                flex: 1,
                minWidth: 0,
                textAlign: 'left',
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: '#F9FAFB',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.6px',
                  lineHeight: 1.1,
                }}
              >
                {bandName || 'Band'}
              </span>
              <p
                style={{
                  margin: '4px 0 0',
                  fontSize: 14,
                  color: '#9ca3af',
                }}
              >
                Band
              </p>
            </div>

            {/* Action icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isAdmin && (
                <button
                  type="button"
                  onClick={() => navigate(`/bands/${bandId}/settings`, { state: { openInvite: true } })}
                  style={{
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    borderRadius: 12,
                    padding: 12,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Invite Members"
                >
                  <IonIcon
                    icon={personAddOutline}
                    style={{ fontSize: 22, color: '#a78bfa' }}
                  />
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate(`/bands/${bandId}/settings`)}
                style={{
                  background: 'rgba(71, 85, 105, 0.3)',
                  border: '1px solid rgba(71, 85, 105, 0.4)',
                  borderRadius: 12,
                  padding: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title="Settings"
              >
                <IonIcon
                  icon={settingsOutline}
                  style={{ fontSize: 22, color: '#9ca3af' }}
                />
              </button>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>
    );
  }

  // Small/medium screen: clickable header that opens modal
  return (
    <IonHeader translucent>
      <IonToolbar
        style={{
          '--background': 'rgba(8,8,12,0.98)',
          borderBottom: '0.5px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          type="button"
          onClick={onShowSettings}
          style={{
            width: '100%',
            background: 'transparent',
            border: 'none',
            padding: '14px 18px 18px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            cursor: 'pointer',
          }}
        >
          <AvatarImageMobile
            name={bandName}
            bucket="band-avatars"
            avatarPath={bandAvatarUrl || undefined}
            updatedAt={bandAvatarUpdatedAt || undefined}
            size={80}
          />

          <div
            style={{
              flex: 1,
              minWidth: 0,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: '#F9FAFB',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  letterSpacing: '-0.6px',
                  lineHeight: 1.1,
                }}
              >
                {bandName || 'Band'}
              </span>
            </div>
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 13,
                color: '#9ca3af',
              }}
            >
              Band
            </p>
          </div>

          <IonIcon
            icon={chevronForwardOutline}
            style={{
              fontSize: 20,
              color: '#9ca3af',
              flexShrink: 0,
              marginLeft: 4,
            }}
          />
        </button>
      </IonToolbar>

      <BandSettingsSheetMobile
        isOpen={showSettings}
        onDismiss={onHideSettings}
        bandId={bandId}
        bandName={bandName}
        avatarPath={bandAvatarUrl || undefined}
        isAdmin={isAdmin}
      />
    </IonHeader>
  );
}
