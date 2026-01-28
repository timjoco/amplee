-- ============================================================================
-- Fix Push Token Ownership
-- ============================================================================
-- When a user registers a push token, deactivate it for any other users first.
-- A device token can only belong to one user at a time, so if User B logs into
-- a device where User A was previously logged in, User A should stop receiving
-- notifications on that device.
-- ============================================================================

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

  -- IMPORTANT: Deactivate this token for any OTHER users first.
  -- A device token can only belong to one user at a time.
  -- This prevents the bug where User A logs out, User B logs in on the same device,
  -- and User A still receives notifications meant for that device.
  UPDATE public.push_tokens
  SET is_active = false, updated_at = now()
  WHERE token = p_token
    AND user_id != v_user_id
    AND is_active = true;

  -- Upsert the token for the current user
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

-- Add an index to speed up the token lookup for deactivation
CREATE INDEX IF NOT EXISTS idx_push_tokens_token ON public.push_tokens(token);

COMMENT ON FUNCTION public.upsert_push_token IS 'Register or update a push token for the current user. Deactivates the token for any other users first.';
