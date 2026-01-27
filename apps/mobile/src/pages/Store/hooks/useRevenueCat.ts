import { Capacitor } from '@capacitor/core';
import {
  Purchases,
  LOG_LEVEL,
  PACKAGE_TYPE,
  type CustomerInfo,
  type PurchasesOffering,
  type PurchasesPackage,
} from '@revenuecat/purchases-capacitor';
import { RevenueCatUI, PAYWALL_RESULT } from '@revenuecat/purchases-capacitor-ui';
import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '../../../lib/supabase';

// ============================================================================
// Configuration
// ============================================================================

const REVENUECAT_API_KEY = 'test_GLdEupQmilGJcvnHRqMajnWkOLs';

// Entitlement ID that grants access to Amplee Pro features
const AMPLEE_PRO_ENTITLEMENT = 'Amplee Pro';

// ============================================================================
// Types
// ============================================================================

export type PackageType = 'monthly' | 'yearly' | 'lifetime';

export type RevenueCatState = {
  isConfigured: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOffering | null;
  error: string | null;
};

export type UseRevenueCatResult = RevenueCatState & {
  // Entitlement checks
  hasEntitlement: (entitlementId: string) => boolean;
  hasAmpleePro: boolean;

  // Get specific packages
  getPackage: (type: PackageType) => PurchasesPackage | null;
  monthlyPackage: PurchasesPackage | null;
  yearlyPackage: PurchasesPackage | null;
  lifetimePackage: PurchasesPackage | null;

  // Purchase operations
  purchase: (pkg: PurchasesPackage) => Promise<boolean>;
  purchasePackage: (type: PackageType) => Promise<boolean>;

  // Restore purchases
  restorePurchases: () => Promise<boolean>;

  // Paywall presentation (RevenueCat UI)
  presentPaywall: (offeringId?: string) => Promise<PaywallPresentResult>;
  presentPaywallIfNeeded: (entitlementId?: string) => Promise<PaywallPresentResult>;

  // Customer Center (subscription management)
  presentCustomerCenter: () => Promise<void>;

  // Reload data
  reload: () => Promise<void>;

  // Login/logout for user identification
  login: (userId: string) => Promise<void>;
  logout: () => Promise<void>;
};

export type PaywallPresentResult = {
  success: boolean;
  purchased: boolean;
  restored: boolean;
  cancelled: boolean;
  error: boolean;
};

// ============================================================================
// Singleton state to prevent multiple initializations
// ============================================================================

