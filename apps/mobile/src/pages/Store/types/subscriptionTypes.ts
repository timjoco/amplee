// ============================================================================
// Subscription Types
// ============================================================================

// Database row types
export type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  stripe_price_id: string | null;
  price_cents: number;
  features: string[];
  is_active: boolean;
  created_at: string | null;
};

export type BandSubscriptionRow = {
  id: string;
  band_id: string;
  product_id: string;
  stripe_subscription_id: string | null;
  stripe_customer_id: string | null;
  status: SubscriptionStatus;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export type BandTrialRow = {
  id: string;
  band_id: string;
  product_id: string;
  started_at: string | null;
  expires_at: string;
  started_by: string | null;
  converted_to_subscription_id: string | null;
};

// Status types
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';

// Extended types with relationships
export type ProductWithAccess = ProductRow & {
  hasAccess: boolean;
  isTrialing: boolean;
  trialDaysLeft: number | null;
  subscription: BandSubscriptionRow | null;
  trial: BandTrialRow | null;
};

export type BandSubscriptionWithProduct = BandSubscriptionRow & {
  product: ProductRow;
  band?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

export type BandTrialWithProduct = BandTrialRow & {
  product: ProductRow;
  band?: {
    id: string;
    name: string;
    avatar_url: string | null;
  };
};

// Access check result
export type FeatureAccessResult = {
  hasAccess: boolean;
  isTrialing: boolean;
  trialDaysLeft: number | null;
  trialExpiresAt: string | null;
  subscription: BandSubscriptionRow | null;
  trial: BandTrialRow | null;
  loading: boolean;
};

// Constants
export const TRIAL_DURATION_DAYS = 30;

export const SUBSCRIPTION_STATUS_LABELS: Record<SubscriptionStatus, string> = {
  active: 'Active',
  canceled: 'Canceled',
  past_due: 'Past Due',
  trialing: 'Trial',
  incomplete: 'Incomplete',
};

export const SUBSCRIPTION_STATUS_COLORS: Record<SubscriptionStatus, string> = {
  active: '#22c55e',
  canceled: '#ef4444',
  past_due: '#f59e0b',
  trialing: '#3b82f6',
  incomplete: '#6b7280',
};

// Formatting helpers
export function formatPrice(priceCents: number): string {
  return `$${(priceCents / 100).toFixed(2)}`;
}

export function formatTrialDaysLeft(daysLeft: number): string {
  if (daysLeft <= 0) return 'Expired';
  if (daysLeft === 1) return '1 day left';
  return `${daysLeft} days left`;
}

export function calculateTrialDaysLeft(expiresAt: string): number {
  const now = new Date();
  const expires = new Date(expiresAt);
  const diffMs = expires.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
