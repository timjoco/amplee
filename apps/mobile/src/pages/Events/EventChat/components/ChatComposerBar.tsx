/* eslint-disable @typescript-eslint/no-explicit-any */
import { IonIcon } from '@ionic/react';
import { send as sendIcon } from 'ionicons/icons';
import {
  ComposerInput,
  SongTagData,
} from '../../EventChat/components/ComposerInput';

type ChatComposerBarProps = {
  inputText: string;
  songTags: SongTagData[];
  hasInput: boolean;
  composerPaddingBottom: number | string;
  isAndroid: boolean;
  onInputChange: (value: string) => void;
  onSongTagsChange: (tags: SongTagData[]) => void;
  onSongTrigger: () => void;
  onFocus: () => void;
  onSend: () => void;
};

const IOS_KEYBOARD_TRANSITION =
  'padding-bottom 280ms cubic-bezier(0.17, 0.59, 0.4, 0.77)';

export function ChatComposerBar({
  inputText,
  songTags,
  hasInput,
  composerPaddingBottom,
  isAndroid,
  onInputChange,
  onSongTagsChange,
  onSongTrigger,
  onFocus,
  onSend,
}: ChatComposerBarProps) {
  const keyboardOpen =
    isAndroid &&
    typeof composerPaddingBottom === 'number' &&
    composerPaddingBottom > 20;

  return (
    <div
      style={{
        borderTop: '1px solid rgba(60, 61, 68, 0.25)',
        width: '100%',
        marginInline: 0,
        backdropFilter: 'blur(10px)',
        background: '#050509',
        transition: isAndroid ? IOS_KEYBOARD_TRANSITION : 'none',
        ...(keyboardOpen
          ? {
              position: 'fixed' as const,
              bottom: 0, // <-- pin to very bottom
              left: 0,
              right: 0,
              zIndex: 100,
              paddingBottom: composerPaddingBottom, // <-- push content up from bottom
            }
          : {
              paddingBottom: composerPaddingBottom,
            }),
      }}
    >
      <div
        style={{
          paddingTop: 10,
          paddingInline: 10,
          paddingBottom: 4,
          display: 'flex',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        <ComposerInput
          value={inputText}
          songTags={songTags}
          placeholder="Message the band..."
          onValueChange={onInputChange}
          onSongTagsChange={onSongTagsChange}
          onSongTrigger={onSongTrigger}
          onFocus={onFocus}
          onSubmit={onSend}
        />

        <button
          type="button"
          onClick={onSend}
          aria-label="Send message"
          disabled={!hasInput}
          style={{
            width: 44,
            height: 47,
            borderRadius: 12,
            border: hasInput
              ? '1px solid rgba(52, 211, 153, 0.5)'
              : '1px solid rgba(148, 163, 184, 0.3)',
            background: hasInput
              ? 'rgba(52, 211, 153, 0.95)'
              : 'rgba(15, 23, 42, 0.8)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
            boxShadow: hasInput ? '0 4px 16px rgba(52, 211, 153, 0.4)' : 'none',
            color: hasInput ? '#000000' : '#9ca3af',
            cursor: 'pointer',
            transform: hasInput ? 'scale(1)' : 'scale(0.95)',
            opacity: hasInput ? 1 : 0.6,
            transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <IonIcon icon={sendIcon} style={{ fontSize: 20 }} />
        </button>
      </div>
    </div>
  );
}
