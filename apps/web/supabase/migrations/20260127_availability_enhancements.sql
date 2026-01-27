-- Availability Enhancements Migration
-- Adds support for:
-- 1. Specific time ranges (not just full days)
-- 2. Weekly recurring patterns
-- 3. Notes for unavailability

-- ============================================================
-- PART 1: Modify member_availability_dates table
-- ============================================================

-- Add new columns to existing table
ALTER TABLE member_availability_dates
ADD COLUMN IF NOT EXISTS all_day BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS start_time TIME,
ADD COLUMN IF NOT EXISTS end_time TIME,
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual';

-- Add constraint for source values
ALTER TABLE member_availability_dates
DROP CONSTRAINT IF EXISTS member_availability_dates_source_check;

ALTER TABLE member_availability_dates
ADD CONSTRAINT member_availability_dates_source_check
CHECK (source IN ('manual', 'recurring'));

-- Add constraint: if not all_day, times must be provided
ALTER TABLE member_availability_dates
DROP CONSTRAINT IF EXISTS member_availability_dates_times_check;

ALTER TABLE member_availability_dates
ADD CONSTRAINT member_availability_dates_times_check
CHECK (all_day = true OR (start_time IS NOT NULL AND end_time IS NOT NULL));

-- ============================================================
-- PART 2: Create member_availability_rules table
-- ============================================================

CREATE TABLE IF NOT EXISTS member_availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rule_type TEXT NOT NULL DEFAULT 'weekly',
  day_of_week INTEGER,  -- 0=Sunday, 1=Monday, ..., 6=Saturday (for weekly rules)
  all_day BOOLEAN DEFAULT true,
  start_time TIME,
  end_time TIME,
  note TEXT,
  starts_on DATE NOT NULL DEFAULT CURRENT_DATE,
  ends_on DATE,  -- NULL = indefinite
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Constraints
  CONSTRAINT member_availability_rules_type_check CHECK (rule_type IN ('weekly')),
  CONSTRAINT member_availability_rules_dow_check CHECK (
    rule_type != 'weekly' OR (day_of_week >= 0 AND day_of_week <= 6)
  ),
  CONSTRAINT member_availability_rules_times_check CHECK (
    all_day = true OR (start_time IS NOT NULL AND end_time IS NOT NULL)
  ),
  CONSTRAINT member_availability_rules_dates_check CHECK (
    ends_on IS NULL OR ends_on >= starts_on
  )
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_member_availability_rules_profile_dow
ON member_availability_rules(profile_id, day_of_week);

CREATE INDEX IF NOT EXISTS idx_member_availability_rules_profile_dates
ON member_availability_rules(profile_id, starts_on, ends_on);

-- ============================================================
-- PART 3: RLS Policies for member_availability_rules
-- ============================================================

ALTER TABLE member_availability_rules ENABLE ROW LEVEL SECURITY;

-- Users can insert their own rules
DROP POLICY IF EXISTS "Users can insert own rules" ON member_availability_rules;
CREATE POLICY "Users can insert own rules" ON member_availability_rules FOR INSERT
WITH CHECK ((select auth.uid()) = profile_id);

-- Users can update their own rules
DROP POLICY IF EXISTS "Users can update own rules" ON member_availability_rules;
CREATE POLICY "Users can update own rules" ON member_availability_rules FOR UPDATE
USING ((select auth.uid()) = profile_id)
WITH CHECK ((select auth.uid()) = profile_id);

-- Users can delete their own rules
DROP POLICY IF EXISTS "Users can delete own rules" ON member_availability_rules;
CREATE POLICY "Users can delete own rules" ON member_availability_rules FOR DELETE
USING ((select auth.uid()) = profile_id);

-- Band members can view rules of their bandmates (same pattern as dates)
DROP POLICY IF EXISTS "Band members can view member rules" ON member_availability_rules;
CREATE POLICY "Band members can view member rules" ON member_availability_rules FOR SELECT
USING (EXISTS (
  SELECT 1 FROM band_members me
  JOIN band_members them ON me.band_id = them.band_id
  WHERE me.user_id = (select auth.uid()) AND them.user_id = member_availability_rules.profile_id
));

-- ============================================================
-- PART 4: Add update policy for member_availability_dates (for notes/times)
-- ============================================================

DROP POLICY IF EXISTS "Members can update own availability" ON member_availability_dates;
CREATE POLICY "Members can update own availability" ON member_availability_dates FOR UPDATE
USING ((select auth.uid()) = profile_id)
WITH CHECK ((select auth.uid()) = profile_id);

-- ============================================================
-- PART 5: Updated_at trigger for rules table
-- ============================================================

CREATE OR REPLACE FUNCTION update_member_availability_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS member_availability_rules_updated_at ON member_availability_rules;
CREATE TRIGGER member_availability_rules_updated_at
BEFORE UPDATE ON member_availability_rules
FOR EACH ROW
EXECUTE FUNCTION update_member_availability_rules_updated_at();
