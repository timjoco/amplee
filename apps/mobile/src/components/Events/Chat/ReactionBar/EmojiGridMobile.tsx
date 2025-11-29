import { memo } from 'react';

interface EmojiGridMobileProps {
  emojis: string[];
  onPick: (emoji: string) => void;
}

export const EmojiGridMobile = memo<EmojiGridMobileProps>(
  ({ emojis, onPick }) => {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(8, 1.75rem)',
          gap: 4,
          padding: 6,
          borderRadius: 10,
          background: 'rgba(8,8,12,0.98)',
          border: '1px solid rgba(255,255,255,0.12)',
          maxWidth: 280,
        }}
      >
        {emojis.map((e) => (
          <button
            key={e}
            type="button"
            aria-label={`React with ${e}`}
            onClick={() => onPick(e)}
            style={{
              fontSize: 18,
              lineHeight: 1,
              textAlign: 'center',
              padding: 2,
              borderRadius: 4,
              border: 'none',
              background: 'transparent',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            {e}
          </button>
        ))}
      </div>
    );
  }
);

EmojiGridMobile.displayName = 'EmojiGridMobile';
