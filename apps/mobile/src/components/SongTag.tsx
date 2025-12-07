import { IonIcon } from '@ionic/react';
import { musicalNotes } from 'ionicons/icons';
import { useCallback } from 'react';

type SongTagProps = {
  songId: string;
  title: string;
  onNavigate?: (songId: string) => void;
};

export function SongTag({ songId, title, onNavigate }: SongTagProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onNavigate?.(songId);
    },
    [songId, onNavigate]
  );

  return (
    <span
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: 'rgba(236, 72, 153, 0.12)',
        border: '1px solid rgba(236, 72, 153, 0.35)',
        borderRadius: 6,
        padding: '2px 8px 2px 6px',
        margin: '0 2px',
        color: '#EC4899',
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 150ms ease',
        verticalAlign: 'middle',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(236, 72, 153, 0.2)';
        e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.5)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(236, 72, 153, 0.12)';
        e.currentTarget.style.borderColor = 'rgba(236, 72, 153, 0.35)';
      }}
    >
      <IonIcon
        icon={musicalNotes}
        style={{
          fontSize: 12,
          opacity: 0.9,
        }}
      />
      {title}
    </span>
  );
}

// Utility to parse song tags from message text
// Format: [[song:uuid:Song Title]]
export function parseSongTags(
  text: string,
  onNavigate?: (songId: string) => void
): (string | JSX.Element)[] {
  const songTagRegex = /\[\[song:([a-f0-9-]+):([^\]]+)\]\]/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = songTagRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add song tag component
    const [, songId, title] = match;
    parts.push(
      <SongTag
        key={`song-${match.index}`}
        songId={songId}
        title={title}
        onNavigate={onNavigate}
      />
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// Check if text contains @songs trigger (for activating picker)
export function hasSongMentionTrigger(text: string): boolean {
  return /@songs\s*$/i.test(text);
}

// Remove the @songs trigger from text after song selection
export function removeSongTrigger(text: string): string {
  return text.replace(/@songs\s*$/i, '');
}

// Create the song tag markup to insert into message
export function createSongTag(songId: string, title: string): string {
  return `[[song:${songId}:${title}]]`;
}
