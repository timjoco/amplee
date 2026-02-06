-- ============================================================================
-- Store & Subscriptions Feature - Database Schema
-- ============================================================================
-- This migration creates the tables for managing Pro features, subscriptions,
-- and trials per band. Follows a simple, transparent monetization model.
-- ============================================================================

-- 1. Products table - Available Pro features
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,                    -- "Tour Pro"
  slug TEXT UNIQUE NOT NULL,             -- "tour-pro"
  description TEXT,                      -- Feature description
  stripe_price_id TEXT,                  -- Stripe Price ID for subscription
  price_cents INTEGER NOT NULL,          -- Display price (e.g., 999 = $9.99)
  features JSONB DEFAULT '[]',           -- List of feature highlights
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for products
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON public.products(is_active);

-- 2. Band subscriptions table - Active subscriptions per band
CREATE TABLE IF NOT EXISTS public.band_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  stripe_subscription_id TEXT,           -- Stripe Subscription ID
  stripe_customer_id TEXT,               -- Stripe Customer ID
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'incomplete')),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(band_id, product_id)
);

-- Indexes for band_subscriptions
CREATE INDEX IF NOT EXISTS idx_band_subscriptions_band_id ON public.band_subscriptions(band_id);
CREATE INDEX IF NOT EXISTS idx_band_subscriptions_product_id ON public.band_subscriptions(product_id);
CREATE INDEX IF NOT EXISTS idx_band_subscriptions_status ON public.band_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_band_subscriptions_stripe_subscription_id ON public.band_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_band_subscriptions_stripe_customer_id ON public.band_subscriptions(stripe_customer_id);

-- 3. Band trials table - Free trials (no payment info required)
CREATE TABLE IF NOT EXISTS public.band_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  band_id UUID NOT NULL REFERENCES public.bands(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  started_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,       -- started_at + 30 days
  started_by UUID REFERENCES auth.users(id),
  converted_to_subscription_id UUID REFERENCES public.band_subscriptions(id),
  UNIQUE(band_id, product_id)            -- One trial per product per band
);

-- Indexes for band_trials
CREATE INDEX IF NOT EXISTS idx_band_trials_band_id ON public.band_trials(band_id);
CREATE INDEX IF NOT EXISTS idx_band_trials_product_id ON public.band_trials(product_id);
CREATE INDEX IF NOT EXISTS idx_band_trials_expires_at ON public.band_trials(expires_at);

-- ============================================================================
-- Enable RLS
-- ============================================================================

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.band_trials ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Helper functions for subscription access checks
-- ============================================================================

-- Note: is_band_member and is_band_admin already exist from previous migrations
-- We'll use them as-is for the subscription RLS policies

-- Check if a band has active access to a product (subscription or trial)
CREATE OR REPLACE FUNCTION public.band_has_product_access(p_band_id UUID, p_product_slug TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_product_id UUID;
BEGIN
  -- Get product ID from slug
  SELECT id INTO v_product_id FROM public.products WHERE slug = p_product_slug AND is_active = true;
  IF v_product_id IS NULL THEN
    RETURN false;
  END IF;

  -- Check for active subscription
  IF EXISTS (
    SELECT 1 FROM public.band_subscriptions
    WHERE band_id = p_band_id
      AND product_id = v_product_id
      AND status IN ('active', 'trialing')
  ) THEN
    RETURN true;
  END IF;

  -- Check for active trial
  IF EXISTS (
    SELECT 1 FROM public.band_trials
    WHERE band_id = p_band_id
      AND product_id = v_product_id
      AND expires_at > now()
      AND converted_to_subscription_id IS NULL
  ) THEN
    RETURN true;
  END IF;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- RLS Policies - Products
-- ============================================================================

-- Anyone can read active products (for store display)
CREATE POLICY "products: anyone can read active" ON public.products FOR SELECT
USING (is_active = true);

-- Only service role can modify products (admin-only)
-- No INSERT/UPDATE/DELETE policies for regular users

-- ============================================================================
-- RLS Policies - Band Subscriptions
-- ============================================================================

-- Band members can read their band's subscriptions
CREATE POLICY "band_subscriptions: band members can read" ON public.band_subscriptions FOR SELECT
USING (public.is_band_member(band_id));

-- Only service role can INSERT subscriptions (via Stripe webhook)
-- We'll use service role for all subscription modifications

-- ============================================================================
-- RLS Policies - Band Trials
-- ============================================================================

-- Band members can read their band's trials
CREATE POLICY "band_trials: band members can read" ON public.band_trials FOR SELECT
USING (public.is_band_member(band_id));

-- Band admins can insert trials (start a trial)
CREATE POLICY "band_trials: band admins can insert" ON public.band_trials FOR INSERT
WITH CHECK (
  public.is_band_admin(band_id)
  -- Ensure no existing trial or subscription exists
  AND NOT EXISTS (
    SELECT 1 FROM public.band_trials bt
    WHERE bt.band_id = band_trials.band_id
      AND bt.product_id = band_trials.product_id
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.band_subscriptions bs
    WHERE bs.band_id = band_trials.band_id
      AND bs.product_id = band_trials.product_id
  )
);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE public.products IS 'Available Pro features/products that bands can subscribe to';
COMMENT ON TABLE public.band_subscriptions IS 'Active paid subscriptions per band, managed via Stripe';
COMMENT ON TABLE public.band_trials IS 'Free 30-day trials per band, no payment info required';
COMMENT ON FUNCTION public.band_has_product_access(UUID, TEXT) IS 'Check if a band has access to a product via subscription or trial';

-- ============================================================================
-- Seed Data - Initial Product: Tour Pro
-- ============================================================================
INSERT INTO public.products (name, slug, description, price_cents, features)
VALUES (
  'Tour Manager Pro',
  'tour-pro',
  'Plan tours, manage stops, track finances, and coordinate with your band - all in one place.',
  999,
  '[
    "Unlimited tours and stops",
    "Detailed venue & promoter info",
    "Financial tracking per stop",
    "Hotel & travel logistics",
    "Tour chat with your band",
    "File attachments (contracts, riders)"
  ]'::jsonb
)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_cents = EXCLUDED.price_cents,
  features = EXCLUDED.features;
