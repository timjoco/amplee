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

// iOS dark keyboard colors
const IOS_KEYBOARD_BG = '#1C1C1E';
const IOS_INPUT_BG = '#2C2C2E';
const IOS_BORDER = '#3A3A3C';

// Song tag colors (pink theme for music)
const SONG_TAG_BG = 'rgba(236, 72, 153, 0.15)';
const SONG_TAG_BORDER = 'rgba(236, 72, 153, 0.4)';
const SONG_TAG_TEXT = '#F472B6';

// Base height we want (to match the 47px send button)
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
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: BASE_HEIGHT,
        maxHeight: hasTags ? 140 : BASE_HEIGHT,
        borderRadius: 18,
        border: `1px solid ${isIOS ? IOS_BORDER : 'rgba(15, 50, 98, 0.7)'}`,
        background: isIOS ? IOS_INPUT_BG : 'rgba(15, 23, 42, 0.9)',
        display: 'flex',
        flexDirection: 'column',
        paddingInline: 14,
        paddingBlock: hasTags ? 8 : 0,
        boxSizing: 'border-box',
        overflow: 'hidden',
        transition: 'max-height 150ms ease',
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
                gap: 4,
                paddingLeft: 8,
                paddingRight: 4,
                paddingBlock: 4,
                borderRadius: 12,
                background: SONG_TAG_BG,
                border: `1px solid ${SONG_TAG_BORDER}`,
                maxWidth: '100%',
              }}
            >
              <IonIcon
                icon={musicalNotes}
                style={{
                  fontSize: 12,
                  color: SONG_TAG_TEXT,
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
                  padding: 0,
                  margin: 0,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: SONG_TAG_TEXT,
                  opacity: 0.7,
                  transition: 'opacity 150ms ease',
                }}
              >
                <IonIcon icon={closeCircle} style={{ fontSize: 16 }} />
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
              color: '#F1F5F9', // slate-100 for readable text
              display: 'flex',
              alignItems: 'center',
            } as React.CSSProperties
          }
          className="composer-textarea"
        />
      </div>

      <style>
        {`
    .composer-textarea {
      --placeholder-opacity: 0.6;
      --placeholder-color: #94A3B8;
    }
    
    .composer-textarea textarea,
    .composer-textarea .native-textarea {
      height: 36px !important;
      min-height: 36px !important;
      max-height: 36px !important;
      line-height: 36px !important;
      padding: 0 !important;
      margin: 0 !important;
      resize: none !important;
      overflow: hidden !important;
    }
    
    .composer-textarea textarea::placeholder,
    .composer-textarea .native-textarea::placeholder {
      line-height: 36px !important;
      color: #94A3B8 !important;
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
