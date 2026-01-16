-- ============================================================================
-- Add delete_auth_user RPC function for account deletion
-- ============================================================================
-- This function handles complete deletion of a user from all auth tables.
-- Called by the delete-account edge function.
-- ============================================================================

-- Create the function with SECURITY DEFINER to allow deletion from auth schema
-- Only callable by service role
CREATE OR REPLACE FUNCTION public.delete_auth_user(target_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Delete from auth tables in correct order (respecting foreign keys)

  -- 1. Delete refresh tokens (references sessions)
  DELETE FROM auth.refresh_tokens WHERE user_id = target_user_id;

  -- 2. Delete sessions
  DELETE FROM auth.sessions WHERE user_id = target_user_id;

  -- 3. Delete identities (OAuth connections)
  DELETE FROM auth.identities WHERE user_id = target_user_id;

  -- 4. Delete MFA factors if they exist
  DELETE FROM auth.mfa_factors WHERE user_id = target_user_id;

  -- 5. Delete one-time tokens if table exists
  BEGIN
    DELETE FROM auth.one_time_tokens WHERE user_id = target_user_id;
  EXCEPTION WHEN undefined_table THEN
    -- Table doesn't exist, skip
  END;

  -- 6. Finally delete the user
  DELETE FROM auth.users WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE NOTICE 'User % was not found in auth.users', target_user_id;
  END IF;
END;
$$;

-- Revoke execute from public and anon - only service role should call this
REVOKE EXECUTE ON FUNCTION public.delete_auth_user(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_auth_user(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_auth_user(UUID) FROM authenticated;

-- Grant execute only to service_role
GRANT EXECUTE ON FUNCTION public.delete_auth_user(UUID) TO service_role;

-- Add a comment explaining the function's purpose
COMMENT ON FUNCTION public.delete_auth_user(UUID) IS
'Deletes a user from auth.users. Only callable by service_role. Used as fallback in delete-account edge function.';
