-- ============================================================================
-- Vendors Feature - Database Schema
-- ============================================================================
-- This migration creates the tables for the vendor marketplace where vendors
-- (engineers, designers, venues) can be discovered by bands.
-- ============================================================================

-- 1. Vendor categories table (taxonomy)
CREATE TABLE IF NOT EXISTS public.vendor_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,  -- Icon name for UI (e.g., 'MicIcon', 'PaletteIcon', 'LocationOnIcon')
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Seed initial categories
INSERT INTO public.vendor_categories (name, slug, description, icon, display_order) VALUES
  ('Engineers', 'engineers', 'Sound engineers, lighting techs, and live production specialists', 'MicIcon', 1),
  ('Designers', 'designers', 'Merch designers, album art creators, and branding specialists', 'PaletteIcon', 2),
  ('Venues', 'venues', 'Bars, clubs, theaters, and event spaces', 'LocationOnIcon', 3);

-- 2. Main vendors table
CREATE TABLE IF NOT EXISTS public.vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic Info
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  bio TEXT,
  avatar_url TEXT,
  cover_image_url TEXT,

  -- Location
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'USA',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  service_radius_miles INT,  -- How far they'll travel (null = any distance)

  -- Contact (not publicly visible until job, used for verification)
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,

  -- Social links (JSON array)
  social_links JSONB DEFAULT '[]',

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMPTZ,

  -- Subscription status (Stripe)
  subscription_status TEXT DEFAULT 'none'
    CHECK (subscription_status IN ('none', 'trial', 'active', 'past_due', 'cancelled')),
  subscription_tier TEXT DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'basic', 'pro')),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  subscription_current_period_end TIMESTAMPTZ,

  -- Visibility
  is_public BOOLEAN DEFAULT false,  -- Only visible when subscription active
  is_featured BOOLEAN DEFAULT false,  -- Admin can feature vendors

  -- Stats (denormalized for performance)
  total_jobs_completed INT DEFAULT 0,
  average_rating DECIMAL(3, 2),
  review_count INT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for vendors
CREATE INDEX IF NOT EXISTS idx_vendors_user_id ON public.vendors(user_id);
CREATE INDEX IF NOT EXISTS idx_vendors_slug ON public.vendors(slug);
CREATE INDEX IF NOT EXISTS idx_vendors_subscription_status ON public.vendors(subscription_status);
CREATE INDEX IF NOT EXISTS idx_vendors_is_public ON public.vendors(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_vendors_location ON public.vendors(city, state);

-- 3. Vendor category assignments (many-to-many)
CREATE TABLE IF NOT EXISTS public.vendor_category_assignments (
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.vendor_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (vendor_id, category_id)
);

-- Indexes for category assignments
CREATE INDEX IF NOT EXISTS idx_vendor_category_assignments_vendor_id ON public.vendor_category_assignments(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_category_assignments_category_id ON public.vendor_category_assignments(category_id);

-- 4. Vendor gallery images
CREATE TABLE IF NOT EXISTS public.vendor_gallery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  caption TEXT,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for vendor gallery
CREATE INDEX IF NOT EXISTS idx_vendor_gallery_vendor_id ON public.vendor_gallery(vendor_id);

-- 5. Vendor services offered (what they can do, with optional pricing)
CREATE TABLE IF NOT EXISTS public.vendor_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendors(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  base_price DECIMAL(10, 2),
  price_unit TEXT CHECK (price_unit IS NULL OR price_unit IN ('flat', 'hourly', 'daily', 'per_show', 'custom')),
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for vendor services
CREATE INDEX IF NOT EXISTS idx_vendor_services_vendor_id ON public.vendor_services(vendor_id);

-- ============================================================================
-- Enable RLS
-- ============================================================================

ALTER TABLE public.vendor_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_category_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_gallery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_services ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper function to check if user owns a vendor
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_vendor_owner(p_vendor_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.vendors
    WHERE id = p_vendor_id AND user_id = (SELECT auth.uid())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS Policies - Vendor Categories (public read)
-- ============================================================================

-- Anyone can read categories
CREATE POLICY "vendor_categories: public read" ON public.vendor_categories FOR SELECT
USING (true);

-- ============================================================================
-- RLS Policies - Vendors
-- ============================================================================

-- Anyone can read public, active vendors
CREATE POLICY "vendors: public can read active" ON public.vendors FOR SELECT
USING (is_public = true AND subscription_status = 'active');

-- Owners can read their own (even if not public)
CREATE POLICY "vendors: owners can read own" ON public.vendors FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- Users can create vendors
CREATE POLICY "vendors: users can insert" ON public.vendors FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

-- Owners can update their vendors
CREATE POLICY "vendors: owners can update" ON public.vendors FOR UPDATE
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- Owners can delete their vendors
CREATE POLICY "vendors: owners can delete" ON public.vendors FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- RLS Policies - Vendor Category Assignments
-- ============================================================================

-- Anyone can read category assignments for public vendors
CREATE POLICY "vendor_category_assignments: public can read" ON public.vendor_category_assignments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.vendors v
  WHERE v.id = vendor_category_assignments.vendor_id
    AND v.is_public = true
    AND v.subscription_status = 'active'
));

-- Owners can read their own assignments
CREATE POLICY "vendor_category_assignments: owners can read own" ON public.vendor_category_assignments FOR SELECT
USING (public.is_vendor_owner(vendor_id));

-- Owners can insert assignments
CREATE POLICY "vendor_category_assignments: owners can insert" ON public.vendor_category_assignments FOR INSERT
WITH CHECK (public.is_vendor_owner(vendor_id));

-- Owners can delete assignments
CREATE POLICY "vendor_category_assignments: owners can delete" ON public.vendor_category_assignments FOR DELETE
USING (public.is_vendor_owner(vendor_id));

-- ============================================================================
-- RLS Policies - Vendor Gallery
-- ============================================================================

-- Anyone can read gallery for public vendors
CREATE POLICY "vendor_gallery: public can read" ON public.vendor_gallery FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.vendors v
  WHERE v.id = vendor_gallery.vendor_id
    AND v.is_public = true
    AND v.subscription_status = 'active'
));

