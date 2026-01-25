import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../../../lib/supabase';

export const REACTION_EMOJIS = [
  '👍', '❤️', '😂', '👀', '🔥', '🎉', '🙏', '👏',
  '😮', '😢', '😡', '💯', '🤘', '⭐️',
];

type ReactionCounts = Record<string, Record<string, number>>; // messageId -> emoji -> count
type MyReactions = Record<string, Record<string, true>>; // messageId -> emoji -> true

export function useTourReactions(tourId: string | undefined) {
  const [reactions, setReactions] = useState<ReactionCounts>({});
  const [myReactions, setMyReactions] = useState<MyReactions>({});
  const userRef = useRef<string | null>(null);

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      userRef.current = data.user?.id ?? null;
    });
  }, []);

  // Load reactions for specific message IDs
  const loadReactionsFor = useCallback(async (messageIds: string[]) => {
    // Filter out optimistic message IDs (not valid UUIDs)
    const validIds = messageIds.filter((id) => !id.startsWith('optimistic-'));
    if (!validIds.length) return;

    const me = userRef.current;

    const { data, error } = await supabase
      .from('tour_message_reactions')
      .select('message_id, user_id, emoji')
      .in('message_id', validIds);

    // Table might not exist yet if migration hasn't run
    if (error) {
      if (error.code === 'PGRST205' || error.code === '42P01') {
        // Table doesn't exist yet, silently skip
        return;
      }
      console.error('Failed to load tour reactions:', error);
      return;
    }

    const counts: ReactionCounts = {};
    const mine: MyReactions = {};

    for (const r of data || []) {
      const msgId = r.message_id;
      const emoji = r.emoji;

      if (!counts[msgId]) counts[msgId] = {};
      counts[msgId][emoji] = (counts[msgId][emoji] || 0) + 1;

      if (r.user_id === me) {
        if (!mine[msgId]) mine[msgId] = {};
        mine[msgId][emoji] = true;
      }
    }

    setReactions((prev) => ({ ...prev, ...counts }));
    setMyReactions((prev) => ({ ...prev, ...mine }));
  }, []);

  // Realtime subscription for reactions
  useEffect(() => {
    if (!tourId) return;

    const channel = supabase
      .channel(`tour_reactions:${tourId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tour_message_reactions',
        },
        (payload) => {
          const r = payload.new as { message_id: string; user_id: string; emoji: string };
          const me = userRef.current;

          // Skip if this is our own reaction (already handled optimistically)
          if (r.user_id === me) return;

          setReactions((prev) => {
            const msgReactions = { ...(prev[r.message_id] || {}) };
            msgReactions[r.emoji] = (msgReactions[r.emoji] || 0) + 1;
            return { ...prev, [r.message_id]: msgReactions };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tour_message_reactions',
        },
        (payload) => {
          const r = payload.old as { message_id: string; user_id: string; emoji: string };
          const me = userRef.current;

          // Skip if this is our own reaction (already handled optimistically)
          if (r.user_id === me) return;

          setReactions((prev) => {
            const msgReactions = { ...(prev[r.message_id] || {}) };
            const newCount = (msgReactions[r.emoji] || 0) - 1;
            if (newCount <= 0) {
              delete msgReactions[r.emoji];
            } else {
              msgReactions[r.emoji] = newCount;
            }
            return { ...prev, [r.message_id]: msgReactions };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tourId]);

  // Toggle reaction (add or remove)
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const me = userRef.current;
      if (!me) return;

      const iHadItBefore = !!myReactions[messageId]?.[emoji];

      // Optimistic update
      setReactions((prev) => {
        const msgReactions = { ...(prev[messageId] || {}) };
        const newCount = (msgReactions[emoji] || 0) + (iHadItBefore ? -1 : 1);
        if (newCount <= 0) {
          delete msgReactions[emoji];
        } else {
          msgReactions[emoji] = newCount;
        }
        return { ...prev, [messageId]: msgReactions };
      });

      setMyReactions((prev) => {
        const mine = { ...(prev[messageId] || {}) };
        if (iHadItBefore) {
          delete mine[emoji];
        } else {
          mine[emoji] = true;
        }
        return { ...prev, [messageId]: mine };
      });

      // Database call
      if (iHadItBefore) {
        const { error } = await supabase
          .from('tour_message_reactions')
          .delete()
          .match({ message_id: messageId, user_id: me, emoji });

        if (error) {
          // Silently skip if table doesn't exist yet
          if (error.code === 'PGRST205' || error.code === '42P01') return;
          console.error('Failed to remove reaction:', error);
          // Revert optimistic update
          setReactions((prev) => {
            const msgReactions = { ...(prev[messageId] || {}) };
            msgReactions[emoji] = (msgReactions[emoji] || 0) + 1;
            return { ...prev, [messageId]: msgReactions };
          });
          setMyReactions((prev) => ({
            ...prev,
            [messageId]: { ...(prev[messageId] || {}), [emoji]: true },
          }));
        }
      } else {
        const { error } = await supabase
          .from('tour_message_reactions')
          .upsert(
            { message_id: messageId, user_id: me, emoji },
            { onConflict: 'message_id,user_id,emoji' }
          );

        if (error) {
          // Silently skip if table doesn't exist yet
          if (error.code === 'PGRST205' || error.code === '42P01') return;
          console.error('Failed to add reaction:', error);
          // Revert optimistic update
          setReactions((prev) => {
            const msgReactions = { ...(prev[messageId] || {}) };
            const newCount = (msgReactions[emoji] || 0) - 1;
            if (newCount <= 0) {
              delete msgReactions[emoji];
            } else {
              msgReactions[emoji] = newCount;
            }
            return { ...prev, [messageId]: msgReactions };
          });
          setMyReactions((prev) => {
            const mine = { ...(prev[messageId] || {}) };
            delete mine[emoji];
            return { ...prev, [messageId]: mine };
          });
        }
      }
    },
    [myReactions]
  );

  return {
    reactions,
    myReactions,
    toggleReaction,
    loadReactionsFor,
  };
}
