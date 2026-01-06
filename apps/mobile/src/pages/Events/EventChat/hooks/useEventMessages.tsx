/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { supabase } from '../../../../lib/supabase';
import type { ChatMsg } from '../components/ChatMessagesList';

const INITIAL_LOAD_COUNT = 50;
const MESSAGES_PER_PAGE = 50;

type Args = {
  eventId: string;
  profilesById: MutableRefObject<Map<string, any>>;
  messagesRef: MutableRefObject<ChatMsg[]>;
  userRef: MutableRefObject<any>;
  loadReactionsFor: (ids: string[]) => Promise<void> | void;
  fetchPreviewForMessage: (msg: ChatMsg) => Promise<void> | void;
};

// Manages the event chat message list: initial fetch, pagination, realtime inserts,
// profile hydration, and scroll-to-bottom behavior, exposing messages + layout refs.
export function useEventMessages({
  eventId,
  profilesById,
  messagesRef,
  userRef,
  loadReactionsFor,
  fetchPreviewForMessage,
}: Args) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const didInitialScrollRef = useRef(false);

  // Refs for callbacks used in realtime subscription to avoid re-subscriptions
  const fetchPreviewRef = useRef(fetchPreviewForMessage);
  fetchPreviewRef.current = fetchPreviewForMessage;

  messagesRef.current = messages;

  const isNearBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 150;
  }, []);

  const smartScrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const container = scrollContainerRef.current;
      if (!container) return;
      if (!isNearBottom()) return;
      container.scrollTop = container.scrollHeight;
      bottomRef.current?.scrollIntoView({ behavior, block: 'end' });
    },
    [isNearBottom]
  );

  // Ref for smartScrollToBottom to use in realtime callback
  const smartScrollRef = useRef(smartScrollToBottom);
  smartScrollRef.current = smartScrollToBottom;

  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMoreMessages || messagesRef.current.length === 0) {
      return;
    }

    setLoadingMore(true);

    const oldestMessage = messagesRef.current[0];
    const oldestTimestamp = oldestMessage.created_at;

    const { data, error } = await supabase
      .from('event_messages')
      .select(
        `
      id, event_id, user_id, body, created_at,
      profiles:profiles!event_messages_user_id_fkey (
        id, display_name, avatar_url, updated_at
      )
    `
      )
      .eq('event_id', eventId)
      .lt('created_at', oldestTimestamp)
      .order('created_at', { ascending: false })
      .limit(MESSAGES_PER_PAGE);

    if (error) {
      console.error('[load more error]', error);
      setLoadingMore(false);
      return;
    }

    if (!data || data.length === 0) {
      setHasMoreMessages(false);
      setLoadingMore(false);
      return;
    }

    (data ?? []).forEach((m: any) => {
      if (m.profiles?.id) profilesById.current.set(m.profiles.id, m.profiles);
    });

    const normalized = (data as any[]).map((m) => ({
      ...m,
      id: String(m.id),
      status: 'sent' as const,
    })) as ChatMsg[];

    const reversed = normalized.reverse();

    setMessages((prev) => [...reversed, ...prev]);
    setHasMoreMessages(data.length === MESSAGES_PER_PAGE);

    const ids = reversed.map((m) => m.id);
    if (ids.length) {
      void loadReactionsFor(ids);
      reversed.forEach((msg) => {
        void fetchPreviewForMessage(msg);
      });
    }

    setLoadingMore(false);
  }, [
    eventId,
    loadingMore,
    hasMoreMessages,
    messagesRef,
    profilesById,
    loadReactionsFor,
    fetchPreviewForMessage,
  ]);

  const handleScrollRef = useRef<(() => void) | null>(null);
  handleScrollRef.current = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    if (el.scrollTop < 200) {
      void loadMoreMessages();
    }
  }, [loadMoreMessages]);

  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;

    const scrollHandler = () => handleScrollRef.current?.();
    el.addEventListener('scroll', scrollHandler);
    return () => {
      el.removeEventListener('scroll', scrollHandler);
    };
  }, []);

  // Initial load
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('event_messages')
        .select(
          `
        id, event_id, user_id, body, created_at,
        profiles:profiles!event_messages_user_id_fkey (
          id, display_name, avatar_url, updated_at
        )
      `
        )
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })
        .limit(INITIAL_LOAD_COUNT);

      if (!alive) return;

      if (error) {
        console.error('[chat load error]', error);
        setLoading(false);
        return;
      }

      (data ?? []).forEach((m: any) => {
        if (m.profiles?.id) profilesById.current.set(m.profiles.id, m.profiles);
      });

      const normalized = ((data as any[]) ?? []).map((m) => ({
        ...m,
        id: String(m.id),
        status: 'sent' as const,
      })) as ChatMsg[];

      const reversed = normalized.reverse();

      setMessages(reversed);
      setHasMoreMessages((data ?? []).length === INITIAL_LOAD_COUNT);
      didInitialScrollRef.current = false;
      setLoading(false);

      const ids = reversed.map((m) => m.id);
      if (ids.length) {
        void loadReactionsFor(ids);
        reversed.forEach((msg) => {
          void fetchPreviewForMessage(msg);
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [eventId, profilesById, loadReactionsFor, fetchPreviewForMessage]);

  // Initial scroll to bottom
  useEffect(() => {
    if (!loading && !didInitialScrollRef.current && messages.length > 0) {
      didInitialScrollRef.current = true;
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({
          behavior: 'auto',
          block: 'end',
        });
      }, 30);
    }
  }, [loading, messages.length]);

  // Realtime inserts - only depends on eventId to avoid re-subscriptions
  useEffect(() => {
    const ch = supabase
      .channel(`event:${eventId}:insert`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'event_messages',
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const row = payload.new as ChatMsg;

          let prof = profilesById.current.get(row.user_id);
          if (!prof) {
            const { data } = await supabase
              .from('profiles')
              .select('id, display_name, avatar_url, updated_at')
              .eq('id', row.user_id)
              .single();
            if (data) {
              prof = data;
              profilesById.current.set(row.user_id, prof);
            }
          }

          const enriched: ChatMsg = {
            ...row,
            id: String(row.id),
            profiles: prof,
            status: 'sent',
          };

          setMessages((prev) => {
            const idx = prev.findIndex(
              (m) =>
                String(m.id).startsWith('optimistic-') &&
                m.user_id === row.user_id &&
                m.body === row.body &&
                Math.abs(
                  new Date(m.created_at).getTime() -
                    new Date(row.created_at).getTime()
                ) < 10_000
            );
            if (idx !== -1) {
              const next = prev.slice();
              next[idx] = enriched;
              return next;
            }
            return [...prev, enriched];
          });

          // Use refs to call latest callbacks without having them in deps
          void fetchPreviewRef.current(enriched);
          smartScrollRef.current('smooth');
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
    };
  }, [eventId, profilesById]);

  const isEmpty = !loading && messages.length === 0;

  return {
    scrollContainerRef,
    bottomRef,
    messages,
    setMessages,
    loading,
    loadingMore,
    isEmpty,
    smartScrollToBottom,
  };
}