let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useRevenueCat(): UseRevenueCatResult {
  const [state, setState] = useState<RevenueCatState>({
    isConfigured: false,
    isLoading: true,
    customerInfo: null,
    offerings: null,
    error: null,
  });

  const mountedRef = useRef(true);

  // --------------------------------------------------------------------------
  // Initialize RevenueCat SDK
  // --------------------------------------------------------------------------
  const initialize = useCallback(async () => {
    // Return existing initialization if in progress
    if (initializationPromise) {
      await initializationPromise;
      return;
    }

    // Skip if already initialized
    if (isInitialized) {
      setState((prev) => ({ ...prev, isConfigured: true }));
      return;
    }

    const platform = Capacitor.getPlatform();

    // RevenueCat is mobile-only
    if (platform === 'web') {
      setState((prev) => ({
        ...prev,
        isConfigured: false,
        isLoading: false,
        error: 'RevenueCat is not available on web',
      }));
      return;
    }

    if (!REVENUECAT_API_KEY) {
      setState((prev) => ({
        ...prev,
        isConfigured: false,
        isLoading: false,
        error: 'RevenueCat API key not configured',
      }));
      return;
    }

    initializationPromise = (async () => {
      try {
        // Set debug logging (DEBUG in dev, INFO in prod)
        await Purchases.setLogLevel({
          level: LOG_LEVEL.DEBUG,
        });

        // Configure the SDK
        await Purchases.configure({
          apiKey: REVENUECAT_API_KEY,
        });

        // Identify user if logged in
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await Purchases.logIn({ appUserID: user.id });
        }

        isInitialized = true;

        if (mountedRef.current) {
          setState((prev) => ({ ...prev, isConfigured: true }));
        }
      } catch (e) {
        console.error('[useRevenueCat] initialization error:', e);
        if (mountedRef.current) {
          setState((prev) => ({
            ...prev,
            isConfigured: false,
            isLoading: false,
            error: e instanceof Error ? e.message : 'Failed to initialize RevenueCat',
          }));
        }
      } finally {
        initializationPromise = null;
      }
    })();

    await initializationPromise;
  }, []);

  // --------------------------------------------------------------------------
  // Load customer info and offerings
  // --------------------------------------------------------------------------
  const loadData = useCallback(async () => {
    if (!state.isConfigured) return;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Fetch customer info and offerings in parallel
      const [customerInfoResult, offeringsResult] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);

      const { customerInfo } = customerInfoResult;
      const currentOffering = offeringsResult.current || null;

      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          customerInfo,
          offerings: currentOffering,
          isLoading: false,
        }));
      }
    } catch (e) {
      console.error('[useRevenueCat] load error:', e);
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: e instanceof Error ? e.message : 'Failed to load subscription data',
        }));
      }
    }
  }, [state.isConfigured]);

  // --------------------------------------------------------------------------
  // Effects
  // --------------------------------------------------------------------------

  // Initialize on mount
  useEffect(() => {
    mountedRef.current = true;
    void initialize();

    return () => {
      mountedRef.current = false;
    };
  }, [initialize]);

  // Load data when configured
  useEffect(() => {
    if (state.isConfigured) {
      void loadData();
    }
  }, [state.isConfigured, loadData]);

  // Listen for customer info updates
  useEffect(() => {
    if (!state.isConfigured || Capacitor.getPlatform() === 'web') return;

    let callbackId: string | null = null;

    Purchases.addCustomerInfoUpdateListener((customerInfo) => {
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, customerInfo }));
      }
    }).then((id) => {
      callbackId = id;
    }).catch(console.error);

    return () => {
      if (callbackId) {
        Purchases.removeCustomerInfoUpdateListener({ listenerToRemove: callbackId }).catch(console.error);
      }
    };
  }, [state.isConfigured]);

  // --------------------------------------------------------------------------
  // Entitlement checks
  // --------------------------------------------------------------------------

  const hasEntitlement = useCallback(
    (entitlementId: string): boolean => {
      if (!state.customerInfo) return false;
      const entitlement = state.customerInfo.entitlements.active[entitlementId];
      return entitlement?.isActive ?? false;
    },
    [state.customerInfo]
  );

  const hasAmpleePro = hasEntitlement(AMPLEE_PRO_ENTITLEMENT);

  // --------------------------------------------------------------------------
  // Package helpers
  // --------------------------------------------------------------------------

  const getPackage = useCallback(
    (type: PackageType): PurchasesPackage | null => {
      if (!state.offerings) return null;

      const packageTypeMap: Record<PackageType, PACKAGE_TYPE> = {
        monthly: PACKAGE_TYPE.MONTHLY,
        yearly: PACKAGE_TYPE.ANNUAL,
        lifetime: PACKAGE_TYPE.LIFETIME,
      };

      // First try to get by package type
      const pkgType = packageTypeMap[type];
      const pkg = state.offerings.availablePackages?.find(
        (p) => p.packageType === pkgType
      );

      if (pkg) return pkg;

      // Fallback: try to get by identifier
      const identifiers: Record<PackageType, string[]> = {
        monthly: ['monthly', '$rc_monthly'],
        yearly: ['yearly', 'annual', '$rc_annual'],
        lifetime: ['lifetime', '$rc_lifetime'],
      };

      return (
        state.offerings.availablePackages?.find((p) =>
          identifiers[type].includes(p.identifier.toLowerCase())
        ) || null
      );
    },
    [state.offerings]
  );

  const monthlyPackage = getPackage('monthly');
  const yearlyPackage = getPackage('yearly');
  const lifetimePackage = getPackage('lifetime');

  // --------------------------------------------------------------------------
  // Purchase operations
  // --------------------------------------------------------------------------

  const purchase = useCallback(async (pkg: PurchasesPackage): Promise<boolean> => {
    try {
      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });

      if (mountedRef.current) {
        setState((prev) => ({ ...prev, customerInfo }));
      }

      // Sync to backend
      await syncSubscriptionToBackend(customerInfo);

      return true;
    } catch (e: unknown) {
      // Check if user cancelled
      if (e && typeof e === 'object' && 'userCancelled' in e && e.userCancelled) {
        return false;
      }

      console.error('[useRevenueCat] purchase error:', e);

      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          error: e instanceof Error ? e.message : 'Purchase failed',
        }));
      }

      return false;
    }
  }, []);

  const purchasePackageByType = useCallback(
    async (type: PackageType): Promise<boolean> => {
      const pkg = getPackage(type);
      if (!pkg) {
        console.error(`[useRevenueCat] No ${type} package available`);
        setState((prev) => ({
          ...prev,
          error: `No ${type} subscription package available`,
        }));
        return false;
      }
      return purchase(pkg);
    },
    [getPackage, purchase]
  );

  // --------------------------------------------------------------------------
  // Restore purchases
  // --------------------------------------------------------------------------

  const restorePurchases = useCallback(async (): Promise<boolean> => {
    try {
      const { customerInfo } = await Purchases.restorePurchases();

      if (mountedRef.current) {
        setState((prev) => ({ ...prev, customerInfo }));
      }

      // Sync to backend
      await syncSubscriptionToBackend(customerInfo);

      return true;
    } catch (e) {
      console.error('[useRevenueCat] restore error:', e);

      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          error: e instanceof Error ? e.message : 'Failed to restore purchases',
        }));
      }

      return false;
    }
  }, []);

  // --------------------------------------------------------------------------
  // Paywall presentation (RevenueCat UI)
  // --------------------------------------------------------------------------

  const presentPaywall = useCallback(
    async (offeringId?: string): Promise<PaywallPresentResult> => {
      const defaultResult: PaywallPresentResult = {
        success: false,
        purchased: false,
        restored: false,
        cancelled: false,
        error: false,
      };

      if (Capacitor.getPlatform() === 'web') {
        return { ...defaultResult, error: true };
      }

      try {
        let options: { offering?: PurchasesOffering } = {};

        // If specific offering requested, fetch it and pass as object
        if (offeringId) {
          const offeringsResult = await Purchases.getOfferings();
          const targetOffering = offeringsResult.all?.[offeringId];
          if (targetOffering) {
            options = { offering: targetOffering };
          }
        }

        const paywallResult = await RevenueCatUI.presentPaywall(options);

        // Reload customer info after paywall
        await loadData();

        switch (paywallResult.result) {
          case PAYWALL_RESULT.PURCHASED:
            return { ...defaultResult, success: true, purchased: true };
          case PAYWALL_RESULT.RESTORED:
            return { ...defaultResult, success: true, restored: true };
          case PAYWALL_RESULT.CANCELLED:
            return { ...defaultResult, cancelled: true };
          case PAYWALL_RESULT.NOT_PRESENTED:
            return defaultResult;
          case PAYWALL_RESULT.ERROR:
          default:
            return { ...defaultResult, error: true };
        }
      } catch (e) {
        console.error('[useRevenueCat] presentPaywall error:', e);
        return { ...defaultResult, error: true };
      }
    },
    [loadData]
  );

  const presentPaywallIfNeeded = useCallback(
    async (entitlementId?: string): Promise<PaywallPresentResult> => {
      const defaultResult: PaywallPresentResult = {
        success: false,
        purchased: false,
        restored: false,
        cancelled: false,
        error: false,
      };

      if (Capacitor.getPlatform() === 'web') {
        return { ...defaultResult, error: true };
      }

      try {
        const paywallResult = await RevenueCatUI.presentPaywallIfNeeded({
          requiredEntitlementIdentifier: entitlementId || AMPLEE_PRO_ENTITLEMENT,
        });

        // Reload customer info after paywall
        await loadData();

        switch (paywallResult.result) {
          case PAYWALL_RESULT.PURCHASED:
            return { ...defaultResult, success: true, purchased: true };
          case PAYWALL_RESULT.RESTORED:
            return { ...defaultResult, success: true, restored: true };
          case PAYWALL_RESULT.CANCELLED:
            return { ...defaultResult, cancelled: true };
          case PAYWALL_RESULT.NOT_PRESENTED:
            // User already has entitlement
            return { ...defaultResult, success: true };
          case PAYWALL_RESULT.ERROR:
          default:
            return { ...defaultResult, error: true };
        }
      } catch (e) {
        console.error('[useRevenueCat] presentPaywallIfNeeded error:', e);
        return { ...defaultResult, error: true };
      }
    },
    [loadData]
  );

  // --------------------------------------------------------------------------
  // Customer Center (subscription management)
  // --------------------------------------------------------------------------

  const presentCustomerCenter = useCallback(async (): Promise<void> => {
    if (Capacitor.getPlatform() === 'web') {
      // On web, open platform-specific subscription management
      window.open('https://apps.apple.com/account/subscriptions', '_blank');
      return;
    }

    try {
      await RevenueCatUI.presentCustomerCenter();
      // Reload data after customer center closes
      await loadData();
    } catch (e) {
      console.error('[useRevenueCat] presentCustomerCenter error:', e);
      // Fallback to platform URLs
      const platform = Capacitor.getPlatform();
      if (platform === 'ios') {
        window.open('https://apps.apple.com/account/subscriptions', '_blank');
      } else if (platform === 'android') {
        window.open('https://play.google.com/store/account/subscriptions', '_blank');
      }
    }
  }, [loadData]);

  // --------------------------------------------------------------------------
  // User identification
  // --------------------------------------------------------------------------

  const login = useCallback(async (userId: string): Promise<void> => {
    if (!state.isConfigured || Capacitor.getPlatform() === 'web') return;

    try {
      const { customerInfo } = await Purchases.logIn({ appUserID: userId });
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, customerInfo }));
      }
    } catch (e) {
      console.error('[useRevenueCat] login error:', e);
    }
  }, [state.isConfigured]);

  const logout = useCallback(async (): Promise<void> => {
    if (!state.isConfigured || Capacitor.getPlatform() === 'web') return;

    try {
      const { customerInfo } = await Purchases.logOut();
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, customerInfo }));
      }
    } catch (e) {
      console.error('[useRevenueCat] logout error:', e);
    }
  }, [state.isConfigured]);

  // --------------------------------------------------------------------------
  // Reload
  // --------------------------------------------------------------------------

  const reload = useCallback(async () => {
    await loadData();
  }, [loadData]);

  // --------------------------------------------------------------------------
  // Return
  // --------------------------------------------------------------------------

  return {
    ...state,
    hasEntitlement,
    hasAmpleePro,
    getPackage,
    monthlyPackage,
    yearlyPackage,
    lifetimePackage,
    purchase,
    purchasePackage: purchasePackageByType,
    restorePurchases,
    presentPaywall,
    presentPaywallIfNeeded,
    presentCustomerCenter,
    reload,
    login,
    logout,
  };
}

