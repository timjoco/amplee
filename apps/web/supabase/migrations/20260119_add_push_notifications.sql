-- ============================================================================
-- Push Notifications Infrastructure
-- ============================================================================
-- This migration creates the tables and functions needed for push notifications.
-- ============================================================================

-- 1. Push tokens table - stores device tokens for each user
CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
  device_id TEXT, -- optional unique device identifier
  is_active BOOLEAN DEFAULT true, -- can be set to false if token becomes invalid
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, token)
);

-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON public.push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON public.push_tokens(is_active) WHERE is_active = true;

-- 2. Enable RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies
-- Users can only see/manage their own tokens
CREATE POLICY "Users can view own push tokens"
  ON public.push_tokens FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push tokens"
  ON public.push_tokens FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push tokens"
  ON public.push_tokens FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push tokens"
  ON public.push_tokens FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can access all tokens (needed for sending notifications)
CREATE POLICY "Service role can access all push tokens"
  ON public.push_tokens FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 4. Function to upsert a push token (handles duplicates gracefully)
CREATE OR REPLACE FUNCTION public.upsert_push_token(
  p_token TEXT,
  p_platform TEXT,
  p_device_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID;
  v_token_id UUID;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Upsert the token
  INSERT INTO public.push_tokens (user_id, token, platform, device_id, is_active, updated_at)
  VALUES (v_user_id, p_token, p_platform, p_device_id, true, now())
  ON CONFLICT (user_id, token)
  DO UPDATE SET
    platform = EXCLUDED.platform,
    device_id = COALESCE(EXCLUDED.device_id, public.push_tokens.device_id),
    is_active = true,
    updated_at = now()
  RETURNING id INTO v_token_id;

  RETURN v_token_id;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_push_token(TEXT, TEXT, TEXT) TO authenticated;

-- 5. Function to deactivate a push token (e.g., on logout)
CREATE OR REPLACE FUNCTION public.deactivate_push_token(p_token TEXT)
RETURNS BOOLEAN
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

  UPDATE public.push_tokens
  SET is_active = false, updated_at = now()
  WHERE user_id = v_user_id AND token = p_token;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.deactivate_push_token(TEXT) TO authenticated;

-- 6. Function to get push tokens for band members (used by Edge Functions)
-- This is called by service_role when sending notifications
CREATE OR REPLACE FUNCTION public.get_band_member_push_tokens(
  p_band_id UUID,
  p_exclude_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  user_id UUID,
  token TEXT,
  platform TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT pt.user_id, pt.token, pt.platform
  FROM public.push_tokens pt
  INNER JOIN public.band_members bm ON bm.user_id = pt.user_id
  WHERE bm.band_id = p_band_id
    AND pt.is_active = true
    AND (p_exclude_user_id IS NULL OR pt.user_id != p_exclude_user_id);
END;
$$;

-- Only service_role should call this
REVOKE EXECUTE ON FUNCTION public.get_band_member_push_tokens(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_band_member_push_tokens(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.get_band_member_push_tokens(UUID, UUID) TO service_role;

-- 7. Notification log table (for debugging and analytics)
CREATE TABLE IF NOT EXISTS public.notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL, -- 'chat_message', 'new_event', etc.
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  band_id UUID REFERENCES public.bands(id) ON DELETE SET NULL,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  payload JSONB, -- the notification payload sent
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'delivered'
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying logs
CREATE INDEX IF NOT EXISTS idx_notification_log_created ON public.notification_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_log_recipient ON public.notification_log(recipient_user_id);

-- RLS for notification_log - users can see their own notifications
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification logs"
  ON public.notification_log FOR SELECT
  TO authenticated
  USING (auth.uid() = recipient_user_id);

CREATE POLICY "Service role can manage notification logs"
  ON public.notification_log FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE public.push_tokens IS 'Stores push notification tokens for user devices';
COMMENT ON TABLE public.notification_log IS 'Audit log of sent push notifications';
COMMENT ON FUNCTION public.upsert_push_token IS 'Register or update a push token for the current user';
COMMENT ON FUNCTION public.deactivate_push_token IS 'Deactivate a push token (e.g., on logout)';
COMMENT ON FUNCTION public.get_band_member_push_tokens IS 'Get active push tokens for all members of a band';
