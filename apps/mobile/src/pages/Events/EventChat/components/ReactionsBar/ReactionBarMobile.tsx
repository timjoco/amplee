import { memo, useCallback, useEffect, useState } from 'react';
import { EmojiGridMobile } from './EmojiGridMobile';

interface ReactionBarMobileProps {
  reactions: Record<string, number>;
  myReactions: Record<string, true>;
  onToggle: (emoji: string) => void;
  showAddButton?: boolean;
}

const DEFAULT_EMOJIS = [
  '👍',
  '❤️',
  '😂',
  '👀',
  '🔥',
  '🎉',
  '🙏',
  '👏',
  '😮',
  '😢',
  '😡',
  '💯',
  '🤘',
  '🎶',
  '⭐️',
];

export const ReactionBarMobile = memo<ReactionBarMobileProps>(
  ({ reactions, myReactions, onToggle, showAddButton = true }) => {
    const [open, setOpen] = useState(false);
    const [justAdded, setJustAdded] = useState<string | null>(null);

    const entries = Object.entries(reactions).sort((a, b) => b[1] - a[1]);
    const hasReactions = entries.length > 0;

    const purpleBorder = 'rgba(150,120,255,0.9)';
    const purpleGlow = 'rgba(150,120,255,0.35)';

    useEffect(() => {
      if (justAdded) {
        const timer = setTimeout(() => setJustAdded(null), 300);
        return () => clearTimeout(timer);
      }
    }, [justAdded]);

    const handleToggle = useCallback(
      (emoji: string) => {
        setJustAdded(emoji);
        onToggle(emoji);
      },
      [onToggle]
    );

    return (
      <div
        style={{
          marginTop: hasReactions ? 6 : 0,
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            alignItems: 'center',
          }}
        >
          {hasReactions &&
            entries.map(([emoji, count]) => {
              const mine = !!myReactions[emoji];
              const isNew = justAdded === emoji;

              return (
                <button
                  key={emoji}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleToggle(emoji);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '2px 9px',
                    borderRadius: 999,
                    fontSize: 12,
                    border: mine
                      ? `1px solid ${purpleBorder}`
                      : '1px solid rgba(255,255,255,0.25)',
                    background: mine
                      ? 'radial-gradient(circle at top left, rgba(180,160,255,0.36), rgba(12,10,24,0.95))'
                      : 'rgba(20,18,32,0.9)',
                    boxShadow: mine
                      ? `0 0 0 1px ${purpleGlow}, 0 0 12px rgba(0,0,0,0.65)`
                      : '0 0 0 1px rgba(0,0,0,0.4)',
                    color: '#fff',
                    cursor: 'pointer',
                    minHeight: 24,
                    transform: isNew ? 'scale(1.2)' : 'scale(1)',
                    transition: 'transform 150ms cubic-bezier(0.4, 0, 0.2, 1)',
                  }}
                  onMouseDown={(e) => {
                    if (!isNew) e.currentTarget.style.transform = 'scale(0.9)';
                  }}
                  onMouseUp={(e) => {
                    if (!isNew) e.currentTarget.style.transform = 'scale(1)';
                  }}
                  onTouchStart={(e) => {
                    if (!isNew) e.currentTarget.style.transform = 'scale(0.9)';
                  }}
                  onTouchEnd={(e) => {
                    if (!isNew) e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <span aria-hidden style={{ fontSize: 13 }}>
                    {emoji}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      opacity: 0.9,
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

          {(hasReactions || showAddButton) && (
            <button
              type="button"
              aria-label="Add reaction"
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                border: hasReactions
                  ? '1px solid rgba(148,163,184,0.4)'
                  : '1px dashed rgba(255,255,255,0.5)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: hasReactions
                  ? 'rgba(20,18,32,0.9)'
                  : 'rgba(8,8,12,0.96)',
                color: '#ffffff',
                padding: 0,
                fontSize: hasReactions ? 14 : 16,
                lineHeight: 1,
                cursor: 'pointer',
                transition: 'all 150ms ease',
                opacity: hasReactions ? 0.4 : 1,
                filter: hasReactions ? 'grayscale(1)' : 'none',
              }}
              onMouseDown={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
                if (hasReactions) {
                  e.currentTarget.style.opacity = '0.6';
                }
              }}
              onMouseUp={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                if (hasReactions) {
                  e.currentTarget.style.opacity = '0.4';
                }
              }}
              onTouchStart={(e) => {
                e.currentTarget.style.transform = 'scale(0.9)';
                if (hasReactions) {
                  e.currentTarget.style.opacity = '0.6';
                }
              }}
              onTouchEnd={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                if (hasReactions) {
                  e.currentTarget.style.opacity = '0.4';
                }
              }}
            >
              {hasReactions ? '😊' : '+'}
            </button>
          )}
        </div>

        {open && (
          <EmojiGridMobile
            emojis={DEFAULT_EMOJIS}
            onPick={(emoji) => {
              handleToggle(emoji);
              setOpen(false);
            }}
          />
        )}
      </div>
    );
  }
);

ReactionBarMobile.displayName = 'ReactionBarMobile';
