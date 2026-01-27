/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  IonContent,
  IonHeader,
  IonIcon,
  IonPage,
  IonSpinner,
  IonToolbar,
} from '@ionic/react';
import {
  chevronBackOutline,
  refreshOutline,
  settingsOutline,
  sparklesOutline,
  storefrontOutline,
} from 'ionicons/icons';
import { Capacitor } from '@capacitor/core';
import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ActiveSubscriptions } from './components/ActiveSubscriptions';
import { BandSelectorModal } from './components/BandSelectorModal';
import { PaywallModal } from './components/PaywallModal';
import { ProductCard } from './components/ProductCard';
import { useMySubscriptions } from './hooks/useMySubscriptions';
import { useProducts } from './hooks/useProducts';
import { useRevenueCat } from './hooks/useRevenueCat';
import { useStartTrial } from './hooks/useStartTrial';
import type { ProductRow } from './types/subscriptionTypes';

// Premium purple/violet theme
const PREMIUM = {
  primary: '#8b5cf6',
  light: '#a78bfa',
  glow: 'rgba(139, 92, 246, 0.4)',
  subtle: 'rgba(139, 92, 246, 0.08)',
  border: 'rgba(139, 92, 246, 0.25)',
};

type ModalState = {
  type: 'selectBand' | 'paywall' | null;
  action: 'trial' | 'subscribe' | null;
  product: ProductRow | null;
  bandId: string | null;
  bandName: string | null;
};

