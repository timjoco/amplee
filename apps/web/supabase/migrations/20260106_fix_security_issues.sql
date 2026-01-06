-- ============================================================================
-- SECURITY FIX: Convert SECURITY DEFINER views to SECURITY INVOKER
-- and enable RLS on tables
-- ============================================================================
-- Run this in the Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- PART 1: Fix SECURITY DEFINER Views
-- ============================================================================
-- These views currently bypass RLS of the querying user. We convert them to
-- SECURITY INVOKER so that RLS policies on underlying tables are respected.
--
-- For Postgres 15+ (Supabase default), we use ALTER VIEW.
-- ============================================================================

-- 1. events_with_my_attendance (ACTIVELY USED - filters events user can see)
ALTER VIEW public.events_with_my_attendance SET (security_invoker = on);

-- 2. event_last_messages (ACTIVELY USED - shows last message preview)
ALTER VIEW public.event_last_messages SET (security_invoker = on);

-- 3. event_messages_enriched (may not be actively used)
ALTER VIEW public.event_messages_enriched SET (security_invoker = on);

-- 4. events_with_booking (may not be actively used)
ALTER VIEW public.events_with_booking SET (security_invoker = on);

-- 5. public_band_profiles (INTENTIONALLY PUBLIC - keep as SECURITY DEFINER if needed)
-- NOTE: If this view is meant to show public band info to unauthenticated users,
-- you may want to SKIP this one. Uncomment only if it should respect RLS:
-- ALTER VIEW public.public_band_profiles SET (security_invoker = on);

-- 6. public_band_events (INTENTIONALLY PUBLIC - keep as SECURITY DEFINER if needed)
-- NOTE: Same as above - if this shows public events, keep SECURITY DEFINER.
-- ALTER VIEW public.public_band_events SET (security_invoker = on);


-- ============================================================================
-- PART 2: Enable RLS on Tables
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 2A. event_setlist_items - Enable RLS and create policies
-- ----------------------------------------------------------------------------
-- This table stores setlist items for events. Access should be restricted to
-- band members who have access to the event.

ALTER TABLE public.event_setlist_items ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT - Band members can view setlist items for events they're invited to
CREATE POLICY "Band members can view event setlist items"
ON public.event_setlist_items
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.event_members em
    JOIN public.events e ON e.id = em.event_id
    WHERE em.event_id = event_setlist_items.event_id
      AND em.user_id = auth.uid()
  )
);

-- Policy: INSERT - Band members can add setlist items to events they're invited to
CREATE POLICY "Band members can insert event setlist items"
ON public.event_setlist_items
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.event_members em
    WHERE em.event_id = event_setlist_items.event_id
      AND em.user_id = auth.uid()
  )
);

-- Policy: UPDATE - Band members can update setlist items for their events
CREATE POLICY "Band members can update event setlist items"
ON public.event_setlist_items
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.event_members em
    WHERE em.event_id = event_setlist_items.event_id
      AND em.user_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.event_members em
    WHERE em.event_id = event_setlist_items.event_id
      AND em.user_id = auth.uid()
  )
);

-- Policy: DELETE - Band admins can delete setlist items
CREATE POLICY "Band admins can delete event setlist items"
ON public.event_setlist_items
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.event_members em
    JOIN public.events e ON e.id = em.event_id
    JOIN public.band_members bm ON bm.band_id = e.band_id AND bm.user_id = auth.uid()
    WHERE em.event_id = event_setlist_items.event_id
      AND bm.role = 'admin'
  )
);


-- ----------------------------------------------------------------------------
-- 2B. song_sheets - UNUSED TABLE
-- ----------------------------------------------------------------------------
-- This table is not used in the application. Options:
-- Option A: Drop the table entirely (recommended if truly unused)
-- Option B: Enable RLS with no policies (blocks all access)

-- Option A: Drop unused table
DROP TABLE IF EXISTS public.song_sheets;

-- Option B: If you want to keep the table but block access, use this instead:
-- ALTER TABLE public.song_sheets ENABLE ROW LEVEL SECURITY;
-- (No policies = no access)


-- ============================================================================
-- VERIFICATION QUERIES (run after migration to confirm)
-- ============================================================================
-- Check view security settings:
-- SELECT schemaname, viewname, definition
-- FROM pg_views
-- WHERE viewname IN ('events_with_my_attendance', 'event_last_messages', 'event_messages_enriched', 'events_with_booking', 'public_band_profiles', 'public_band_events');

-- Check RLS is enabled:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE tablename IN ('event_setlist_items', 'song_sheets');

-- Check policies:
-- SELECT tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE tablename IN ('event_setlist_items', 'song_sheets');
