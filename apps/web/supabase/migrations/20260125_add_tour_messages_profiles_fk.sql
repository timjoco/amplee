-- Add foreign key from tour_messages to profiles for nested select support
-- This allows Supabase to join tour_messages with profiles in queries

-- Add the foreign key constraint
-- Note: profiles.id mirrors auth.users.id, so this is safe
ALTER TABLE public.tour_messages
ADD CONSTRAINT tour_messages_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Add a comment explaining the relationship
COMMENT ON CONSTRAINT tour_messages_user_id_profiles_fkey ON public.tour_messages
IS 'Foreign key to profiles for nested select support. The user_id already references auth.users, but this FK enables Supabase embedded queries with profiles.';
