-- ============================================================================
-- DIAGNOSTIC: Check current state before applying fixes
-- Run this FIRST in Supabase SQL Editor to understand the current state
-- ============================================================================

-- 1. Check which views have SECURITY DEFINER (security_invoker = false)
SELECT
  n.nspname AS schema,
  c.relname AS view_name,
  pg_get_viewdef(c.oid, true) AS definition,
  CASE
    WHEN c.reloptions IS NULL THEN 'SECURITY DEFINER (default)'
    WHEN 'security_invoker=true' = ANY(c.reloptions) THEN 'SECURITY INVOKER'
    ELSE 'SECURITY DEFINER'
  END AS security_mode
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
  AND n.nspname = 'public'
  AND c.relname IN (
    'events_with_booking',
    'event_messages_enriched',
    'public_band_profiles',
    'event_last_messages',
    'events_with_my_attendance',
    'public_band_events'
  )
ORDER BY c.relname;

-- 2. Check RLS status on tables
SELECT
  schemaname,
  tablename,
  rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'event_setlist_items';

-- 3. Check existing policies on event_setlist_items
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual::text AS using_expression,
  with_check::text AS with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'event_setlist_items'
ORDER BY policyname;

-- 4. Check event_setlist_items table structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'event_setlist_items'
ORDER BY ordinal_position;
