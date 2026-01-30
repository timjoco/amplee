-- ============================================================================
-- Vendor Jobs Feature - Database Schema
-- ============================================================================
-- This migration creates the tables for jobs (band-vendor engagements) and
-- the job chat functionality.
-- ============================================================================

-- 1. Vendor jobs table (the connection between band and vendor)
CREATE TABLE IF NOT EXISTS public.vendor_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parties involved
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Job details
  title TEXT NOT NULL,
  description TEXT,

  -- Optional: Link to an event (if booking for a specific show)
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,

  -- Dates
  event_date DATE,  -- When the gig/service would happen

  -- Status progression
  status TEXT NOT NULL DEFAULT 'inquiry'
    CHECK (status IN (
      'inquiry',      -- Band just reached out
      'quoted',       -- Vendor sent a quote
      'negotiating',  -- Back and forth on terms
      'accepted',     -- Both parties agreed
      'declined',     -- Either party declined
      'cancelled',    -- Cancelled after acceptance
      'completed',    -- Job finished
      'disputed'      -- Issue arose
    )),

  -- Financial
  quoted_amount DECIMAL(10, 2),
  final_amount DECIMAL(10, 2),
  currency TEXT DEFAULT 'USD',

  -- Timeline tracking
  quoted_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Metadata
  notes TEXT,  -- Internal notes

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for vendor jobs
CREATE INDEX IF NOT EXISTS idx_vendor_jobs_vendor_id ON public.vendor_jobs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_jobs_band_id ON public.vendor_jobs(band_id);
CREATE INDEX IF NOT EXISTS idx_vendor_jobs_status ON public.vendor_jobs(status);
CREATE INDEX IF NOT EXISTS idx_vendor_jobs_event_date ON public.vendor_jobs(event_date);
CREATE INDEX IF NOT EXISTS idx_vendor_jobs_created_by ON public.vendor_jobs(created_by);

-- 2. Job messages table (chat scoped to a specific job)
CREATE TABLE IF NOT EXISTS public.vendor_job_messages (
  id BIGSERIAL PRIMARY KEY,  -- Using BIGSERIAL like event_messages
  job_id UUID NOT NULL REFERENCES public.vendor_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,

  -- Optional: attachment support
  attachment_url TEXT,
  attachment_type TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for job messages
CREATE INDEX IF NOT EXISTS idx_vendor_job_messages_job_id ON public.vendor_job_messages(job_id);
CREATE INDEX IF NOT EXISTS idx_vendor_job_messages_created_at ON public.vendor_job_messages(job_id, created_at);

-- 3. Message reactions (following event_message_reactions pattern)
CREATE TABLE IF NOT EXISTS public.vendor_job_message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id BIGINT NOT NULL REFERENCES public.vendor_job_messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(message_id, user_id, emoji)
);

-- Index for reactions
CREATE INDEX IF NOT EXISTS idx_vendor_job_message_reactions_message_id ON public.vendor_job_message_reactions(message_id);

-- 4. Message read tracking
CREATE TABLE IF NOT EXISTS public.vendor_job_message_reads (
  job_id UUID NOT NULL REFERENCES public.vendor_jobs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (job_id, user_id)
);

-- 5. Reviews (after job completion)
CREATE TABLE IF NOT EXISTS public.vendor_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.vendor_jobs(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  reviewer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  body TEXT,

  -- Vendor can respond
  vendor_response TEXT,
  vendor_responded_at TIMESTAMPTZ,

  is_public BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- One review per job
  UNIQUE(job_id)
);

-- Indexes for reviews
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_vendor_id ON public.vendor_reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reviews_band_id ON public.vendor_reviews(band_id);

-- ============================================================================
-- Enable RLS
-- ============================================================================