export default function StorePage() {
  const nav = useNavigate();
  const { products, loading: productsLoading } = useProducts();
  const { subscriptions, loading: subsLoading, reload: reloadSubs } = useMySubscriptions();
  const { starting, error: trialError, startTrial } = useStartTrial();
  const {
    hasAmpleePro,
    monthlyPackage,
    yearlyPackage,
    lifetimePackage,
    purchase,
    purchasePackage,
    restorePurchases,
    presentPaywall,
    presentCustomerCenter,
    isLoading: rcLoading,
    reload: reloadRC,
  } = useRevenueCat();

  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);

  const [modalState, setModalState] = useState<ModalState>({
    type: null,
    action: null,
    product: null,
    bandId: null,
    bandName: null,
  });

  // Get band IDs that already have access to each product (for exclusion)
  const getExcludedBandIds = useCallback(
    (productSlug: string) => {
      return subscriptions
        .filter((s) => s.productSlug === productSlug && (s.hasAccess || s.isTrialing))
        .map((s) => s.bandId);
    },
    [subscriptions]
  );

  // Handle "Try Free" click on product card
  const handleStartTrial = (product: ProductRow) => {
    setModalState({
      type: 'selectBand',
      action: 'trial',
      product,
      bandId: null,
      bandName: null,
    });
  };

  // Handle "Subscribe" click on product card - use RevenueCat native paywall
  const handleSubscribe = async (_product: ProductRow) => {
    setPurchaseError(null);

    // Use RevenueCat's native paywall UI
    const result = await presentPaywall();

    if (result.purchased || result.restored) {
      void reloadSubs();
      void reloadRC();
      nav('/store/success');
    } else if (result.error) {
      setPurchaseError('Unable to show subscription options. Please try again.');
    }
    // If cancelled, do nothing
  };

  // Handle band selection (for trials)
  const handleBandSelected = (band: { id: string; name: string }) => {
    if (!modalState.product) return;

    // Show paywall for confirmation
    setModalState({
      ...modalState,
      type: 'paywall',
      bandId: band.id,
      bandName: band.name,
    });
  };

  // Handle trial confirmation
  const handleConfirmTrial = async () => {
    if (!modalState.bandId || !modalState.product) return;

    const result = await startTrial(modalState.bandId, modalState.product.slug);
    if (result) {
      setModalState({ type: null, action: null, product: null, bandId: null, bandName: null });
      void reloadSubs();
    }
  };

  // Handle subscribe confirmation via RevenueCat native paywall
  const handleConfirmSubscribe = async () => {
    setPurchaseError(null);

    // Use RevenueCat's native paywall
    const result = await presentPaywall();

    if (result.purchased || result.restored) {
      setModalState({ type: null, action: null, product: null, bandId: null, bandName: null });
      void reloadSubs();
      void reloadRC();
      nav('/store/success');
    } else if (result.error) {
      setPurchaseError('Purchase failed. Please try again.');
    }
  };

  // Handle manage subscription - use RevenueCat Customer Center
  const handleManageSubscription = async () => {
    await presentCustomerCenter();
    // Reload after customer center closes
    void reloadSubs();
    void reloadRC();
  };

  // Handle restore purchases
  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    try {
      const success = await restorePurchases();
      if (success) {
        void reloadSubs();
        void reloadRC();
      }
    } finally {
      setIsRestoring(false);
    }
  };

  const closeModal = () => {
    setModalState({ type: null, action: null, product: null, bandId: null, bandName: null });
  };

  const loading = productsLoading || subsLoading;
  const isMobile = Capacitor.getPlatform() !== 'web';

  return (
    <IonPage>
      <IonHeader translucent className="ion-no-border">
        <IonToolbar
          style={{
            '--background': 'rgba(8, 8, 14, 0.95)',
            '--border-width': 0,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              gap: 12,
            }}
          >
            {/* Back Button */}
            <button
              onClick={() => nav(-1)}
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                display: 'grid',
                placeItems: 'center',
                color: '#9ca3af',
                flexShrink: 0,
              }}
            >
              <IonIcon icon={chevronBackOutline} style={{ fontSize: 20 }} />
            </button>

            {/* Title Section */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <IonIcon
                  icon={storefrontOutline}
                  style={{ color: PREMIUM.light, fontSize: 20 }}
                />
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: '#f9fafb',
                    margin: 0,
                    letterSpacing: '-0.5px',
                  }}
                >
                  Amplee Gear
                </h1>
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#6b7280',
                  marginTop: 2,
                  marginLeft: 28,
                }}
              >
                Power-ups for your band
              </div>
            </div>

            {/* Manage Subscriptions Button (mobile only, if subscribed) */}
            {isMobile && hasAmpleePro && (
              <button
                onClick={handleManageSubscription}
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'grid',
                  placeItems: 'center',
                  color: '#9ca3af',
                  flexShrink: 0,
                }}
                title="Manage Subscription"
              >
                <IonIcon icon={settingsOutline} style={{ fontSize: 20 }} />
              </button>
            )}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent
        fullscreen
        style={{
          '--background': 'linear-gradient(180deg, #08080e 0%, #04040a 100%)',
        }}
      >
        {loading ? (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              height: '100%',
              gap: 12,
            }}
          >
            <div style={{ textAlign: 'center' }}>
              <IonSpinner
                style={{
                  '--color': PREMIUM.primary,
                  width: 32,
                  height: 32,
                }}
              />
              <div
                style={{
                  color: '#6b7280',
                  fontSize: 13,
                  marginTop: 12,
                }}
              >
                Loading store...
              </div>
            </div>
          </div>
        ) : (
          <div
            style={{
              padding: 16,
              maxWidth: 1200,
              margin: '0 auto',
              paddingBottom: 'calc(40px + env(safe-area-inset-bottom))',
            }}
          >
            {/* Pro Status Banner */}
            {hasAmpleePro && (
              <div
                style={{
                  background: `linear-gradient(135deg, ${PREMIUM.primary}20 0%, ${PREMIUM.light}10 100%)`,
                  border: `1px solid ${PREMIUM.border}`,
                  borderRadius: 16,
                  padding: 20,
                  marginBottom: 24,
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: PREMIUM.light,
                    marginBottom: 4,
                  }}
                >
                  You've got all the Gear
                </div>
                <div style={{ fontSize: 13, color: '#9ca3af' }}>
                  Thank you for your support! You have access to all Pro features.
                </div>
              </div>
            )}

            {/* Products Section */}
            <div style={{ marginBottom: 24 }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: PREMIUM.primary,
                  }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                  }}
                >
                  Pro Features
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: 16,
                  justifyItems: 'start',
                }}
              >
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onStartTrial={() => handleStartTrial(product)}
                    onSubscribe={() => handleSubscribe(product)}
                  />
                ))}
              </div>

              {products.length === 0 && (
                <div
                  style={{
                    textAlign: 'center',
                    padding: 32,
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 16,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                  }}
                >
                  <IonIcon
                    icon={sparklesOutline}
                    style={{ fontSize: 32, color: '#6b7280', marginBottom: 12 }}
                  />
                  <p style={{ margin: 0, fontSize: 14, color: '#6b7280' }}>
                    No products available yet
                  </p>
                </div>
              )}
            </div>

            {/* Available Packages Info (on mobile) */}
            {isMobile && (monthlyPackage || yearlyPackage || lifetimePackage) && (
              <div style={{ marginBottom: 24 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#3b82f6',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Subscription Options
                  </span>
                </div>

                <div
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    borderRadius: 16,
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    overflow: 'hidden',
                  }}
                >
                  {monthlyPackage && (
                    <PackageRow
                      label="Monthly"
                      price={monthlyPackage.product.priceString}
                      description="/month"
                      onSelect={async () => {
                        const success = await purchase(monthlyPackage);
                        if (success) void reloadSubs();
                      }}
                    />
                  )}
                  {yearlyPackage && (
                    <PackageRow
                      label="Yearly"
                      price={yearlyPackage.product.priceString}
                      description="/year"
                      highlight
                      onSelect={async () => {
                        const success = await purchase(yearlyPackage);
                        if (success) void reloadSubs();
                      }}
                    />
                  )}
                  {lifetimePackage && (
                    <PackageRow
                      label="Lifetime"
                      price={lifetimePackage.product.priceString}
                      description="one-time"
                      onSelect={async () => {
                        const success = await purchase(lifetimePackage);
                        if (success) void reloadSubs();
                      }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Subscriptions Section - Only show if user has subscriptions or trials */}
            {subscriptions.length > 0 && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 14,
                  }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: '#22c55e',
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                    }}
                  >
                    Your Subscriptions
                  </span>
                </div>

                <ActiveSubscriptions
                  subscriptions={subscriptions}
                  onManage={handleManageSubscription}
                />
              </div>
            )}

            {/* Restore Purchases - only show on mobile */}
            {isMobile && (
              <button
                onClick={handleRestorePurchases}
                disabled={isRestoring}
                style={{
                  width: '100%',
                  padding: '14px 20px',
                  marginTop: 24,
                  borderRadius: 12,
                  background: 'transparent',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  color: '#6b7280',
                  fontSize: 14,
                  fontWeight: 500,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  opacity: isRestoring ? 0.6 : 1,
                }}
              >
                {isRestoring ? (
                  <IonSpinner
                    style={{ '--color': '#6b7280', width: 16, height: 16 }}
                  />
                ) : (
                  <IonIcon icon={refreshOutline} style={{ fontSize: 16 }} />
                )}
                {isRestoring ? 'Restoring...' : 'Restore Purchases'}
              </button>
            )}

            {/* Error Display */}
            {purchaseError && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 8,
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  color: '#ef4444',
                  fontSize: 13,
                  textAlign: 'center',
                }}
              >
                {purchaseError}
              </div>
            )}
          </div>
        )}
      </IonContent>

      {/* Band Selector Modal */}
      {modalState.type === 'selectBand' && modalState.product && (
        <BandSelectorModal
          title={
            modalState.action === 'trial'
              ? 'Start Trial for which band?'
              : 'Subscribe for which band?'
          }
          subtitle={`Select a band to enable ${modalState.product.name}`}
          excludeBandIds={getExcludedBandIds(modalState.product.slug)}
          requireAdmin={true}
          onSelect={handleBandSelected}
          onClose={closeModal}
        />
      )}

      {/* Paywall Modal (for trials - uses our custom modal) */}
      {modalState.type === 'paywall' && modalState.product && modalState.bandId && (
        <PaywallModal
          product={modalState.product}
          bandId={modalState.bandId}
          bandName={modalState.bandName || undefined}
          onClose={closeModal}
          onStartTrial={handleConfirmTrial}
          onSubscribe={handleConfirmSubscribe}
          isStartingTrial={starting}
          trialError={trialError || purchaseError}
        />
      )}
    </IonPage>
  );
}

// Package Row Component for subscription options
function PackageRow({
  label,
  price,
  description,
  highlight,
  onSelect,
}: {
  label: string;
  price: string;
  description: string;
  highlight?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 16px',
        background: highlight ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
        borderBottom: '1px solid rgba(255, 255, 255, 0.04)',
        color: 'inherit',
        textAlign: 'left',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: highlight ? '#3b82f6' : '#f9fafb',
          }}
        >
          {label}
        </span>
        {highlight && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#3b82f6',
              background: 'rgba(59, 130, 246, 0.15)',
              padding: '2px 6px',
              borderRadius: 4,
              textTransform: 'uppercase',
            }}
          >
            Best Value
          </span>
        )}
      </div>
      <div style={{ textAlign: 'right' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#f9fafb' }}>
          {price}
        </span>
        <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 4 }}>
          {description}
        </span>
      </div>
    </button>
  );
}
