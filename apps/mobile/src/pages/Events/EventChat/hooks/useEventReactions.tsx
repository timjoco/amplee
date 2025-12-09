import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../../lib/supabase';

type ReactionRow = {
  message_id: number;
  user_id: string;
  emoji: string;
};

type Args = {
  eventId: string;
  messagesRef: React.MutableRefObject<{ id: string }[]>;
  userRef: React.MutableRefObject<any>;
};

export function useEventReactions({ eventId, messagesRef, userRef }: Args) {
  const [reactions, setReactions] = useState<
    Record<string, Record<string, number>>
  >({});
  const [myReactions, setMyReactions] = useState<
    Record<string, Record<string, true>>
  >({});

  const loadReactionsFor = useCallback(
    async (messageIds: string[]) => {
      const numericIds = messageIds.map(Number).filter(Number.isFinite);
      if (numericIds.length === 0) return;

      const { data, error } = await supabase
        .from('event_message_reactions')
        .select('message_id, emoji, user_id')
        .in('message_id', numericIds);

      if (error) {
        console.error('[reactions load error]', error);
        return;
      }

      const rows = (data ?? []) as ReactionRow[];
      const byMsg: Record<string, Record<string, number>> = {};
      const mine: Record<string, Record<string, true>> = {};
      const me = userRef.current?.id as string | undefined;

      for (const row of rows) {
        const mid = String(row.message_id);
        const emoji = row.emoji;

        byMsg[mid] ||= {};
        byMsg[mid][emoji] = (byMsg[mid][emoji] || 0) + 1;

        if (me && row.user_id === me) {
          mine[mid] ||= {};
          mine[mid][emoji] = true as const;
        }
      }

      setReactions((prev) => ({ ...prev, ...byMsg }));
      setMyReactions((prev) => ({ ...prev, ...mine }));
    },
    [userRef]
  );

  // Realtime reactions
  useEffect(() => {
    const channel = supabase
      .channel(`event:${eventId}:reactions`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'event_message_reactions',
        },
        (payload) => {
          const base = (payload.new ??
            payload.old) as Partial<ReactionRow> | null;
          if (!base || typeof base.message_id !== 'number') return;

          const mid = String(base.message_id);
          const hasMessage = messagesRef.current.some((m) => m.id === mid);
          if (!hasMessage) return;

          const me = userRef.current?.id as string | undefined;
          if (me && base.user_id === me) return;

          if (payload.eventType === 'INSERT') {
            const row = payload.new as ReactionRow;
            const emoji = row.emoji;

            setReactions((prev) => {
              const curr = { ...(prev[mid] || {}) };
              curr[emoji] = (curr[emoji] || 0) + 1;
              return { ...prev, [mid]: curr };
            });
          }

          if (payload.eventType === 'DELETE') {
            const row = payload.old as ReactionRow;
            const emoji = row.emoji;

            setReactions((prev) => {
              const curr = { ...(prev[mid] || {}) };
              const nextCount = Math.max(0, (curr[emoji] || 1) - 1);
              if (nextCount <= 0) delete curr[emoji];
              else curr[emoji] = nextCount;
              return { ...prev, [mid]: curr };
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [eventId, messagesRef, userRef]);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const numericId = Number(messageId);
      if (!Number.isFinite(numericId)) return;

      const me = userRef.current?.id as string | undefined;
      if (!me) return;

      const iHadItBefore = !!myReactions[messageId]?.[emoji];

      setReactions((prev) => {
        const curr = { ...(prev[messageId] || {}) };
        const next = (curr[emoji] || 0) + (iHadItBefore ? -1 : 1);
        if (next <= 0) delete curr[emoji];
        else curr[emoji] = next;
        return { ...prev, [messageId]: curr };
      });

      setMyReactions((prev) => {
        const mine = { ...(prev[messageId] || {}) };
        if (iHadItBefore) delete mine[emoji];
        else mine[emoji] = true as const;
        return { ...prev, [messageId]: mine };
      });

      if (iHadItBefore) {
        const { error } = await supabase
          .from('event_message_reactions')
          .delete()
          .match({ message_id: numericId, user_id: me, emoji });

        if (error) {
          console.error('[reaction delete error]', error);
          setReactions((prev) => {
            const curr = { ...(prev[messageId] || {}) };
            curr[emoji] = (curr[emoji] || 0) + 1;
            return { ...prev, [messageId]: curr };
          });
          setMyReactions((prev) => {
            const mine = { ...(prev[messageId] || {}) };
            mine[emoji] = true as const;
            return { ...prev, [messageId]: mine };
          });
        }
      } else {
        const { error } = await supabase
          .from('event_message_reactions')
          .upsert(
            { message_id: numericId, user_id: me, emoji },
            { onConflict: 'message_id,user_id,emoji' }
          );

        if (error) {
          console.error('[reaction upsert error]', error);
          setReactions((prev) => {
            const curr = { ...(prev[messageId] || {}) };
            const next = Math.max(0, (curr[emoji] || 1) - 1);
            if (next <= 0) delete curr[emoji];
            else curr[emoji] = next;
            return { ...prev, [messageId]: curr };
          });
          setMyReactions((prev) => {
            const mine = { ...(prev[messageId] || {}) };
            delete mine[emoji];
            return { ...prev, [messageId]: mine };
          });
        }
      }
    },
    [myReactions, userRef]
  );

  return { reactions, myReactions, loadReactionsFor, toggleReaction };
}