// ============================================================================
// Helper: Sync subscription to backend
// ============================================================================

async function syncSubscriptionToBackend(customerInfo: CustomerInfo) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;

    // Check if user has Amplee Pro entitlement
    const ampleProEntitlement = customerInfo.entitlements.active[AMPLEE_PRO_ENTITLEMENT];

    if (ampleProEntitlement) {
      console.log('[useRevenueCat] User has Amplee Pro entitlement:', {
        isActive: ampleProEntitlement.isActive,
        willRenew: ampleProEntitlement.willRenew,
        expirationDate: ampleProEntitlement.expirationDate,
        productIdentifier: ampleProEntitlement.productIdentifier,
      });

      // Note: RevenueCat webhooks should handle syncing to the database.
      // This is just for logging/debugging purposes.
      // If you need client-side sync, call your API here:
      // await fetch('/api/subscriptions/sync', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${session.access_token}`,
      //   },
      //   body: JSON.stringify({
      //     entitlementId: AMPLEE_PRO_ENTITLEMENT,
      //     isActive: ampleProEntitlement.isActive,
      //     expirationDate: ampleProEntitlement.expirationDate,
      //   }),
      // });
    }
  } catch (e) {
    console.error('[useRevenueCat] sync error:', e);
  }
}

// ============================================================================
// Export constants for use elsewhere
// ============================================================================

export { AMPLEE_PRO_ENTITLEMENT };
