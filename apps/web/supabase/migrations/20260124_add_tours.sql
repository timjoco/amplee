-- ============================================================================
-- Tours Feature - Database Schema
-- ============================================================================
-- This migration creates the tables for managing band tours with stops,
-- financials, chat, and file attachments.
-- ============================================================================

-- 1. Main tours table
CREATE TABLE IF NOT EXISTS public.tours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  currency TEXT DEFAULT 'USD',
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for tours
CREATE INDEX IF NOT EXISTS idx_tours_band_id ON public.tours(band_id);
CREATE INDEX IF NOT EXISTS idx_tours_status ON public.tours(status);
CREATE INDEX IF NOT EXISTS idx_tours_start_date ON public.tours(start_date);

-- 2. Tour members table (roster members selected for this tour)
CREATE TABLE IF NOT EXISTS public.tour_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(tour_id, user_id)
);

-- Indexes for tour_members
CREATE INDEX IF NOT EXISTS idx_tour_members_tour_id ON public.tour_members(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_members_user_id ON public.tour_members(user_id);

-- 3. Tour stops table (individual venues/dates on the tour)
CREATE TABLE IF NOT EXISTS public.tour_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,

  -- Date/times
  date DATE NOT NULL,
  load_in_time TIME,
  sound_check_time TIME,
  doors_time TIME,
  set_time TIME,
  curfew_time TIME,

  -- Venue info
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  venue_city TEXT,
  venue_state TEXT,
  venue_country TEXT DEFAULT 'USA',
  venue_capacity INT,
  venue_phone TEXT,
  venue_website TEXT,

  -- Promoter contact
  promoter_name TEXT,
  promoter_email TEXT,
  promoter_phone TEXT,

  -- Production contact
  production_contact_name TEXT,
  production_contact_email TEXT,
  production_contact_phone TEXT,

  -- Lodging
  hotel_name TEXT,
  hotel_address TEXT,
  hotel_confirmation TEXT,
  hotel_check_in TIME,
  hotel_check_out TIME,

  -- Travel
  travel_departure_location TEXT,
  travel_departure_time TIME,
  travel_method TEXT CHECK (travel_method IS NULL OR travel_method IN ('van', 'bus', 'flight', 'train', 'other')),
  travel_notes TEXT,

  -- Hospitality
  backline_provided BOOLEAN DEFAULT false,
  catering_notes TEXT,
  green_room_notes TEXT,

  -- General
  notes TEXT,
  status TEXT DEFAULT 'confirmed' CHECK (status IN ('tentative', 'confirmed', 'cancelled')),
  order_index INT NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for tour_stops
CREATE INDEX IF NOT EXISTS idx_tour_stops_tour_id ON public.tour_stops(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_stops_date ON public.tour_stops(date);

-- 4. Tour stop financials table
CREATE TABLE IF NOT EXISTS public.tour_stop_financials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_stop_id UUID NOT NULL REFERENCES public.tour_stops(id) ON DELETE CASCADE,

  -- Income
  guarantee_amount DECIMAL(10, 2),
  door_deal_percentage DECIMAL(5, 2),
  merch_sales DECIMAL(10, 2),
  other_income DECIMAL(10, 2),
  other_income_notes TEXT,

  -- Expenses
  hotel_cost DECIMAL(10, 2),
  travel_cost DECIMAL(10, 2),
  food_per_diem DECIMAL(10, 2),
  equipment_rental DECIMAL(10, 2),
  parking_tolls DECIMAL(10, 2),
  other_expenses DECIMAL(10, 2),
  other_expenses_notes TEXT,

  -- Settlement
  actual_payout DECIMAL(10, 2),
  is_settled BOOLEAN DEFAULT false,
  settlement_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for tour_stop_financials
CREATE INDEX IF NOT EXISTS idx_tour_stop_financials_tour_stop_id ON public.tour_stop_financials(tour_stop_id);

-- 5. Tour messages table (chat for the tour)
CREATE TABLE IF NOT EXISTS public.tour_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for tour_messages
CREATE INDEX IF NOT EXISTS idx_tour_messages_tour_id ON public.tour_messages(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_messages_created_at ON public.tour_messages(tour_id, created_at);

-- 6. Tour files table
CREATE TABLE IF NOT EXISTS public.tour_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tour_id UUID NOT NULL REFERENCES public.tours(id) ON DELETE CASCADE,
  tour_stop_id UUID REFERENCES public.tour_stops(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  file_size INT,
  category TEXT DEFAULT 'other' CHECK (category IN ('contract', 'rider', 'map', 'itinerary', 'receipt', 'other')),

  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for tour_files
CREATE INDEX IF NOT EXISTS idx_tour_files_tour_id ON public.tour_files(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_files_tour_stop_id ON public.tour_files(tour_stop_id);

-- ============================================================================
-- Enable RLS
-- ============================================================================

ALTER TABLE public.tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_stop_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tour_files ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function to check if user is a tour member
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_tour_member(p_tour_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tour_members
    WHERE tour_id = p_tour_id
      AND user_id = (SELECT auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is a band admin (for a tour)
CREATE OR REPLACE FUNCTION public.is_tour_admin(p_tour_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.tour_members tm
    JOIN public.tours t ON t.id = tm.tour_id
    JOIN public.band_members bm ON bm.band_id = t.band_id AND bm.user_id = tm.user_id
    WHERE tm.tour_id = p_tour_id
      AND tm.user_id = (SELECT auth.uid())
      AND bm.role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS Policies - Tours
-- ============================================================================

-- Tour members can read their tours
CREATE POLICY "tours: tour members can read" ON public.tours FOR SELECT
USING (public.is_tour_member(id));

-- Band admins can insert tours (they're band members, will add themselves as tour member)
CREATE POLICY "tours: band admins can insert" ON public.tours FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.band_members
  WHERE band_members.band_id = tours.band_id
    AND band_members.user_id = (SELECT auth.uid())
    AND band_members.role = 'admin'
));

-- Tour admins can update tours
CREATE POLICY "tours: tour admins can update" ON public.tours FOR UPDATE
USING (public.is_tour_admin(id));

-- Tour admins can delete tours
CREATE POLICY "tours: tour admins can delete" ON public.tours FOR DELETE
USING (public.is_tour_admin(id));

-- ============================================================================
-- RLS Policies - Tour Members
-- ============================================================================

-- Tour members can read the member list
CREATE POLICY "tour_members: tour members can read" ON public.tour_members FOR SELECT
USING (public.is_tour_member(tour_id));

-- Tour admins can insert members
CREATE POLICY "tour_members: tour admins can insert" ON public.tour_members FOR INSERT
WITH CHECK (
  -- Either you're a tour admin adding someone
  public.is_tour_admin(tour_id)
  -- Or you're a band admin creating the tour (no tour members yet)
  OR EXISTS (
    SELECT 1 FROM public.tours t
    JOIN public.band_members bm ON bm.band_id = t.band_id
    WHERE t.id = tour_members.tour_id
      AND bm.user_id = (SELECT auth.uid())
      AND bm.role = 'admin'
  )
);

-- Tour admins can delete members
CREATE POLICY "tour_members: tour admins can delete" ON public.tour_members FOR DELETE
USING (public.is_tour_admin(tour_id));

-- ============================================================================
-- RLS Policies - Tour Stops
-- ============================================================================

-- Tour members can read tour stops
CREATE POLICY "tour_stops: tour members can read" ON public.tour_stops FOR SELECT
USING (public.is_tour_member(tour_id));

-- Tour admins can insert tour stops
CREATE POLICY "tour_stops: tour admins can insert" ON public.tour_stops FOR INSERT
WITH CHECK (public.is_tour_admin(tour_id));

-- Tour admins can update tour stops
CREATE POLICY "tour_stops: tour admins can update" ON public.tour_stops FOR UPDATE
USING (public.is_tour_admin(tour_id));

-- Tour admins can delete tour stops
CREATE POLICY "tour_stops: tour admins can delete" ON public.tour_stops FOR DELETE
USING (public.is_tour_admin(tour_id));

-- ============================================================================
-- RLS Policies - Tour Stop Financials
-- ============================================================================

-- Tour members can read financials
CREATE POLICY "tour_stop_financials: tour members can read" ON public.tour_stop_financials FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.tour_stops ts
  WHERE ts.id = tour_stop_financials.tour_stop_id
    AND public.is_tour_member(ts.tour_id)
));

-- Tour admins can insert financials
CREATE POLICY "tour_stop_financials: tour admins can insert" ON public.tour_stop_financials FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.tour_stops ts
  WHERE ts.id = tour_stop_financials.tour_stop_id
    AND public.is_tour_admin(ts.tour_id)
));

-- Tour admins can update financials
CREATE POLICY "tour_stop_financials: tour admins can update" ON public.tour_stop_financials FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.tour_stops ts
  WHERE ts.id = tour_stop_financials.tour_stop_id
    AND public.is_tour_admin(ts.tour_id)
));

-- Tour admins can delete financials
CREATE POLICY "tour_stop_financials: tour admins can delete" ON public.tour_stop_financials FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.tour_stops ts
  WHERE ts.id = tour_stop_financials.tour_stop_id
    AND public.is_tour_admin(ts.tour_id)
));

