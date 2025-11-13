// apps/mobile/src/components/Bands/BandTileMobile.tsx
import { IonCard, IonCardContent } from '@ionic/react';
import { Link } from 'react-router-dom';
import AvatarImageMobile from '../ui/AvatarImageMobile';

export type BandTileProps = {
  id: string;
  name: string;
  bandRole?: 'admin' | 'member';
  role?: 'admin' | 'member'; // alias
  avatarUrl?: string | null; // https url
  avatar_url?: string | null; // db column
  avatarPath?: string | null; // storage path
  selected?: boolean;
  size?: number; // avatar diameter
  onClick?: () => void; // optional, fired in addition to navigation
};

export default function BandTileMobile({
  id,
  name,
  avatarUrl,
  avatar_url,
  avatarPath,
  selected = false,
  size = 100,
  onClick,
}: BandTileProps) {
  const href = `/bands/${id}`;

  // web-like shadows/ring
  const focusRing =
    '0 0 0 2px rgba(255,255,255,0.18), 0 0 0 10px rgba(139,92,246,0.35)';
  const baseShadow = '0 10px 24px rgba(0,0,0,.28)';

  return (
    <Link
      to={href}
      onClick={onClick}
      aria-label={`Open ${name}`}
      style={{
        display: 'block',
        color: 'inherit',
        textDecoration: 'none',
        width: '100%',
        minWidth: 0,
      }}
    >
      <IonCard
        // IMPORTANT: don't use `button` prop when wrapping with <Link>
        style={{
          // make the whole card match the gradient (no bottom strip)
          '--background':
            'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))',
          // fallback for non-var paths (ensures fill)
          background:
            'linear-gradient(rgba(255,255,255,0.04), rgba(255,255,255,0.02)) padding-box',
          '--color': '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          borderRadius: 12,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: selected ? focusRing : baseShadow,
          transform: 'translateY(0)',
          transition:
            'transform .16s ease, box-shadow .16s ease, border-color .16s ease',
        }}
      >
        <IonCardContent
          style={{
            background: 'inherit', // inherit to avoid any mismatched strip
            flex: 1, // fill the card
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: 8,
            padding: 12,
            '--inner-padding': '12px',
          }}
        >
          {/* Avatar */}
          <div style={{ flex: 1, display: 'grid', placeItems: 'center' }}>
            <AvatarImageMobile
              name={name}
              bucket="band-avatars"
              avatarPath={avatarPath ?? undefined}
              srcGuess={avatarUrl ?? avatar_url ?? undefined}
              size={size}
              style={{
                fontWeight: 800,
                letterSpacing: 0.5,
                color: '#fff',
                border: '2px solid rgba(255,255,255,0.06)',
                backgroundColor: 'rgba(255,255,255,0.06)',
                backgroundImage:
                  'radial-gradient(120% 120% at 20% 15%, rgba(139,92,246,0.16) 0%, transparent 55%)',
              }}
            />
          </div>

          {/* Name */}
          <h6
            aria-label={name}
            title={name}
            style={{
              margin: 0,
              textAlign: 'center',
              fontWeight: 800,
              letterSpacing: 0.2,
              color: 'rgba(255,255,255,0.95)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
            }}
          >
            {name}
          </h6>
        </IonCardContent>
      </IonCard>
    </Link>
  );
}
