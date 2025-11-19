import type { BandWithRole } from '../../types/bands';
import AvatarImageMobile from '../ui/AvatarImageMobile';

type Props = {
  id: string;
  name: string;
  bandRole?: BandWithRole['role'];
  avatarPath?: string | null;
  avatarUrl?: string | null;
  avatar_url?: string | null;
  avatarUpdatedAt?: string | null;
  size?: number;
  selected?: boolean;
  onClick?: () => void;
};

export default function BandTileMobile({
  name,
  avatarPath,
  avatar_url,
  avatarUpdatedAt,
  size = 110,
  selected = false,
  onClick,
}: Props) {
  // keep this if you ever use avatarUrl as a *real* URL
  // const srcGuess = avatarUrl ?? undefined;

  const effectivePath = avatarPath ?? avatar_url ?? undefined;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Open ${name}`}
      style={{
        appearance: 'none',
        border: 'none',
        background: 'transparent',
        padding: 0,
        margin: 8,
        width: 'calc(100% - 16px)',
        height: 'calc(100% - 16px)',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 20,
          border: selected
            ? '1px solid rgba(255,255,255,0.18)'
            : '1px solid rgba(255,255,255,0.10)',
          background:
            'linear-gradient(180deg, rgba(255,255,255,0.06), rgba(255,255,255,0.02))',
          boxShadow: selected
            ? '0 0 0 2px rgba(255,255,255,0.22), 0 10px 30px rgba(0,0,0,.45)'
            : '0 10px 24px rgba(0,0,0,.32)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 14,
          gap: 8,
          overflow: 'hidden',
          transition:
            'transform 150ms ease, box-shadow 150ms ease, border-color 150ms ease',
        }}
      >
        {/* Avatar */}
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            width: '100%',
          }}
        >
          <AvatarImageMobile
            name={name}
            bucket="band-avatars"
            avatarPath={effectivePath}
            // ❌ srcGuess={srcGuess}
            updatedAt={avatarUpdatedAt ?? undefined}
            size={size ?? 88}
            style={{
              boxShadow:
                'inset 0 0 0 2px rgba(255,255,255,0.06), 0 10px 24px rgba(0,0,0,.35)',
            }}
          />
        </div>

        {/* Name */}
        <div
          style={{
            width: '100%',
            textAlign: 'center',
          }}
        >
          <span
            style={{
              display: 'inline-block',
              maxWidth: '100%',
              fontWeight: 800,
              fontSize: 14,
              letterSpacing: 0.3,
              color: 'rgba(255,255,255,0.95)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
            title={name}
          >
            {name}
          </span>
        </div>
      </div>
    </button>
  );
}
