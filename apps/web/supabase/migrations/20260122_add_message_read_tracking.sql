-- ============================================================================
-- Message Read Tracking
-- ============================================================================
-- Tracks the last time each user read messages in an event chat.
-- Used to show unread indicators similar to Discord.
-- ============================================================================

-- 1. Read tracking table
CREATE TABLE IF NOT EXISTS public.event_message_reads (
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (event_id, user_id)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_message_reads_user
  ON public.event_message_reads(user_id);

-- 2. Enable RLS
ALTER TABLE public.event_message_reads ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
CREATE POLICY "Users can view own read status"
  ON public.event_message_reads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own read status"
  ON public.event_message_reads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own read status"
  ON public.event_message_reads FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Function to mark event as read
CREATE OR REPLACE FUNCTION public.mark_event_messages_read(p_event_id UUID)
RETURNS TIMESTAMPTZ
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_now TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_now := now();

  INSERT INTO public.event_message_reads (event_id, user_id, last_read_at)
  VALUES (p_event_id, v_user_id, v_now)
  ON CONFLICT (event_id, user_id)
  DO UPDATE SET last_read_at = v_now;

  RETURN v_now;
END;
$$;

GRANT EXECUTE ON FUNCTION public.mark_event_messages_read(UUID) TO authenticated;

-- 5. Function to get unread counts for multiple events
CREATE OR REPLACE FUNCTION public.get_event_unread_counts(p_event_ids UUID[])
RETURNS TABLE (
  event_id UUID,
  unread_count BIGINT,
  last_message_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  RETURN QUERY
  SELECT
    em.event_id,
    COUNT(*)::BIGINT AS unread_count,
    MAX(em.created_at) AS last_message_at
  FROM public.event_messages em
  LEFT JOIN public.event_message_reads emr
    ON em.event_id = emr.event_id AND emr.user_id = v_user_id
  WHERE em.event_id = ANY(p_event_ids)
    AND em.created_at > COALESCE(emr.last_read_at, '1970-01-01'::TIMESTAMPTZ)
    AND em.user_id != v_user_id  -- Don't count own messages as unread
  GROUP BY em.event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_event_unread_counts(UUID[]) TO authenticated;

-- 6. Comments
COMMENT ON TABLE public.event_message_reads IS 'Tracks when users last read messages in each event chat';
COMMENT ON FUNCTION public.mark_event_messages_read IS 'Mark all messages in an event as read for the current user';
COMMENT ON FUNCTION public.get_event_unread_counts IS 'Get unread message counts for a list of events';
