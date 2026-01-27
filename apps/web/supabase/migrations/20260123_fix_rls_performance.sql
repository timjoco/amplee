-- Fix RLS Performance Issues - Part 1: Remove Redundancies
-- This migration removes duplicate indexes and redundant RLS policies

-- ============================================================
-- PART 1: Drop duplicate indexes
-- ============================================================

-- band_members: keep band_memberships_band_idx, drop duplicate
DROP INDEX IF EXISTS band_memberships_band_id_idx;

-- band_members: keep band_members_band_user_idx, drop duplicates
DROP INDEX IF EXISTS idx_band_members_band_user;
DROP INDEX IF EXISTS idx_band_memberships_band_user;

-- band_members: keep band_memberships_user_idx, drop duplicate
DROP INDEX IF EXISTS band_memberships_user_id_idx;

-- band_members: keep band_members_user_band_idx, drop duplicates
DROP INDEX IF EXISTS idx_band_members_user_band;
DROP INDEX IF EXISTS idx_band_memberships_user_band;

-- band_members: keep band_memberships_pkey, drop duplicate unique constraint
-- (This is a constraint, not just an index, so we drop the constraint)
ALTER TABLE band_members DROP CONSTRAINT IF EXISTS band_members_band_user_unique;

-- event_attendance: keep event_attendance_pkey, drop duplicate unique constraint
ALTER TABLE event_attendance DROP CONSTRAINT IF EXISTS event_attendance_event_user_uniq;

-- event_message_reactions: keep emr_message_idx, drop duplicate
DROP INDEX IF EXISTS idx_emr_message_id;

-- setlist_template_items: keep idx_setlist_template_items_template_order, drop duplicate
DROP INDEX IF EXISTS setlist_template_items_template_idx;


-- ============================================================
-- PART 2: Drop duplicate RLS policies (keeping the better-named ones)
-- ============================================================

-- band_genres: remove old-style named policies, keep newer snake_case ones
DROP POLICY IF EXISTS "band_genres: delete if admin_or_editor" ON band_genres;
DROP POLICY IF EXISTS "band_genres: insert if admin_or_editor" ON band_genres;
DROP POLICY IF EXISTS "band_genres: select if member" ON band_genres;

-- bands: remove duplicate public select policy
DROP POLICY IF EXISTS "bands: public can read public rows" ON bands;

-- event_attendance: consolidate to single policies per action
-- NOTE: Keep "ea: insert admin" - needed for creating attendance records when events are created
DROP POLICY IF EXISTS "ea: select members" ON event_attendance;
DROP POLICY IF EXISTS "insert own attendance if band member" ON event_attendance;
DROP POLICY IF EXISTS "update own attendance" ON event_attendance;

-- events: remove duplicate public select policies
DROP POLICY IF EXISTS "public can read public events" ON events;
DROP POLICY IF EXISTS "events: select band" ON events;

-- member_availability_dates: keep band-wide view policy
DROP POLICY IF EXISTS "Members can view own availability" ON member_availability_dates;

-- profiles: keep snake_case policy
DROP POLICY IF EXISTS "User can update own profile" ON profiles;

-- setlist tables: keep admin_all policies - they are needed for INSERT/UPDATE/DELETE
-- (members_read only covers SELECT, not write operations)

-- event_members: consolidate insert/update policies
DROP POLICY IF EXISTS "Members can insert their own event row" ON event_members;
DROP POLICY IF EXISTS "Members can update their own event status" ON event_members;

-- event_messages: consolidate delete policies
DROP POLICY IF EXISTS "em: delete own" ON event_messages;
