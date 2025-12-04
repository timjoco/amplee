// apps/web/src/components/Public/BandMediaStrip.tsx
import type { BandPageTheme } from '@/themes/publicPageThemes';
import type { BandMediaItem } from '@/types/db';

type Props = {
  items: BandMediaItem[];
  theme: BandPageTheme;
};

export function BandMediaStrip({ items, theme }: Props) {
  if (!items || items.length === 0) return null;

  const muted = theme.secondaryTextColor;
  const cardBorder = theme.borderColor;
  const textColor = theme.mainTextColor;
  const accent = theme.followButtonBorder || theme.borderColor;
  const accentGlow = theme.borderColor;

  return (
    <section
      style={{
        marginBottom: 20,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <h2
          style={{
            fontSize: 13,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            color: muted,
            margin: 0,
          }}
        >
          Media
        </h2>
        <span
          style={{
            fontSize: 11,
            color: muted,
            opacity: 0.8,
          }}
        >
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Horizontal strip */}
      <div
        style={{
          display: 'flex',
          gap: 12,
          overflowX: 'auto',
          paddingBottom: 4,
          paddingTop: 4,
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {items.map((item) => {
          const isVideo = item.type === 'video';

          const card = (
            <div
              key={item.id}
              style={{
                position: 'relative',
                flex: '0 0 150px',
                height: 150,
                borderRadius: 16,
                overflow: 'hidden',
                backgroundColor: 'rgba(15,23,42,0.8)',
                border: `1px solid ${cardBorder}`,
                boxShadow: '0 8px 24px rgba(0,0,0,0.45)',
                display: 'flex',
                flexDirection: 'column',
                cursor: item.href ? 'pointer' : 'default',
                transition:
                  'transform 140ms ease-out, box-shadow 140ms ease-out',
              }}
            >
              {/* Thumbnail */}
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                  backgroundImage: `url(${item.thumbnailUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'brightness(0.95)',
                }}
              >
                {/* gradient overlay bottom */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background:
                      'linear-gradient(to top, rgba(0,0,0,0.65), rgba(0,0,0,0.1) 50%, transparent)',
                  }}
                />

                {/* Video play icon */}
                {isVideo && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      width: 40,
                      height: 40,
                      borderRadius: '999px',
                      background: 'rgba(0,0,0,0.6)',
                      border: `1px solid ${accent}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: `0 0 14px ${accentGlow}`,
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width={20}
                      height={20}
                      fill={accent}
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                )}

                {/* Tag pill */}
                {item.tag && (
                  <div
                    style={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      padding: '3px 8px',
                      borderRadius: 999,
                      background: 'rgba(15,23,42,0.8)',
                      border: `1px solid ${cardBorder}`,
                      fontSize: 10,
                      fontWeight: 600,
                      color: textColor,
                      textTransform: 'uppercase',
                      letterSpacing: 0.6,
                    }}
                  >
                    {item.tag}
                  </div>
                )}
              </div>

              {/* Caption */}
              {item.title && (
                <div
                  style={{
                    padding: '8px 10px 9px',
                    fontSize: 12,
                    color: textColor,
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden',
                    background: 'rgba(15,23,42,0.9)',
                  }}
                >
                  {item.title}
                </div>
              )}
            </div>
          );

          if (!item.href) return card;

          return (
            <a
              key={item.id}
              href={item.href}
              target={isVideo ? '_blank' : '_self'}
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                flex: '0 0 auto',
              }}
            >
              {card}
            </a>
          );
        })}
      </div>
    </section>
  );
}
