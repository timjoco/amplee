import { IonIcon } from '@ionic/react';
import {
  addOutline,
  linkOutline,
  logoApple,
  logoYoutube,
  openOutline,
  trashOutline,
} from 'ionicons/icons';
import { glassCard, PINK, RED } from '../lib/styles';
import { SetlistTemplateLinkRow } from '../types/setlistTypes';
import { detectLinkType } from '../utils/setlistUtils';

export function ExternalLinksSection({
  links,
  onAddClick,
  isAddPressed,
  onDeleteLink,
  onOpenLink,
  isAdmin,
}: {
  links: SetlistTemplateLinkRow[];
  onAddClick: () => void;
  isAddPressed: boolean;
  onDeleteLink: (id: string) => void;
  onOpenLink: (url: string) => void;
  isAdmin: boolean;
}) {
  const renderLinkIcon = (url: string) => {
    const { kind } = detectLinkType(url);

    if (kind === 'spotify') {
      return <SpotifyIcon size={18} />;
    }
    if (kind === 'apple') {
      return <IonIcon icon={logoApple} style={{ fontSize: 18 }} />;
    }
    if (kind === 'youtube') {
      return <IonIcon icon={logoYoutube} style={{ fontSize: 18 }} />;
    }
    return <IonIcon icon={linkOutline} style={{ fontSize: 18 }} />;
  };

  return (
    <div
      style={{
        ...glassCard,
        border: `1px solid ${PINK.border}`,
        padding: 16,
        marginBottom: 16,
      }}
    >
      {/* Section Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: links.length > 0 ? 16 : 0,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <IonIcon
            icon={linkOutline}
            style={{ fontSize: 18, color: PINK.light }}
          />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: '#9ca3af',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            External Links
          </span>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onAddClick}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 10,
              background: PINK.subtle,
              border: `1px solid ${PINK.border}`,
              color: PINK.light,
              fontSize: 13,
              fontWeight: 600,
              transform: isAddPressed ? 'scale(0.95)' : 'scale(1)',
              transition: 'all 100ms ease-out',
            }}
          >
            <IonIcon icon={addOutline} style={{ fontSize: 16 }} />
            Add
          </button>
        )}
      </div>

      {/* Empty State */}
      {links.length === 0 ? (
        <div
          style={{
            padding: '16px',
            textAlign: 'center',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: '#6b7280',
            }}
          >
            {isAdmin
              ? 'Add links to Spotify playlists, Apple Music, YouTube, and more'
              : 'No external links added yet'}
          </p>
        </div>
      ) : (
        /* Links List */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}
        >
          {links.map((link) => (
            <div
              key={link.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: PINK.subtle,
                  border: `1px solid ${PINK.border}`,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  color: PINK.light,
                }}
              >
                {renderLinkIcon(link.url)}
              </div>

              <div
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: '#f9fafb',
                    marginBottom: 2,
                  }}
                >
                  {link.label || detectLinkType(link.url).label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {link.url}
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenLink(link.url)}
                style={{
                  padding: 8,
                  borderRadius: 8,
                  background: PINK.subtle,
                  border: `1px solid ${PINK.border}`,
                  color: PINK.light,
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                }}
              >
                <IonIcon icon={openOutline} style={{ fontSize: 16 }} />
              </button>

              {isAdmin && (
                <button
                  type="button"
                  onClick={() => onDeleteLink(link.id)}
                  style={{
                    padding: 8,
                    borderRadius: 8,
                    background: RED.subtle,
                    border: `1px solid ${RED.border}`,
                    color: RED.light,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                  }}
                >
                  <IonIcon icon={trashOutline} style={{ fontSize: 16 }} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SpotifyIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}
