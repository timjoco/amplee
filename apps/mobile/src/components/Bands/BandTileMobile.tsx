import { IonCard, IonCardContent, IonText } from '@ionic/react';
import AvatarImageMobile from '../ui/AvatarImageMobile';

export type BandTileProps = {
  id: string;
  name: string;
  role?: 'admin' | 'member';
  avatar_url?: string | null;
  avatarUrl?: string | null;
  avatarPath?: string | null;
  selected?: boolean;
  size?: number;
  onClick?: () => void;
};

export default function BandTileMobile({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  id,
  name,
  avatar_url,
  avatarUrl,
  avatarPath,
  selected = false,
  size = 120,
  onClick,
}: BandTileProps) {
  return (
    <IonCard
      button
      onClick={onClick}
      style={{
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.08)',
        background:
          'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
        boxShadow: selected
          ? '0 0 0 2px rgba(255,255,255,0.18), 0 0 0 10px rgba(139,92,246,0.35)'
          : '0 10px 24px rgba(0,0,0,.28)',
        aspectRatio: '1/1',
      }}
    >
      <IonCardContent
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: 12,
          justifyContent: 'space-between',
        }}
      >
        <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
          <AvatarImageMobile
            name={name}
            bucket="band-avatars"
            avatarPath={avatarPath ?? undefined}
            srcGuess={avatarUrl ?? avatar_url ?? undefined}
            size={size}
          />
        </div>

        <IonText color="light">
          <h6
            style={{
              margin: 0,
              textAlign: 'center',
              fontWeight: 800,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {name}
          </h6>
        </IonText>
      </IonCardContent>
    </IonCard>
  );
}