-- Owners can read their own gallery
CREATE POLICY "vendor_gallery: owners can read own" ON public.vendor_gallery FOR SELECT
USING (public.is_vendor_owner(vendor_id));

-- Owners can insert gallery images
CREATE POLICY "vendor_gallery: owners can insert" ON public.vendor_gallery FOR INSERT
WITH CHECK (public.is_vendor_owner(vendor_id));

-- Owners can update gallery images
CREATE POLICY "vendor_gallery: owners can update" ON public.vendor_gallery FOR UPDATE
USING (public.is_vendor_owner(vendor_id));

-- Owners can delete gallery images
CREATE POLICY "vendor_gallery: owners can delete" ON public.vendor_gallery FOR DELETE
USING (public.is_vendor_owner(vendor_id));

-- ============================================================================
-- RLS Policies - Vendor Services
-- ============================================================================

-- Anyone can read services for public vendors
CREATE POLICY "vendor_services: public can read" ON public.vendor_services FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.vendors v
  WHERE v.id = vendor_services.vendor_id
    AND v.is_public = true
    AND v.subscription_status = 'active'
));

-- Owners can read their own services
CREATE POLICY "vendor_services: owners can read own" ON public.vendor_services FOR SELECT
USING (public.is_vendor_owner(vendor_id));

-- Owners can insert services
CREATE POLICY "vendor_services: owners can insert" ON public.vendor_services FOR INSERT
WITH CHECK (public.is_vendor_owner(vendor_id));

-- Owners can update services
CREATE POLICY "vendor_services: owners can update" ON public.vendor_services FOR UPDATE
USING (public.is_vendor_owner(vendor_id));

-- Owners can delete services
CREATE POLICY "vendor_services: owners can delete" ON public.vendor_services FOR DELETE
USING (public.is_vendor_owner(vendor_id));

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_vendors_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER vendors_updated_at
  BEFORE UPDATE ON public.vendors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_vendors_updated_at();

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE public.vendor_categories IS 'Vendor category taxonomy (Engineers, Designers, Venues)';
COMMENT ON TABLE public.vendors IS 'Vendor profiles for the marketplace';
COMMENT ON TABLE public.vendor_category_assignments IS 'Many-to-many relationship between vendors and categories';
COMMENT ON TABLE public.vendor_gallery IS 'Gallery images for vendor profiles';
COMMENT ON TABLE public.vendor_services IS 'Services offered by vendors with optional pricing';