ALTER TABLE public.vendor_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_job_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_job_message_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_job_message_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_reviews ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function to check if user is a job participant
-- (vendor owner OR band admin for the job's band)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_job_participant(p_job_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.vendor_jobs j
    WHERE j.id = p_job_id
      AND (
        -- Vendor owner
        EXISTS (SELECT 1 FROM public.vendors v WHERE v.id = j.vendor_id AND v.user_id = (SELECT auth.uid()))
        OR
        -- Band admin
        EXISTS (SELECT 1 FROM public.band_members bm WHERE bm.band_id = j.band_id AND bm.user_id = (SELECT auth.uid()) AND bm.role = 'admin')
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is the vendor owner for a job
CREATE OR REPLACE FUNCTION public.is_job_vendor_owner(p_job_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.vendor_jobs j
    JOIN public.vendors v ON v.id = j.vendor_id
    WHERE j.id = p_job_id AND v.user_id = (SELECT auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is a band admin for a job
CREATE OR REPLACE FUNCTION public.is_job_band_admin(p_job_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.vendor_jobs j
    JOIN public.band_members bm ON bm.band_id = j.band_id
    WHERE j.id = p_job_id
      AND bm.user_id = (SELECT auth.uid())
      AND bm.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS Policies - Vendor Jobs
-- ============================================================================

-- Participants can read jobs
CREATE POLICY "vendor_jobs: participants can read" ON public.vendor_jobs FOR SELECT
USING (public.is_job_participant(id));

-- Band admins can create jobs (inquiries)
CREATE POLICY "vendor_jobs: band admins can insert" ON public.vendor_jobs FOR INSERT
WITH CHECK (
  created_by = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.band_members bm
    WHERE bm.band_id = vendor_jobs.band_id
      AND bm.user_id = (SELECT auth.uid())
      AND bm.role = 'admin'
  )
);

-- Participants can update jobs
CREATE POLICY "vendor_jobs: participants can update" ON public.vendor_jobs FOR UPDATE
USING (public.is_job_participant(id));

-- ============================================================================
-- RLS Policies - Job Messages
-- ============================================================================

-- Participants can read messages
CREATE POLICY "vendor_job_messages: participants can read" ON public.vendor_job_messages FOR SELECT
USING (public.is_job_participant(job_id));

-- Participants can insert messages
CREATE POLICY "vendor_job_messages: participants can insert" ON public.vendor_job_messages FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND public.is_job_participant(job_id)
);

-- Users can update their own messages
CREATE POLICY "vendor_job_messages: users can update own" ON public.vendor_job_messages FOR UPDATE
USING (user_id = (SELECT auth.uid()));

-- Users can delete their own messages
CREATE POLICY "vendor_job_messages: users can delete own" ON public.vendor_job_messages FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- RLS Policies - Message Reactions
-- ============================================================================

-- Participants can read reactions
CREATE POLICY "vendor_job_message_reactions: participants can read" ON public.vendor_job_message_reactions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.vendor_job_messages m
  WHERE m.id = vendor_job_message_reactions.message_id
    AND public.is_job_participant(m.job_id)
));

-- Participants can insert reactions
CREATE POLICY "vendor_job_message_reactions: participants can insert" ON public.vendor_job_message_reactions FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.vendor_job_messages m
    WHERE m.id = vendor_job_message_reactions.message_id
      AND public.is_job_participant(m.job_id)
  )
);

-- Users can delete their own reactions
CREATE POLICY "vendor_job_message_reactions: users can delete own" ON public.vendor_job_message_reactions FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- RLS Policies - Message Reads
-- ============================================================================

-- Users can read their own read status
CREATE POLICY "vendor_job_message_reads: users can read own" ON public.vendor_job_message_reads FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- Participants can upsert their read status
CREATE POLICY "vendor_job_message_reads: participants can insert" ON public.vendor_job_message_reads FOR INSERT
WITH CHECK (
  user_id = (SELECT auth.uid())
  AND public.is_job_participant(job_id)
);

CREATE POLICY "vendor_job_message_reads: users can update own" ON public.vendor_job_message_reads FOR UPDATE
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- RLS Policies - Reviews
-- ============================================================================

