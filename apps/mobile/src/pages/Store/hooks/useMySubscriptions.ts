import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import type {
  BandSubscriptionWithProduct,
  BandTrialWithProduct,
} from '../types/subscriptionTypes';
import { calculateTrialDaysLeft } from '../types/subscriptionTypes';

type BandSubscriptionInfo = {
  bandId: string;
  bandName: string;
  bandAvatarUrl: string | null;
  productSlug: string;
  productName: string;
  hasAccess: boolean;
  isTrialing: boolean;
  isSubscribed: boolean;
  trialDaysLeft: number | null;
  subscription: BandSubscriptionWithProduct | null;
  trial: BandTrialWithProduct | null;
};

type UseMySubscriptionsResult = {
  subscriptions: BandSubscriptionInfo[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

/**
 * Hook to load all subscriptions and trials for the current user across all their bands.
 */
export function useMySubscriptions(): UseMySubscriptionsResult {
  const [subscriptions, setSubscriptions] = useState<BandSubscriptionInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;

      if (!userId) {
        setSubscriptions([]);
        setLoading(false);
        return;
      }

      // Get user's bands
      const { data: memberships, error: membershipError } = await supabase
        .from('band_members')
        .select('band_id, bands(id, name, avatar_url)')
        .eq('user_id', userId);

      if (membershipError) {
        setError(membershipError.message);
        return;
      }

      if (!memberships || memberships.length === 0) {
        setSubscriptions([]);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bands = memberships.map((m: any) => ({
        id: m.bands?.id || m.band_id,
        name: m.bands?.name || '',
        avatar_url: m.bands?.avatar_url || null,
      }));

      const bandIds = bands.map((b) => b.id);

      // Get all subscriptions for these bands
      const { data: subs, error: subError } = await supabase
        .from('band_subscriptions')
        .select(`
          *,
          product:products(*)
        `)
        .in('band_id', bandIds)
        .in('status', ['active', 'trialing', 'canceled', 'past_due']);

      if (subError) {
        console.error('[useMySubscriptions] subscriptions error', subError);
      }

      // Get all trials for these bands
      const { data: trials, error: trialError } = await supabase
        .from('band_trials')
        .select(`
          *,
          product:products(*)
        `)
        .in('band_id', bandIds)
        .is('converted_to_subscription_id', null);

      if (trialError) {
        console.error('[useMySubscriptions] trials error', trialError);
      }

      // Build subscription info list
      const result: BandSubscriptionInfo[] = [];

      // Add subscriptions
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const sub of (subs || []) as any[]) {
        const band = bands.find((b) => b.id === sub.band_id);
        if (!band || !sub.product) continue;

        const hasActiveAccess = sub.status === 'active' || sub.status === 'trialing';

        result.push({
          bandId: band.id,
          bandName: band.name,
          bandAvatarUrl: band.avatar_url,
          productSlug: sub.product.slug,
          productName: sub.product.name,
          hasAccess: hasActiveAccess,
          isTrialing: false,
          isSubscribed: true,
          trialDaysLeft: null,
          subscription: { ...sub, band },
          trial: null,
        });
      }

      // Add trials (only if not already converted to subscription)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const trial of (trials || []) as any[]) {
        const band = bands.find((b) => b.id === trial.band_id);
        if (!band || !trial.product) continue;

        // Skip if there's already a subscription entry for this band+product
        const hasSubscription = result.some(
          (r) => r.bandId === band.id && r.productSlug === trial.product.slug
        );
        if (hasSubscription) continue;

        const daysLeft = calculateTrialDaysLeft(trial.expires_at);
        const hasActiveAccess = daysLeft > 0;

        result.push({
          bandId: band.id,
          bandName: band.name,
          bandAvatarUrl: band.avatar_url,
          productSlug: trial.product.slug,
          productName: trial.product.name,
          hasAccess: hasActiveAccess,
          isTrialing: hasActiveAccess,
          isSubscribed: false,
          trialDaysLeft: daysLeft,
          subscription: null,
          trial: { ...trial, band },
        });
      }

      // Sort: active first, then by band name
      result.sort((a, b) => {
        if (a.hasAccess && !b.hasAccess) return -1;
        if (!a.hasAccess && b.hasAccess) return 1;
        return a.bandName.localeCompare(b.bandName);
      });

      setSubscriptions(result);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load subscriptions';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  return { subscriptions, loading, error, reload };
}
