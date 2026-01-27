import { IonIcon } from '@ionic/react';
import { locationOutline } from 'ionicons/icons';
import { useCallback } from 'react';

// Teal theme for stops - dark teal background with light text for contrast on any background
const STOP_TAG_BG = 'rgba(13, 78, 71, 0.95)';
const STOP_TAG_BORDER = 'rgba(20, 184, 166, 0.7)';
const STOP_TAG_TEXT = '#f0fdfa';
const STOP_TAG_ICON = '#5eead4';

type StopTagProps = {
  stopId: string;
  venueName: string;
  onNavigate?: (stopId: string) => void;
};

export function StopTag({ stopId, venueName, onNavigate }: StopTagProps) {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onNavigate?.(stopId);
    },
    [stopId, onNavigate]
  );

  return (
    <span
      onClick={handleClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        background: STOP_TAG_BG,
        border: `1px solid ${STOP_TAG_BORDER}`,
        borderRadius: 6,
        padding: '2px 8px 2px 6px',
        margin: '0 2px',
        color: STOP_TAG_TEXT,
        fontSize: 13,
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'all 150ms ease',
        verticalAlign: 'middle',
        backdropFilter: 'blur(4px)',
        WebkitBackdropFilter: 'blur(4px)',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(17, 94, 86, 0.98)';
        e.currentTarget.style.borderColor = 'rgba(45, 212, 191, 0.9)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = STOP_TAG_BG;
        e.currentTarget.style.borderColor = STOP_TAG_BORDER;
      }}
    >
      <IonIcon
        icon={locationOutline}
        style={{
          fontSize: 12,
          opacity: 0.9,
        }}
      />
      {venueName}
    </span>
  );
}

// Utility to parse stop tags from message text
// Format: [[stop:uuid:Venue Name]]
export function parseStopTags(
  text: string,
  onNavigate?: (stopId: string) => void
): (string | JSX.Element)[] {
  const stopTagRegex = /\[\[stop:([a-f0-9-]+):([^\]]+)\]\]/g;
  const parts: (string | JSX.Element)[] = [];
  let lastIndex = 0;
  let match;

  while ((match = stopTagRegex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }

    // Add stop tag component or static chip based on whether navigation is enabled
    const [, stopId, venueName] = match;

    if (onNavigate) {
      // Interactive version for chat
      parts.push(
        <StopTag
          key={`stop-${match.index}`}
          stopId={stopId}
          venueName={venueName}
          onNavigate={onNavigate}
        />
      );
    } else {
      // Non-interactive version for previews
      parts.push(
        <span
          key={`stop-${match.index}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: STOP_TAG_BG,
            border: `1px solid ${STOP_TAG_BORDER}`,
            borderRadius: 6,
            padding: '2px 8px 2px 6px',
            margin: '0 2px',
            color: STOP_TAG_TEXT,
            fontSize: 13,
            fontWeight: 600,
            verticalAlign: 'middle',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
          }}
        >
          <IonIcon
            icon={locationOutline}
            style={{
              fontSize: 12,
              opacity: 0.9,
            }}
          />
          {venueName}
        </span>
      );
    }

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts.length > 0 ? parts : [text];
}

// Check if text contains @stops trigger (for activating picker)
export function hasStopMentionTrigger(text: string): boolean {
  return /@stops\s*$/i.test(text);
}

// Remove the @stops trigger from text after stop selection
export function removeStopTrigger(text: string): string {
  return text.replace(/@stops\s*$/i, '');
}

// Create the stop tag markup to insert into message
export function createStopTag(stopId: string, venueName: string): string {
  return `[[stop:${stopId}:${venueName}]]`;
}

// Type for stop tag data in composer
export type StopTagData = {
  id: string;
  venueName: string;
  date: string | null;
  city: string | null;
};

// Serialize message with stop tags
export function serializeStopTags(text: string, tags: StopTagData[]): string {
  if (!tags.length) return text;
  const tagMarkup = tags.map((t) => `[[stop:${t.id}:${t.venueName}]]`).join(' ');
  return `${text.trim()} ${tagMarkup}`.trim();
}
