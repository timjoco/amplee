import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchProfile,
  getProfileSync,
  setProfiles,
  type ProfileLite,
} from '../../../../lib/cache/profileCache';
import { supabase } from '../../../../lib/supabase';
import type { TourMessageWithUser } from '../types/tourTypes';

const MESSAGES_PER_PAGE = 50;

export function useTourChat(tourId: string | undefined) {
  const [messages, setMessages] = useState<TourMessageWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [myUserId, setMyUserId] = useState<string | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  // Local profile cache for quick lookups
  const profilesById = useRef<Map<string, ProfileLite>>(new Map());

  // Get current user
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setMyUserId(data.user?.id ?? null);
    });
  }, []);

  // Load messages
  const loadMessages = useCallback(async () => {
    if (!tourId) return;

    setLoading(true);
    try {
      // Note: updated_at column may not exist until migration is run
      // Query without it first, then try with it
      let data: any[] | null = null;
      let error: any = null;

      // Try with updated_at first
      const result = await supabase
        .from('tour_messages')
        .select(`
          id, tour_id, user_id, content, created_at, updated_at,
          profiles (
            id, first_name, last_name, display_name, avatar_url, updated_at
          )
        `)
        .eq('tour_id', tourId)
        .order('created_at', { ascending: true })
        .limit(MESSAGES_PER_PAGE);

      if (result.error?.code === '42703') {
        // Column doesn't exist yet, fall back to query without updated_at
        const fallback = await supabase
          .from('tour_messages')
          .select(`
            id, tour_id, user_id, content, created_at,
            profiles (
              id, first_name, last_name, display_name, avatar_url, updated_at
            )
          `)
          .eq('tour_id', tourId)
          .order('created_at', { ascending: true })
          .limit(MESSAGES_PER_PAGE);

        data = fallback.data;
        error = fallback.error;
      } else {
        data = result.data;
        error = result.error;
      }

      if (error) {
        console.error('Failed to load tour messages:', error);
        return;
      }

      // Cache profiles from joined data
      const profiles = (data || [])
        .map((m: any) => m.profiles)
        .filter((p: any) => p?.id);
      if (profiles.length > 0) {
        setProfiles(profiles);
        profiles.forEach((p: ProfileLite) => profilesById.current.set(p.id, p));
      }

      const mapped: TourMessageWithUser[] = (data || []).map((m: any) => ({
        id: m.id,
        tour_id: m.tour_id,
        user_id: m.user_id,
        content: m.content,
        created_at: m.created_at,
        updated_at: m.updated_at,
        user: m.profiles || null,
        status: 'sent' as const,
      }));

      setMessages(mapped);

      // Scroll to bottom after load
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'auto' });
      }, 100);
    } finally {
      setLoading(false);
    }
  }, [tourId]);

  // Initial load
  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  // Realtime subscription
  useEffect(() => {
    if (!tourId) return;

    const channel = supabase
      .channel(`tour_messages:${tourId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tour_messages',
          filter: `tour_id=eq.${tourId}`,
        },
        async (payload) => {
          const newMsg = payload.new as any;

          // Check local ref first, then centralized cache, then fetch
          let prof = profilesById.current.get(newMsg.user_id);
          if (!prof) {
            prof = getProfileSync(newMsg.user_id) ?? undefined;
            if (prof) {
              profilesById.current.set(newMsg.user_id, prof);
            }
          }
          if (!prof) {
            prof = (await fetchProfile(newMsg.user_id)) ?? undefined;
            if (prof) {
              profilesById.current.set(newMsg.user_id, prof);
            }
          }

          const mappedMsg: TourMessageWithUser = {
            id: newMsg.id,
            tour_id: newMsg.tour_id,
            user_id: newMsg.user_id,
            content: newMsg.content,
            created_at: newMsg.created_at,
            updated_at: newMsg.updated_at,
            user: prof || null,
            status: 'sent',
          };

          setMessages((prev) => {
            // Check if this is replacing an optimistic message
            const idx = prev.findIndex(
              (m) =>
                String(m.id).startsWith('optimistic-') &&
                m.user_id === newMsg.user_id &&
                m.content === newMsg.content &&
                Math.abs(
                  new Date(m.created_at).getTime() -
                    new Date(newMsg.created_at).getTime()
                ) < 10_000
            );
            if (idx !== -1) {
              // Replace optimistic with real message
              const next = prev.slice();
              next[idx] = mappedMsg;
              return next;
            }

            // Avoid duplicates
            if (prev.some((m) => m.id === mappedMsg.id)) return prev;
            return [...prev, mappedMsg];
          });

          // Scroll to bottom for new messages
          setTimeout(() => {
            bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tour_messages',
          filter: `tour_id=eq.${tourId}`,
        },
        (payload) => {
          const updated = payload.new as any;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === updated.id
                ? { ...m, content: updated.content, updated_at: updated.updated_at }
                : m
            )
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'tour_messages',
          filter: `tour_id=eq.${tourId}`,
        },
        (payload) => {
          const deletedId = (payload.old as any).id;
          setMessages((prev) => prev.filter((m) => m.id !== deletedId));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tourId]);

  // Send message with optimistic update
  const sendMessage = useCallback(
    async (content: string) => {
      if (!tourId || !myUserId || !content.trim() || sending) return;

      const trimmedContent = content.trim();

      // Get my profile for optimistic message
      let myProfile = profilesById.current.get(myUserId);
      if (!myProfile) {
        myProfile = getProfileSync(myUserId) ?? undefined;
        if (myProfile) {
          profilesById.current.set(myUserId, myProfile);
        }
      }
      if (!myProfile) {
        myProfile = (await fetchProfile(myUserId)) ?? undefined;
        if (myProfile) {
          profilesById.current.set(myUserId, myProfile);
        }
      }

      // Create optimistic message
      const optimisticId = `optimistic-${Date.now()}`;
      const optimisticMsg: TourMessageWithUser = {
        id: optimisticId,
        tour_id: tourId,
        user_id: myUserId,
        content: trimmedContent,
        created_at: new Date().toISOString(),
        updated_at: null,
        user: myProfile || null,
        status: 'sending',
      };

      // Add optimistic message immediately
      setMessages((prev) => [...prev, optimisticMsg]);

      // Scroll to bottom
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);

      setSending(true);
      try {
        const { error } = await supabase.from('tour_messages').insert({
          tour_id: tourId,
          user_id: myUserId,
          content: trimmedContent,
        });

        if (error) {
          console.error('Failed to send message:', error);
          // Mark as failed
          setMessages((prev) =>
            prev.map((m) =>
              m.id === optimisticId ? { ...m, status: 'failed' as const } : m
            )
          );
        }
        // On success, realtime will replace the optimistic message
      } finally {
        setSending(false);
      }
    },
    [tourId, myUserId, sending]
  );

  // Delete message
  const deleteMessage = useCallback(
    async (messageId: string) => {
      // Optimistic delete
      setMessages((prev) => prev.filter((m) => m.id !== messageId));

      const { error } = await supabase
        .from('tour_messages')
        .delete()
        .eq('id', messageId);

      if (error) {
        console.error('Failed to delete message:', error);
        // Reload to restore if delete failed
        loadMessages();
      }
    },
    [loadMessages]
  );

  // Edit message
  const editMessage = useCallback(
    async (messageId: string, newContent: string) => {
      const trimmed = newContent.trim();
      if (!trimmed) return;

      // Optimistic update
      const now = new Date().toISOString();
      setMessages((prev) =>
        prev.map((m) =>
          m.id === messageId ? { ...m, content: trimmed, updated_at: now } : m
        )
      );

      const { error } = await supabase
        .from('tour_messages')
        .update({ content: trimmed })
        .eq('id', messageId);

      if (error) {
        console.error('Failed to edit message:', error);
        // Reload to restore if edit failed
        loadMessages();
      }
    },
    [loadMessages]
  );

  return {
    messages,
    loading,
    sending,
    myUserId,
    scrollContainerRef,
    bottomRef,
    sendMessage,
    deleteMessage,
    editMessage,
    reload: loadMessages,
  };
}
