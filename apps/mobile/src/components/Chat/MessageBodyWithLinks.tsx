import { memo } from 'react';

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
}

export const MessageBodyWithLinks = memo<MessageBodyWithLinksProps>(
  ({ body, preview, status }) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = body.split(urlRegex);

    return (
      <div>
        <div
          style={{
            fontSize: 16,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'rgba(237,235,255,0.92)',
            opacity: status === 'failed' ? 0.5 : 1,
          }}
        >
          {parts.map((part, i) => {
            if (part.match(urlRegex)) {
              return (
                <a
                  key={i}
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
            return <span key={i}>{part}</span>;
          })}
        </div>

        {preview && (
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
