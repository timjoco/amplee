// src/types/db.ts
export type MembershipRole = 'admin' | 'member';

export type Band = {
  id: string;
  name: string;
  avatar_url: string | null;
};

export type BandMembershipRow = {
  band_id: string;
  user_id: string;
  role: MembershipRole;
  created_at: string;
};

export type BandMediaItem = {
  id: string;
  type: 'photo' | 'video';
  thumbnailUrl: string; // photo itself, or video thumb
  title?: string; // "Live at recordBar", etc.
  tag?: string; // "Live", "Promo", "Behind the scenes"
  href?: string; // full image or external video URL
};

// ============================================================================
// Vendor Types
// ============================================================================

export type VendorSubscriptionStatus = 'none' | 'trial' | 'active' | 'past_due' | 'cancelled';
export type VendorSubscriptionTier = 'free' | 'basic' | 'pro';

export type VendorJobStatus =
  | 'inquiry'
  | 'quoted'
  | 'negotiating'
  | 'accepted'
  | 'declined'
  | 'cancelled'
  | 'completed'
  | 'disputed';

export type VendorCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  display_order: number;
  created_at: string;
};

export type Vendor = {
  id: string;
  user_id: string;
  name: string;
  slug: string | null;
  bio: string | null;
  avatar_url: string | null;
  cover_image_url: string | null;
  city: string | null;
  state: string | null;
  country: string;
  latitude: number | null;
  longitude: number | null;
  service_radius_miles: number | null;
  email: string;
  phone: string | null;
  website: string | null;
  social_links: Array<{ platform: string; url: string }>;
  is_verified: boolean;
  verification_date: string | null;
  subscription_status: VendorSubscriptionStatus;
  subscription_tier: VendorSubscriptionTier;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_current_period_end: string | null;
  is_public: boolean;
  is_featured: boolean;
  total_jobs_completed: number;
  average_rating: number | null;
  review_count: number;
  created_at: string;
  updated_at: string;
};

export type VendorWithCategories = Vendor & {
  categories: VendorCategory[];
};

export type VendorService = {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  base_price: number | null;
  price_unit: 'flat' | 'hourly' | 'daily' | 'per_show' | 'custom' | null;
  is_active: boolean;
  display_order: number;
  created_at: string;
};

export type VendorGalleryItem = {
  id: string;
  vendor_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  created_at: string;
};

export type VendorJob = {
  id: string;
  vendor_id: string;
  band_id: string;
  created_by: string;
  title: string;
  description: string | null;
  event_id: string | null;
  event_date: string | null;
  status: VendorJobStatus;
  quoted_amount: number | null;
  final_amount: number | null;
  currency: string;
  quoted_at: string | null;
  accepted_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorJobWithDetails = VendorJob & {
  vendor: Vendor;
  band: Band;
};

export type VendorJobMessage = {
  id: number;
  job_id: string;
  user_id: string;
  body: string;
  attachment_url: string | null;
  attachment_type: string | null;
  created_at: string;
  updated_at: string;
};

export type VendorJobMessageWithProfile = VendorJobMessage & {
  profile: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
};

export type VendorJobMessageReaction = {
  id: string;
  message_id: number;
  user_id: string;
  emoji: string;
  created_at: string;
};

export type VendorReview = {
  id: string;
  job_id: string;
  vendor_id: string;
  band_id: string;
  reviewer_user_id: string;
  rating: number;
  title: string | null;
  body: string | null;
  vendor_response: string | null;
  vendor_responded_at: string | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
};
