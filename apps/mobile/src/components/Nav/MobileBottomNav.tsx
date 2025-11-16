import { IonIcon } from '@ionic/react';
import { add, home, person } from 'ionicons/icons';
import * as React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export default function MobileBottomNav() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  const hidden =
    pathname.startsWith('/login') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/invite/');

  if (hidden) return null;

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
        paddingBottom: 'max(env(safe-area-inset-bottom), 8px)',
        background:
          'linear-gradient(180deg, rgba(8,8,12,0.9), rgba(8,8,12,0.98))',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '0 -6px 18px rgba(0,0,0,0.55)',
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
          ariaLabel="Home"
          selected={selectedIndex === HOME_INDEX}
          onClick={() => {
            if (pathname !== '/home') nav('/home');
          }}
        >
          <IonIcon icon={home} />
        </NavBtn>

        <NavBtn
          ariaLabel="Create"
          selected={false}
          onClick={() => {
            (document.activeElement as HTMLElement | null)?.blur?.();
            window.dispatchEvent(new CustomEvent('global-create:open'));
          }}
          isPrimary
        >
          <IonIcon icon={add} />
        </NavBtn>

        <NavBtn
          ariaLabel="Account"
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
  ariaLabel,
  selected,
  onClick,
  isPrimary = false,
}: {
  children: React.ReactNode;
  ariaLabel: string;
  selected: boolean;
  onClick: () => void;
  isPrimary?: boolean;
}) {
  const baseColor = selected
    ? 'rgba(255,255,255,0.98)'
    : 'rgba(255,255,255,0.75)';

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onClick}
      style={{
        appearance: 'none',
        border: 0,
        outline: 'none',
        background: 'transparent',
        height: '100%',
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: '6px 8px',
        color: baseColor,
      }}
    >
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          transition: 'transform 150ms ease, background-color 150ms ease',
          transform: selected ? 'scale(1.06)' : 'scale(1)',
          borderRadius: isPrimary ? 999 : 12,
          padding: isPrimary ? 8 : 4,
          backgroundColor: isPrimary ? 'rgba(255,255,255,0.08)' : 'transparent',
        }}
      >
        {children}
      </div>
    </button>
  );
}
