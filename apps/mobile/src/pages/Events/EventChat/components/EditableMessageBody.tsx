import { IonIcon } from '@ionic/react';
import { closeCircle, musicalNotes } from 'ionicons/icons';
import { useCallback, useMemo } from 'react';

type EditableMessageBodyProps = {
  value: string;
  onChange: (value: string) => void;
};

export function EditableMessageBody({
  value,
  onChange,
}: EditableMessageBodyProps) {
  // Parse out song tags and text segments
  const segments = useMemo(() => {
    const songTagRegex = /\[\[song:([a-f0-9-]+):([^\]]+)\]\]/g;
    const result: Array<{
      type: 'text' | 'song';
      content: string;
      songId?: string;
      title?: string;
      raw?: string;
    }> = [];
    let lastIndex = 0;
    let match;

    while ((match = songTagRegex.exec(value)) !== null) {
      if (match.index > lastIndex) {
        result.push({
          type: 'text',
          content: value.slice(lastIndex, match.index),
        });
      }
      result.push({
        type: 'song',
        content: match[2],
        songId: match[1],
        title: match[2],
        raw: match[0],
      });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < value.length) {
      result.push({ type: 'text', content: value.slice(lastIndex) });
    }

    return result;
  }, [value]);

  const handleRemoveSong = useCallback(
    (rawTag: string) => {
      // Remove the song tag from the value
      const newValue = value
        .replace(rawTag, '')
        .replace(/\s{2,}/g, ' ')
        .trim();
      onChange(newValue);
    },
    [value, onChange]
  );

  const handleTextChange = useCallback(
    (index: number, newText: string) => {
      // Rebuild the value with updated text
      const newSegments = segments.map((seg, i) => {
        if (i === index && seg.type === 'text') {
          return { ...seg, content: newText };
        }
        return seg;
      });

      const newValue = newSegments
        .map((seg) => (seg.type === 'song' ? seg.raw : seg.content))
        .join('');

      onChange(newValue);
    },
    [segments, onChange]
  );

  // If no song tags, just show a regular textarea
  const hasSongTags = segments.some((s) => s.type === 'song');

  if (!hasSongTags) {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        autoFocus
        style={{
          width: '100%',
          borderRadius: 10,
          border: '1px solid rgba(148,163,184,0.8)',
          background: 'rgba(15,23,42,0.98)',
          color: '#E5E7EB',
          fontSize: 14,
          padding: 8,
          resize: 'none',
          outline: 'none',
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: '100%',
        borderRadius: 10,
        border: '1px solid rgba(148,163,184,0.8)',
        background: 'rgba(15,23,42,0.98)',
        padding: 8,
        minHeight: 100,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 4,
        }}
      >
        {segments.map((seg, i) => {
          if (seg.type === 'song') {
            return (
              <span
                key={`song-${i}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'rgba(236, 72, 153, 0.15)',
                  border: '1px solid rgba(236, 72, 153, 0.35)',
                  borderRadius: 6,
                  padding: '4px 6px 4px 8px',
                  color: '#EC4899',
                  fontSize: 13,
                  fontWeight: 600,
                }}
              >
                <IonIcon
                  icon={musicalNotes}
                  style={{ fontSize: 12, opacity: 0.9 }}
                />
                {seg.title}
                <button
                  type="button"
                  onClick={() => handleRemoveSong(seg.raw!)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 2,
                    margin: 0,
                    marginLeft: 2,
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#EC4899',
                    opacity: 0.7,
                  }}
                >
                  <IonIcon icon={closeCircle} style={{ fontSize: 16 }} />
                </button>
              </span>
            );
          }

          // Text segment - editable input
          return (
            <input
              key={`text-${i}`}
              type="text"
              value={seg.content}
              onChange={(e) => handleTextChange(i, e.target.value)}
              style={{
                flex: seg.content.length > 20 ? '1 1 auto' : '0 0 auto',
                minWidth: Math.max(20, seg.content.length * 8),
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: '#E5E7EB',
                fontSize: 14,
                padding: '4px 0',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
