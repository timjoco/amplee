/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo } from 'react';
import { SongPickerModal } from '../../../components/SongPickerModal';
import { MessageActionSheet } from '../EventChat/components/MessageActionSheet';
import { ChatComposerBar } from './components/ChatComposerBar';
import { ChatMessagesList } from './components/ChatMessagesList';
import { useChatKeyboardPadding } from './hooks/useChatKeyboardPadding';
import { useEventChatMobile } from './hooks/useEventChatMobile';

function ChatTabMobileInner({
  eventId,
  bandId,
  isAdmin,
}: {
  eventId: string;
  bandId?: string;
  isAdmin: boolean;
}) {
  const {
    scrollContainerRef,
    bottomRef,
    composerPaddingBottom,
    isAndroid,

    loading,
    loadingMore,
    isEmpty,
    messages,
    activeMessageId,
    timeFmt,
    linkPreviews,
    reactions,
    myReactions,
    handlePressStart,
    handlePressMove,
    handlePressEnd,
    handleSongNavigate,
    toggleReaction,

    inputText,
    songTags,
    hasInput,
    setInputText,
    setSongTags,
    handleSongTrigger,
    handleComposerFocus,
    send,

    songPickerOpen,
    handleSongPickerClose,
    handleSongSelect,

    sheetMsg,
    canEdit,
    canDelete,
    activeMessage,
    handleMessageActionClose,
    handleMessageDelete,
    handleMessageReact,
    handleMessageEdit,
  } = useEventChatMobile({ eventId, bandId, isAdmin });

  const { keyboardHeight } = useChatKeyboardPadding();

  return (
    <div
      style={{
        position: 'sticky',
        height: '100%',
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        background: '#050509',
      }}
    >
      <div
        ref={scrollContainerRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: '8px 0 12px',
          paddingBottom: isAndroid && keyboardHeight > 0 ? 80 : 12,
        }}
      >
        <ChatMessagesList
          loading={loading}
          loadingMore={loadingMore}
          isEmpty={isEmpty}
          messages={messages}
          activeMessageId={activeMessageId}
          timeFmt={timeFmt}
          linkPreviews={linkPreviews}
          reactions={reactions}
          myReactions={myReactions}
          bottomRef={bottomRef}
          handlePressStart={handlePressStart}
          handlePressMove={handlePressMove}
          handlePressEnd={handlePressEnd}
          handleSongNavigate={handleSongNavigate}
          toggleReaction={toggleReaction}
        />
      </div>

      {sheetMsg && (
        <MessageActionSheet
          open={!!activeMessageId}
          message={activeMessage}
          canEdit={canEdit}
          canDelete={canDelete}
          onClose={handleMessageActionClose}
          onDelete={handleMessageDelete}
          onReact={handleMessageReact}
          onEdit={handleMessageEdit}
        />
      )}

      <SongPickerModal
        isOpen={songPickerOpen}
        bandId={bandId}
        onClose={handleSongPickerClose}
        onSelect={handleSongSelect}
      />

      <ChatComposerBar
        inputText={inputText}
        songTags={songTags}
        hasInput={hasInput}
        composerPaddingBottom={composerPaddingBottom}
        isAndroid={isAndroid}
        onInputChange={setInputText}
        onSongTagsChange={setSongTags}
        onSongTrigger={handleSongTrigger}
        onFocus={handleComposerFocus}
        onSend={send}
      />
    </div>
  );
}

export default memo(ChatTabMobileInner);
