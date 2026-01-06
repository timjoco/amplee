import AvatarImageMobile from '../../../components/ui/AvatarImageMobile';
import { AVATAR_BUCKET } from '../constants';

type Props = {
  displayName: string;
  avatarUrl: string | null;
  location: string;
};

export function AvatarCard({ displayName, avatarUrl, location }: Props) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 16,
        padding: 24,
        marginBottom: 16,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: -12,
              background:
                'radial-gradient(circle, rgba(52, 211, 153, 0.1) 0%, transparent 70%)',
              filter: 'blur(16px)',
              borderRadius: '50%',
            }}
          />
          <AvatarImageMobile
            name={displayName}
            bucket={AVATAR_BUCKET}
            avatarPath={avatarUrl ?? undefined}
            size={120}
          />
        </div>

        <div style={{ textAlign: 'center' }}>
          <h2
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 700,
              color: '#f9fafb',
              lineHeight: 1.2,
            }}
          >
            {displayName}
          </h2>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 14,
              color: '#9ca3af',
            }}
          >
            {location}
          </p>
        </div>
      </div>
    </div>
  );
}
