/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { IonIcon, IonTextarea } from '@ionic/react';
import { closeCircle, musicalNotes } from 'ionicons/icons';
import { useCallback, useRef, type KeyboardEvent } from 'react';

export type SongTagData = {
  id: string;
  title: string;
};

interface ComposerInputProps {
  value: string;
  songTags: SongTagData[];
  placeholder?: string;
  onValueChange: (value: string) => void;
  onSongTagsChange: (tags: SongTagData[]) => void;
  onSongTrigger?: () => void;
  onFocus?: () => void;
  onSubmit?: () => void;
}

const GLASS_BG = 'rgba(16, 16, 16, 0.6)';
const GLASS_BORDER = 'rgba(4, 47, 20, 0.2)';
const GLASS_BORDER_FOCUS = 'rgba(34, 197, 94, 0.4)';
const GREEN_PRIMARY = '#22C55E';
const TEXT_PRIMARY = '#F8FAFC';
const TEXT_SECONDARY = '#94A3B8';

const SONG_TAG_BG = 'rgba(236, 72, 153, 0.15)';
const SONG_TAG_BORDER = 'rgba(236, 72, 153, 0.35)';
const SONG_TAG_TEXT = '#F472B6';
const SONG_TAG_ICON = '#EC4899';

const BASE_HEIGHT = 47;

