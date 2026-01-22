/* eslint-disable @typescript-eslint/no-explicit-any */
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchProfile, getProfileSync } from '../../../../lib/cache/profileCache';
import { supabase } from '../../../../lib/supabase';
import type { ChatMsg } from '../components/ChatMessagesList';
import {
  hasContent,
  serializeMessage,
  type SongTagData,
} from '../components/ComposerInput';

import { useAuthUser } from './useAuthUser';
import { useChatKeyboardPadding } from './useChatKeyboardPadding';
import { useEventMessages } from './useEventMessages';
import { useEventReactions } from './useEventReactions';
import { useLinkPreviews } from './useLinkPreviews';
import { useLongPressHandlers } from './useLongPressHandlers';

type UseEventChatMobileArgs = {
  eventId: string;
  bandId?: string;
  isAdmin: boolean;
};

export function useEventChatMobile({
  eventId,
  bandId,
  isAdmin,
}: UseEventChatMobileArgs) {
  const navigate = useNavigate();

  // Mark messages as read when viewing this chat
  const markAsRead = useCallback(async () => {
    try {
      await supabase.rpc('mark_event_messages_read', { p_event_id: eventId });
    } catch (e) {
      console.error('[chat] Failed to mark as read:', e);
    }
  }, [eventId]);

  // Mark as read on mount and when app resumes
  useEffect(() => {
    // Mark as read on mount
    void markAsRead();

    // Also mark as read when app resumes from background
    const handleResume = () => void markAsRead();
    document.addEventListener('resume', handleResume);
    return () => document.removeEventListener('resume', handleResume);
  }, [markAsRead]);

  // Composer state
  const [inputText, setInputText] = useState('');
  const [songTags, setSongTags] = useState<SongTagData[]>([]);
  const [songPickerOpen, setSongPickerOpen] = useState(false);

  // Selection / action sheet
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [sheetMessageId, setSheetMessageId] = useState<string | null>(null);

  // Shared refs
  const profilesById = useRef<Map<string, any>>(new Map());
  const messagesRef = useRef<ChatMsg[]>([]);

  // Platform / layout
  const { composerPaddingBottom, keyboardHeight, isAndroid } =
    useChatKeyboardPadding();

  // Auth
  const { myUserId, userRef } = useAuthUser();

  // Link previews
  const { linkPreviews, fetchPreviewForMessage } = useLinkPreviews();

  // Haptics
  const triggerHaptic = useCallback(async () => {
    if (Capacitor.getPlatform() === 'web') return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (e) {
      console.warn('[haptics error]', e);
    }
  }, []);

  // Reactions
  const { reactions, myReactions, loadReactionsFor, toggleReaction } =
    useEventReactions({
      eventId,
      messagesRef,
      userRef,
    });

  // Messages (load, paginate, realtime, send/edit/delete)
  const {
    scrollContainerRef,
    bottomRef,
    messages,
    setMessages,
    loading,
    loadingMore,
    isEmpty,
    smartScrollToBottom,
  } = useEventMessages({
    eventId,
    profilesById,
    messagesRef,
    userRef,
    loadReactionsFor,
    fetchPreviewForMessage,
  });

  // Long-press → open action sheet + haptic
  const { handlePressStart, handlePressMove, handlePressEnd } =
    useLongPressHandlers({
      onLongPress: (id) => {
        setActiveMessageId(id);
        setSheetMessageId(id);
        void triggerHaptic();
      },
    });

  // Scroll when composer focuses
  const handleComposerFocus = useCallback(() => {
    smartScrollToBottom('smooth');
    setTimeout(() => smartScrollToBottom('smooth'), 300);
  }, [smartScrollToBottom]);

  const timeFmt = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        timeZone: 'America/Chicago',
        hour12: true,
      }),
    []
  );

  const hasInput = useMemo(
    () => hasContent(inputText, songTags),
    [inputText, songTags]
  );

  const handleSongTrigger = useCallback(() => {
    setSongPickerOpen(true);
  }, []);

  const handleSongSelect = useCallback(
    (song: { id: string; title: string }) => {
      setSongTags((prev) => [...prev, { id: song.id, title: song.title }]);
      setSongPickerOpen(false);
    },
    []
  );

  const handleSongPickerClose = useCallback(() => {
    setSongPickerOpen(false);
  }, []);

  const handleSongNavigate = useCallback(
    (songId: string) => {
      if (!bandId) return;
      navigate(`/bands/${bandId}/songs/${songId}`);
    },
    [bandId, navigate]
  );

  const send = useCallback(async () => {
    if (!hasContent(inputText, songTags)) return;
    const user = userRef.current;
    if (!user) return;

    const body = serializeMessage(inputText, songTags);
    const previousText = inputText;
    const previousTags = songTags;

    setInputText('');
    setSongTags([]);

    const userId = user.id as string;

    // Use centralized profile cache
    let me = profilesById.current.get(userId);
    if (!me) {
      me = getProfileSync(userId);
      if (me) {
        profilesById.current.set(userId, me);
      }
    }
    if (!me) {
      me = await fetchProfile(userId);
      if (me) {
        profilesById.current.set(userId, me);
      } else {
        me = { id: userId };
      }
    }

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: ChatMsg = {
      id: optimisticId,
      event_id: eventId,
      user_id: userId,
      body,
      created_at: new Date().toISOString(),
      profiles: me,
      status: 'sending',
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    smartScrollToBottom('smooth');

    const { error } = await supabase
      .from('event_messages')
      .insert({ event_id: eventId, user_id: userId, body });

    if (error) {
      console.error('[chat send error]', error);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === optimisticId ? { ...m, status: 'failed' as const } : m
        )
      );
      setInputText(previousText);
      setSongTags(previousTags);
    } else {
      window.dispatchEvent(
        new CustomEvent('amplee:event-message-updated', {
          detail: { eventId },
        })
      );
    }
  }, [inputText, songTags, eventId, smartScrollToBottom]);

  const sheetMsg =
    sheetMessageId != null
      ? messages.find((m) => m.id === sheetMessageId) || null
      : null;

  const canEdit =
    !!sheetMsg && myUserId != null && sheetMsg.user_id === myUserId;

  const canDelete =
    !!sheetMsg &&
    (isAdmin || (myUserId != null && sheetMsg.user_id === myUserId));

  const activeMessage =
    activeMessageId != null
      ? messages.find((m) => m.id === activeMessageId) ?? null
      : null;

  const handleMessageActionClose = useCallback(() => {
    setActiveMessageId(null);
  }, []);

  const handleMessageDelete = useCallback(async () => {
    if (!activeMessageId || !canDelete) return;
    const id = activeMessageId;

    setMessages((prev) => prev.filter((m) => m.id !== id));

    const { error } = await supabase
      .from('event_messages')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[chat delete error]', error);
    } else {
      window.dispatchEvent(
        new CustomEvent('amplee:event-message-updated', {
          detail: { eventId },
        })
      );
    }

    setActiveMessageId(null);
  }, [activeMessageId, canDelete, eventId, setMessages]);

  const handleMessageReact = useCallback(
    (emoji: string) => {
      if (!activeMessageId) return;
      void toggleReaction(activeMessageId, emoji);
    },
    [activeMessageId, toggleReaction]
  );

  const handleMessageEdit = useCallback(
    (messageId: string, newBody: string) => {
      const id = messageId;

      setMessages((prev) =>
        prev.map((m) => (m.id === id ? { ...m, body: newBody } : m))
      );

      void (async () => {
        const { error } = await supabase
          .from('event_messages')
          .update({ body: newBody })
          .eq('id', id);

        if (error) {
          console.error('[chat edit error]', error);
        } else {
          window.dispatchEvent(
            new CustomEvent('amplee:event-message-updated', {
              detail: { eventId },
            })
          );
        }
      })();
    },
    [eventId, setMessages]
  );

  return {
    // Refs / layout
    scrollContainerRef,
    bottomRef,
    composerPaddingBottom,
    isAndroid,

    // Messages + list
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

    // Composer
    inputText,
    songTags,
    hasInput,
    setInputText,
    setSongTags,
    handleSongTrigger,
    handleComposerFocus,
    send,

    // Song picker
    songPickerOpen,
    handleSongPickerClose,
    handleSongSelect,

    // Action sheet
    sheetMsg,
    canEdit,
    canDelete,
    activeMessage,
    handleMessageActionClose,
    handleMessageDelete,
    handleMessageReact,
    handleMessageEdit,
  };
}
