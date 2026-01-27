import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import type {
  BandSubscriptionWithProduct,
  BandTrialWithProduct,
  ProductRow,
} from '../pages/Store/types/subscriptionTypes';
import { calculateTrialDaysLeft } from '../pages/Store/types/subscriptionTypes';

// ============================================================================
// Types
// ============================================================================

type BandAccess = {
  bandId: string;
  bandName: string;
  bandAvatarUrl: string | null;
  productSlug: string;
  hasAccess: boolean;
  isTrialing: boolean;
  trialDaysLeft: number | null;
  subscription: BandSubscriptionWithProduct | null;
  trial: BandTrialWithProduct | null;
};

type SubscriptionContextValue = {
  // All subscriptions/trials for the current user across all bands
  bandAccess: BandAccess[];
  loading: boolean;
  reload: () => Promise<void>;

  // Products available in the store
  products: ProductRow[];
  productsLoading: boolean;

  // Quick check: does a specific band have access to a product?
  checkBandAccess: (bandId: string, productSlug: string) => BandAccess | undefined;
};

// ============================================================================
// Context
// ============================================================================

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const [bandAccess, setBandAccess] = useState<BandAccess[]>([]);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);

  // Load all products
  const loadProducts = useCallback(async () => {
    setProductsLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[SubscriptionContext] products error', error);
        return;
      }

      setProducts((data as ProductRow[]) || []);
    } finally {
      setProductsLoading(false);
    }
  }, []);

  // Load all subscriptions and trials for the current user's bands
  const loadBandAccess = useCallback(async () => {
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) {
        setBandAccess([]);
        return;
      }

      // Get user's bands
      const { data: memberships, error: membershipError } = await supabase
        .from('band_members')
        .select('band_id, bands(id, name, avatar_url)')
        .eq('user_id', userId);

      if (membershipError) {
        console.error('[SubscriptionContext] memberships error', membershipError);
        return;
      }

      if (!memberships || memberships.length === 0) {
        setBandAccess([]);
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
      const { data: subscriptions } = await supabase
        .from('band_subscriptions')
        .select(`
          *,
          product:products(*)
        `)
        .in('band_id', bandIds)
        .in('status', ['active', 'trialing']);

      // Get all active trials for these bands
      const { data: trials } = await supabase
        .from('band_trials')
        .select(`
          *,
          product:products(*)
        `)
        .in('band_id', bandIds)
        .is('converted_to_subscription_id', null)
        .gt('expires_at', new Date().toISOString());

      // Build access map
      const accessList: BandAccess[] = [];

      // For each product, check each band's access
      for (const product of products) {
        for (const band of bands) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const sub = subscriptions?.find((s: any) =>
            s.band_id === band.id && s.product_id === product.id
          ) as BandSubscriptionWithProduct | undefined;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const trial = trials?.find((t: any) =>
            t.band_id === band.id && t.product_id === product.id
          ) as BandTrialWithProduct | undefined;

          const hasActiveSubscription = sub?.status === 'active' || sub?.status === 'trialing';
          const hasActiveTrial = trial && new Date(trial.expires_at) > new Date();
          const hasAccess = hasActiveSubscription || !!hasActiveTrial;

          // Only add to list if band has some relationship with this product
          if (sub || trial) {
            accessList.push({
              bandId: band.id,
              bandName: band.name,
              bandAvatarUrl: band.avatar_url,
              productSlug: product.slug,
              hasAccess,
              isTrialing: !!hasActiveTrial && !hasActiveSubscription,
              trialDaysLeft: trial ? calculateTrialDaysLeft(trial.expires_at) : null,
              subscription: sub ? { ...sub, product } : null,
              trial: trial ? { ...trial, product } : null,
            });
          }
        }
      }

      setBandAccess(accessList);
    } finally {
      setLoading(false);
    }
  }, [products]);

  // Initial load
  useEffect(() => {
    void loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    if (!productsLoading) {
      void loadBandAccess();
    }
  }, [loadBandAccess, productsLoading]);

  // Reload function
  const reload = useCallback(async () => {
    await loadProducts();
    await loadBandAccess();
  }, [loadProducts, loadBandAccess]);

  // Quick access check
  const checkBandAccess = useCallback(
    (bandId: string, productSlug: string) => {
      return bandAccess.find(
        (a) => a.bandId === bandId && a.productSlug === productSlug
      );
    },
    [bandAccess]
  );

  const value: SubscriptionContextValue = {
    bandAccess,
    loading,
    reload,
    products,
    productsLoading,
    checkBandAccess,
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useSubscriptionContext() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscriptionContext must be used within a SubscriptionProvider');
  }
  return context;
}
