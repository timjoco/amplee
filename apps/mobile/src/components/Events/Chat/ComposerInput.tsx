import { IonIcon } from '@ionic/react';
import { closeCircle, musicalNotes } from 'ionicons/icons';
import {
  ClipboardEvent,
  KeyboardEvent,
  useCallback,
  useEffect,
  useRef,
} from 'react';

export type SongTagData = {
  id: string;
  title: string;
};

type ComposerInputProps = {
  value: string;
  songTags: SongTagData[];
  placeholder?: string;
  onValueChange: (value: string) => void;
  onSongTagsChange: (tags: SongTagData[]) => void;
  onSongTrigger: () => void;
  onFocus?: () => void;
  onSubmit?: () => void;
};

export function ComposerInput({
  value,
  songTags,
  placeholder = 'Message the band…',
  onValueChange,
  onSongTagsChange,
  onSongTrigger,
  onFocus,
  onSubmit,
}: ComposerInputProps) {
  const inputRef = useRef<HTMLDivElement>(null);
  const isComposingRef = useRef(false);

  // Focus the editable div
  const focusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.focus();
      // Move cursor to end
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(inputRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, []);

  // Handle text input
  const handleInput = useCallback(() => {
    if (isComposingRef.current) return;

    const el = inputRef.current;
    if (!el) return;

    const text = el.innerText || '';

    // Check for @songs trigger
    if (/@songs\s*$/i.test(text)) {
      // Remove the trigger text
      const cleaned = text.replace(/@songs\s*$/i, '');
      onValueChange(cleaned);
      el.innerText = cleaned;
      onSongTrigger();
      // Move cursor to end after cleaning
      setTimeout(focusInput, 0);
    } else {
      onValueChange(text);
    }
  }, [onValueChange, onSongTrigger, focusInput]);

  // Handle composition (for IME input)
  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(() => {
    isComposingRef.current = false;
    handleInput();
  }, [handleInput]);

  // Handle keyboard events
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      // Submit on Enter (without shift)
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSubmit?.();
        return;
      }

      // Handle backspace to remove last tag if cursor is at start
      if (e.key === 'Backspace' && songTags.length > 0) {
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          // Check if cursor is at the very start of the text input
          if (
            range.startOffset === 0 &&
            range.collapsed &&
            (!value || value.length === 0)
          ) {
            e.preventDefault();
            // Remove last tag
            onSongTagsChange(songTags.slice(0, -1));
          }
        }
      }
    },
    [onSubmit, songTags, value, onSongTagsChange]
  );

  // Handle paste - strip formatting
  const handlePaste = useCallback((e: ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  }, []);

  // Remove a specific song tag
  const removeTag = useCallback(
    (tagId: string) => {
      onSongTagsChange(songTags.filter((t) => t.id !== tagId));
      setTimeout(focusInput, 0);
    },
    [songTags, onSongTagsChange, focusInput]
  );

  // Sync external value changes to the contentEditable
  useEffect(() => {
    const el = inputRef.current;
    if (el && el.innerText !== value) {
      el.innerText = value;
    }
  }, [value]);

  const isEmpty = !value && songTags.length === 0;

  return (
    <div
      onClick={focusInput}
      style={{
        flex: 1,
        minHeight: 44,
        maxHeight: 120,
        borderRadius: 12,
        background: 'rgba(52, 211, 153, 0.04)',
        border: '1px solid rgba(60, 61, 68, 0.89)',
        paddingInline: 12,
        paddingBlock: 10,
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: 6,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        overflowY: 'auto',
        cursor: 'text',
      }}
    >
      {/* Song tag chips */}
      {songTags.map((tag) => (
        <span
          key={tag.id}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            background: 'rgba(236, 72, 153, 0.15)',
            border: '1px solid rgba(236, 72, 153, 0.4)',
            borderRadius: 8,
            padding: '4px 6px 4px 8px',
            color: '#EC4899',
            fontSize: 14,
            fontWeight: 600,
            flexShrink: 0,
            maxWidth: '100%',
          }}
        >
          <IonIcon
            icon={musicalNotes}
            style={{
              fontSize: 13,
              opacity: 0.9,
              flexShrink: 0,
            }}
          />
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {tag.title}
          </span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              removeTag(tag.id);
            }}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 0,
              marginLeft: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: 'rgba(236, 72, 153, 0.7)',
              flexShrink: 0,
            }}
          >
            <IonIcon icon={closeCircle} style={{ fontSize: 16 }} />
          </button>
        </span>
      ))}

      {/* Editable text area */}
      <div style={{ flex: 1, minWidth: 100, position: 'relative' }}>
        {isEmpty && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              color: '#9ca3af',
              fontSize: 16,
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {placeholder}
          </div>
        )}
        <div
          ref={inputRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          onFocus={onFocus}
          onCompositionStart={handleCompositionStart}
          onCompositionEnd={handleCompositionEnd}
          style={{
            outline: 'none',
            color: '#e5e7eb',
            fontSize: 16,
            minHeight: 24,
            lineHeight: '24px',
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
          }}
        />
      </div>
    </div>
  );
}

// Helper to serialize tags + text into the message body format
export function serializeMessage(
  text: string,
  songTags: SongTagData[]
): string {
  const tagStrings = songTags.map((tag) => `[[song:${tag.id}:${tag.title}]]`);
  const parts = [...tagStrings];
  if (text.trim()) {
    parts.push(text.trim());
  }
  return parts.join(' ');
}

// Helper to check if there's any content
export function hasContent(text: string, songTags: SongTagData[]): boolean {
  return text.trim().length > 0 || songTags.length > 0;
}
