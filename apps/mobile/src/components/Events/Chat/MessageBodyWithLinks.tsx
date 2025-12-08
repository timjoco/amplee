import { memo } from 'react';
import { parseSongTags } from '../../SongTag';

type LinkPreview = {
  title?: string;
  description?: string;
  image?: string;
  url: string;
};

interface MessageBodyWithLinksProps {
  body: string;
  preview?: LinkPreview;
  status?: 'sending' | 'sent' | 'failed';
  onSongNavigate?: (songId: string) => void;
  variant?: 'full' | 'preview'; // 👈 NEW
}

export const MessageBodyWithLinks = memo<MessageBodyWithLinksProps>(
  ({ body, preview, status, onSongNavigate, variant = 'full' }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    const renderContent = () => {
      // 🔑 In preview mode, don't wire up song navigation
      const songParsed = parseSongTags(
        body,
        variant === 'preview' ? undefined : onSongNavigate
      );

      return songParsed.map((segment, segmentIndex) => {
        // If it's a JSX element (SongTag), render it directly
        if (typeof segment !== 'string') {
          return segment;
        }

        // For string segments, parse URLs
        const parts = segment.split(urlRegex);

        return parts.map((part, partIndex) => {
          if (part.match(urlRegex)) {
            return (
              <a
                key={`${segmentIndex}-${partIndex}`}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#60A5FA',
                  textDecoration: 'underline',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {part}
              </a>
            );
          }

          return <span key={`${segmentIndex}-${partIndex}`}>{part}</span>;
        });
      });
    };

    const isPreview = variant === 'preview';

    return (
      <div>
        <div
          style={{
            fontSize: isPreview ? 'inherit' : 16,
            whiteSpace: isPreview ? 'normal' : 'pre-wrap',
            wordBreak: 'break-word',
            color: isPreview ? 'inherit' : 'rgba(237,235,255,0.92)',
            opacity: status === 'failed' ? 0.5 : 1,
          }}
        >
          {renderContent()}
        </div>

        {/* Keep link preview only for full chat, not inbox preview */}
        {preview && !isPreview && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              window.open(preview.url, '_blank');
            }}
            style={{
              marginTop: 8,
              borderRadius: 12,
              border: '1px solid rgba(148,163,184,0.3)',
              background: 'rgba(15,23,42,0.6)',
              overflow: 'hidden',
              cursor: 'pointer',
              maxWidth: 320,
            }}
          >
            {preview.image && (
              <img
                src={preview.image}
                alt=""
                style={{
                  width: '100%',
                  height: 160,
                  objectFit: 'cover',
                }}
              />
            )}
            <div style={{ padding: 10 }}>
              {preview.title && (
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 14,
                    color: '#E5E7EB',
                    marginBottom: 4,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {preview.title}
                </div>
              )}
              {preview.description && (
                <div
                  style={{
                    fontSize: 12,
                    color: 'rgba(156,163,175,0.9)',
                    lineHeight: 1.4,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {preview.description}
                </div>
              )}
              <div
                style={{
                  fontSize: 11,
                  color: 'rgba(148,163,184,0.7)',
                  marginTop: 6,
                }}
              >
                {new URL(preview.url).hostname}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
);

MessageBodyWithLinks.displayName = 'MessageBodyWithLinks';
