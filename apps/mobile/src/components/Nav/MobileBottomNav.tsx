import { IonIcon } from '@ionic/react';
import { add, home, person } from 'ionicons/icons';
import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Fixed bottom nav for mobile. No floating FAB.
 * - Home → /home
 * - Create → dispatches 'global-create:open' (doesn't navigate)
 * - Settings → /profiles/settings
 *
 * NOTE: This component is page-agnostic. Mount it once (e.g., in main.tsx) so it
 * persists across routes. Add bottom padding to your <IonContent> so content
 * doesn't sit under the nav (see usage note below).
 */

export default function MobileBottomNav() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  // Hide on auth/onboarding routes
  const hidden =
    pathname.startsWith('/login') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/invite/');

  if (hidden) return null;

  // Only two tabs are "selectable": Home (0) and Account (2).
  // The middle "Create" is just an action button (never selected).
  const HOME_INDEX = 0;
  const ACCOUNT_INDEX = 2;
  const selectedIndex: number = pathname.startsWith('/profiles/settings')
    ? ACCOUNT_INDEX
    : HOME_INDEX;

  return (
    <div
      role="navigation"
      aria-label="Bottom Navigation"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        // Safe-area + glassy surface
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        background:
          'linear-gradient(180deg, rgba(12,12,16,0.86), rgba(12,12,16,0.92))',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          alignItems: 'center',
          height: 56,
          maxWidth: 640,
          margin: '0 auto',
        }}
      >
        <NavBtn
          label="Home"
          selected={selectedIndex === HOME_INDEX}
          onClick={() => {
            if (pathname !== '/home') nav('/home');
          }}
        >
          <IonIcon icon={home} />
        </NavBtn>

        <NavBtn
          label="Create"
          selected={false} // middle action is never "selected"
          onClick={() => {
            (document.activeElement as HTMLElement | null)?.blur?.();
            window.dispatchEvent(new CustomEvent('global-create:open'));
          }}
        >
          <IonIcon icon={add} />
        </NavBtn>

        <NavBtn
          label="Account"
          selected={selectedIndex === ACCOUNT_INDEX}
          onClick={() => {
            if (!pathname.startsWith('/profiles/settings')) {
              nav('/profiles/settings');
            }
          }}
        >
          <IonIcon icon={person} />
        </NavBtn>
      </div>
    </div>
  );
}

function NavBtn({
  children,
  label,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        // Reset
        appearance: 'none',
        border: 0,
        outline: 'none',
        background: 'transparent',
        // Layout
        height: '100%',
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        gap: 2,
        // Touch target
        padding: '6px 8px',
        // Ink color
        color: selected ? 'rgba(255,255,255,0.98)' : 'rgba(255,255,255,0.75)',
      }}
    >
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          transform: selected ? 'scale(1.04)' : 'none',
          transition: 'transform 160ms ease',
        }}
      >
        {children}
      </div>
      <span
        style={{
          fontSize: 10,
          lineHeight: 1,
          letterSpacing: 0.3,
          marginTop: 6,
          opacity: selected ? 1 : 0.85,
        }}
      >
        {label}
      </span>
    </button>
  );
}
