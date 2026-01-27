import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type {
  BandSubscriptionRow,
  BandTrialRow,
  FeatureAccessResult,
} from '../types/subscriptionTypes';
import { calculateTrialDaysLeft } from '../types/subscriptionTypes';

/**
 * Hook to check if a band has access to a specific product feature.
 * Returns access status, trial info, and subscription data.
 *
 * @param bandId - The band ID to check
 * @param productSlug - The product slug (e.g., 'tour-pro')
 */
export function useBandSubscription(
  bandId: string | undefined,
  productSlug: string
): FeatureAccessResult {
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<BandSubscriptionRow | null>(null);
  const [trial, setTrial] = useState<BandTrialRow | null>(null);

  const checkAccess = useCallback(async () => {
    if (!bandId) {
      setLoading(false);
      return;
    }

    setLoading(true);

    try {
      // Get the product ID first
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('id')
        .eq('slug', productSlug)
        .eq('is_active', true)
        .maybeSingle();

      if (productError || !product) {
        console.error('[useBandSubscription] product lookup error', productError);
        setSubscription(null);
        setTrial(null);
        setLoading(false);
        return;
      }

      // Check for active subscription
      const { data: subData, error: subError } = await supabase
        .from('band_subscriptions')
        .select('*')
        .eq('band_id', bandId)
        .eq('product_id', product.id)
        .in('status', ['active', 'trialing'])
        .maybeSingle();

      if (subError) {
        console.error('[useBandSubscription] subscription lookup error', subError);
      }
      setSubscription((subData as BandSubscriptionRow) || null);

      // Check for active trial (only if no subscription)
      if (!subData) {
        const { data: trialData, error: trialError } = await supabase
          .from('band_trials')
          .select('*')
          .eq('band_id', bandId)
          .eq('product_id', product.id)
          .is('converted_to_subscription_id', null)
          .gt('expires_at', new Date().toISOString())
          .maybeSingle();

        if (trialError) {
          console.error('[useBandSubscription] trial lookup error', trialError);
        }
        setTrial((trialData as BandTrialRow) || null);
      } else {
        setTrial(null);
      }
    } catch (e) {
      console.error('[useBandSubscription] error', e);
    } finally {
      setLoading(false);
    }
  }, [bandId, productSlug]);

  useEffect(() => {
    void checkAccess();
  }, [checkAccess]);

  // Compute derived values
  const hasActiveSubscription = subscription?.status === 'active' || subscription?.status === 'trialing';
  const hasActiveTrial = trial !== null && new Date(trial.expires_at) > new Date();
  const hasAccess = hasActiveSubscription || hasActiveTrial;

  const isTrialing = hasActiveTrial && !hasActiveSubscription;
  const trialDaysLeft = trial ? calculateTrialDaysLeft(trial.expires_at) : null;
  const trialExpiresAt = trial?.expires_at ?? null;

  return {
    hasAccess,
    isTrialing,
    trialDaysLeft,
    trialExpiresAt,
    subscription,
    trial,
    loading,
  };
}