-- Anyone can read public reviews
CREATE POLICY "vendor_reviews: public can read" ON public.vendor_reviews FOR SELECT
USING (is_public = true);

-- Job participants can read all reviews for their jobs
CREATE POLICY "vendor_reviews: participants can read" ON public.vendor_reviews FOR SELECT
USING (public.is_job_participant(job_id));

-- Band admins can insert reviews (after job completion)
CREATE POLICY "vendor_reviews: band admins can insert" ON public.vendor_reviews FOR INSERT
WITH CHECK (
  reviewer_user_id = (SELECT auth.uid())
  AND public.is_job_band_admin(job_id)
  -- Could add: AND job status = 'completed' via trigger instead
);

-- Reviewers can update their reviews
CREATE POLICY "vendor_reviews: reviewers can update" ON public.vendor_reviews FOR UPDATE
USING (reviewer_user_id = (SELECT auth.uid()));

-- Vendor owners can add responses to reviews
CREATE POLICY "vendor_reviews: vendor owners can respond" ON public.vendor_reviews FOR UPDATE
USING (public.is_vendor_owner(vendor_id));

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update updated_at for vendor_jobs
CREATE OR REPLACE FUNCTION public.update_vendor_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_jobs_updated_at
  BEFORE UPDATE ON public.vendor_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_jobs_updated_at();

-- Update updated_at for vendor_job_messages
CREATE OR REPLACE FUNCTION public.update_vendor_job_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_job_messages_updated_at
  BEFORE UPDATE ON public.vendor_job_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_job_messages_updated_at();

-- Trigger to update vendor stats when a job is completed
CREATE OR REPLACE FUNCTION public.update_vendor_job_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    UPDATE public.vendors
    SET total_jobs_completed = total_jobs_completed + 1
    WHERE id = NEW.vendor_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_job_completed_stats
  AFTER UPDATE ON public.vendor_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_job_stats();

-- Trigger to update vendor rating when a review is added
CREATE OR REPLACE FUNCTION public.update_vendor_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL(3, 2);
  total_reviews INT;
BEGIN
  SELECT AVG(rating)::DECIMAL(3, 2), COUNT(*)
  INTO avg_rating, total_reviews
  FROM public.vendor_reviews
  WHERE vendor_id = NEW.vendor_id AND is_public = true;

  UPDATE public.vendors
  SET average_rating = avg_rating, review_count = total_reviews
  WHERE id = NEW.vendor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendor_review_rating_update
  AFTER INSERT OR UPDATE ON public.vendor_reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendor_rating();

-- ============================================================================
-- Enable Realtime for chat
-- ============================================================================

ALTER TABLE public.vendor_job_messages REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'vendor_job_messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_job_messages;
  END IF;
END $$;

ALTER TABLE public.vendor_job_message_reactions REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'vendor_job_message_reactions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.vendor_job_message_reactions;
  END IF;
END $$;

-- ============================================================================
-- RPC Function to mark job messages as read
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mark_vendor_job_messages_read(p_job_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify user is a participant
  IF NOT public.is_job_participant(p_job_id) THEN
    RAISE EXCEPTION 'Not authorized to mark messages as read for this job';
  END IF;

  INSERT INTO public.vendor_job_message_reads (job_id, user_id, last_read_at)
  VALUES (p_job_id, (SELECT auth.uid()), now())
  ON CONFLICT (job_id, user_id)
  DO UPDATE SET last_read_at = now();
END;
$$;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE public.vendor_jobs IS 'Jobs/inquiries connecting bands to vendors for specific engagements';
COMMENT ON TABLE public.vendor_job_messages IS 'Chat messages scoped to a specific job';
COMMENT ON TABLE public.vendor_job_message_reactions IS 'Emoji reactions on job chat messages';
COMMENT ON TABLE public.vendor_job_message_reads IS 'Read status tracking for job chat';
COMMENT ON TABLE public.vendor_reviews IS 'Reviews left by bands after completing jobs with vendors';