-- ============================================================================
-- RLS Policies - Tour Messages (Chat)
-- ============================================================================

-- Tour members can read messages
CREATE POLICY "tour_messages: tour members can read" ON public.tour_messages FOR SELECT
USING (public.is_tour_member(tour_id));

-- Tour members can insert messages (anyone on tour can chat)
CREATE POLICY "tour_messages: tour members can insert" ON public.tour_messages FOR INSERT
WITH CHECK (
  public.is_tour_member(tour_id)
  AND user_id = (SELECT auth.uid())
);

-- Users can delete their own messages
CREATE POLICY "tour_messages: users can delete own" ON public.tour_messages FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- RLS Policies - Tour Files
-- ============================================================================

-- Tour members can read files
CREATE POLICY "tour_files: tour members can read" ON public.tour_files FOR SELECT
USING (public.is_tour_member(tour_id));

-- Tour admins can insert files
CREATE POLICY "tour_files: tour admins can insert" ON public.tour_files FOR INSERT
WITH CHECK (public.is_tour_admin(tour_id));

-- Tour admins can update files
CREATE POLICY "tour_files: tour admins can update" ON public.tour_files FOR UPDATE
USING (public.is_tour_admin(tour_id));

-- Tour admins can delete files
CREATE POLICY "tour_files: tour admins can delete" ON public.tour_files FOR DELETE
USING (public.is_tour_admin(tour_id));

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE public.tours IS 'Tour records for bands with itineraries and logistics';
COMMENT ON TABLE public.tour_members IS 'Roster members selected to participate in a tour';
COMMENT ON TABLE public.tour_stops IS 'Individual stops/venues on a tour';
COMMENT ON TABLE public.tour_stop_financials IS 'Financial tracking for each tour stop';
COMMENT ON TABLE public.tour_messages IS 'Chat messages for tour communication';
COMMENT ON TABLE public.tour_files IS 'File attachments for tours and tour stops';