export function ComposerInput({
  value,
  songTags,
  placeholder = 'Message...',
  onValueChange,
  onSongTagsChange,
  onSongTrigger,
  onFocus,
  onSubmit,
}: ComposerInputProps) {
  const textareaRef = useRef<HTMLIonTextareaElement>(null);
  const isIOS = Capacitor.getPlatform() === 'ios';

  const handleChange = useCallback(
    (e: CustomEvent) => {
      let nextValue = ((e as any).detail?.value as string | undefined) ?? '';

      if (onSongTrigger) {
        const triggerPattern = /(^|\s)@songs$/i;

        if (triggerPattern.test(nextValue)) {
          nextValue = nextValue
            .replace(triggerPattern, '$1')
            .replace(/\s+$/, ' ');
          onSongTrigger();
        }
      }

      onValueChange(nextValue);
    },
    [onValueChange, onSongTrigger]
  );

  const handleFocus = useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLIonTextareaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSubmit?.();

        if (isIOS) {
          setTimeout(() => {
            textareaRef.current?.setFocus();
          }, 50);
        }
      }
    },
    [onSubmit, isIOS]
  );

  const handleRemoveTag = useCallback(
    (tagId: string) => {
      onSongTagsChange(songTags.filter((t) => t.id !== tagId));
    },
    [songTags, onSongTagsChange]
  );

  const hasTags = songTags.length > 0;

  return (
    <div
      className="composer-container"
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: BASE_HEIGHT,
        maxHeight: hasTags ? 140 : BASE_HEIGHT,
        borderRadius: 20,
        border: `1px solid ${GLASS_BORDER}`,
        background: GLASS_BG,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        flexDirection: 'column',
        paddingInline: 14,
        paddingBlock: hasTags ? 8 : 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow:
          '0 4px 24px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      }}
    >
      {/* Song Tags */}
      {hasTags && (
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: 6,
          }}
        >
          {songTags.map((tag) => (
            <div
              key={tag.id}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                paddingLeft: 10,
                paddingRight: 6,
                paddingBlock: 5,
                borderRadius: 14,
                background: SONG_TAG_BG,
                border: `1px solid ${SONG_TAG_BORDER}`,
                backdropFilter: 'blur(8px)',
                WebkitBackdropFilter: 'blur(8px)',
                maxWidth: '100%',
                boxShadow: '0 2px 8px rgba(34, 197, 94, 0.1)',
                transition: 'all 150ms ease',
              }}
              className="song-tag"
            >
              <IonIcon
                icon={musicalNotes}
                style={{
                  fontSize: 13,
                  color: SONG_TAG_ICON,
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: SONG_TAG_TEXT,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: 150,
                  letterSpacing: '0.01em',
                }}
              >
                {tag.title}
              </span>
              <button
                type="button"
                onClick={() => handleRemoveTag(tag.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 2,
                  margin: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: SONG_TAG_TEXT,
                  opacity: 0.7,
                  transition: 'all 150ms ease',
                  borderRadius: '50%',
                }}
                className="tag-remove-btn"
              >
                <IonIcon icon={closeCircle} style={{ fontSize: 17 }} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Text Input */}
      <div
        style={{
          flex: 1,
          minHeight: BASE_HEIGHT,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <IonTextarea
          ref={textareaRef}
          autoGrow={false}
          rows={1}
          value={value}
          placeholder={placeholder}
          onIonInput={handleChange}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          enterkeyhint="send"
          inputMode="text"
          style={
            {
              width: '100%',
              margin: 0,
              '--padding-start': '0px',
              '--padding-end': '0px',
              '--padding-top': '0px',
              '--padding-bottom': '0px',
              '--highlight-height': '0px',
              '--border-width': '0px',
              '--background': 'transparent',
              fontSize: 16,
              lineHeight: '36px',
              color: TEXT_PRIMARY,
              display: 'flex',
              alignItems: 'center',
              fontWeight: 400,
            } as React.CSSProperties
          }
          className="composer-textarea"
        />
      </div>

      <style>
        {`
    .composer-container:focus-within {
      border-color: ${GLASS_BORDER_FOCUS};
      box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12), 
                  0 0 0 3px rgba(34, 197, 94, 0.08),
                  inset 0 1px 0 rgba(255, 255, 255, 0.08);
    }
.song-tag:hover {
  background: rgba(236, 72, 153, 0.2);
  border-color: rgba(236, 72, 153, 0.5);
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.15);
}

.tag-remove-btn:hover {
  opacity: 1;
  background: rgba(236, 72, 153, 0.15);
  transform: scale(1.05);
}

    .tag-remove-btn:active {
      transform: scale(0.95);
    }
    
    .composer-textarea {
      --placeholder-opacity: 0.5;
      --placeholder-color: ${TEXT_SECONDARY};
    }
    
.composer-textarea textarea,
.composer-textarea .native-textarea {
  height: auto !important;
  min-height: 36px !important;
  max-height: 72px !important; /* Allow 2 lines */
  line-height: 20px !important; /* Smaller line-height = normal caret */
  padding: 8px 0 !important; /* Vertical padding to center single line */
  margin: 0 !important;
  resize: none !important;
  overflow-y: auto !important;
  font-weight: 400 !important;
  caret-color: ${GREEN_PRIMARY} !important;
}

.composer-textarea textarea::placeholder,
.composer-textarea .native-textarea::placeholder {
  line-height: 20px !important;
  color: ${TEXT_SECONDARY} !important;
  opacity: 0.5 !important;
}
    /* Green text selection */
    .composer-textarea textarea::selection,
    .composer-textarea .native-textarea::selection {
      background-color: rgba(34, 197, 94, 0.3);
      color: ${TEXT_PRIMARY};
    }

    /* Smooth scrollbar for tags overflow */
    .composer-container::-webkit-scrollbar {
      width: 4px;
    }

    .composer-container::-webkit-scrollbar-track {
      background: transparent;
    }

    .composer-container::-webkit-scrollbar-thumb {
      background: rgba(34, 197, 94, 0.3);
      border-radius: 2px;
    }

    .composer-container::-webkit-scrollbar-thumb:hover {
      background: rgba(34, 197, 94, 0.5);
    }
  `}
      </style>
    </div>
  );
}

export function hasContent(text: string, tags: SongTagData[]): boolean {
  return text.trim().length > 0 || tags.length > 0;
}

export function serializeMessage(text: string, tags: SongTagData[]): string {
  if (!tags.length) return text;
  // Changed from [@song:id|title] to [[song:id:title]]
  const tagMarkup = tags.map((t) => `[[song:${t.id}:${t.title}]]`).join(' ');
  return `${text.trim()} ${tagMarkup}`.trim();
}
