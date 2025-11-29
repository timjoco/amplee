import { IonIcon } from '@ionic/react';
import { add, person } from 'ionicons/icons';
import * as React from 'react';
import { FiHome } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import AvatarImageMobile from '../../components/ui/AvatarImageMobile';
import { supabase } from '../../lib/supabase';

type MiniProfile = {
  name: string;
  avatarUrl: string | null;
};

const AVATAR_BUCKET = 'profile-avatars';

export default function MobileBottomNav() {
  const nav = useNavigate();
  const { pathname } = useLocation();

  const [profile, setProfile] = React.useState<MiniProfile | null>(null);

  React.useEffect(() => {
    let alive = true;

    const fetchProfile = async (userId: string, fallbackName: string) => {
      const { data, error: profErr } = await supabase
        .from('profiles')
        .select('display_name, first_name, last_name, avatar_url')
        .eq('id', userId)
        .maybeSingle();

      if (!alive) return;

      if (profErr) {
        console.error(profErr);
        setProfile({ name: fallbackName, avatarUrl: null });
        return;
      }

      const displayName =
        (data?.display_name as string | null) &&
        data?.display_name.trim().length
          ? data.display_name
          : [data?.first_name, data?.last_name]
              .filter(Boolean)
              .map((n) => (n as string).trim())
              .filter((n) => n.length > 0)
              .join(' ') || fallbackName;

      setProfile({
        name: displayName,
        avatarUrl: data?.avatar_url ?? null,
      });
    };

    const handleAuthChange = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const session = sessionData?.session;

      if (!session) {
        // User logged out - clear profile
        if (alive) setProfile(null);
        return;
      }

      const fallbackName =
        session.user.user_metadata?.full_name ??
        session.user.email ??
        'Your profile';

      await fetchProfile(session.user.id, fallbackName);
    };

    // Initial fetch
    handleAuthChange();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, _session) => {
        // Re-fetch on sign in, sign out, or user update
        if (
          event === 'SIGNED_IN' ||
          event === 'SIGNED_OUT' ||
          event === 'USER_UPDATED'
        ) {
          handleAuthChange();
        }
      }
    );

    const handleAvatarChanged = (ev: Event) => {
      const detail = (ev as CustomEvent<{ avatar_url?: string }>).detail;
      const newUrl = detail?.avatar_url;
      if (!newUrl) return;

      setProfile((prev) => (prev ? { ...prev, avatarUrl: newUrl } : prev));
    };

    window.addEventListener('profiles:avatar_changed', handleAvatarChanged);

    return () => {
      alive = false;
      authListener.subscription.unsubscribe();
      window.removeEventListener(
        'profiles:avatar_changed',
        handleAvatarChanged
      );
    };
  }, []);

  const hidden =
    pathname.startsWith('/login') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/invite/') ||
    pathname.startsWith('/profile/basics') ||
    // event detail + sub-pages (chat / rollcall / setlist / notes / files / settings)
    /^\/bands\/[^/]+\/events\/[^/]+(\/(chat|rollcall|setlist|notes|files))?\/?$/.test(
      pathname
    ) ||
    /^\/bands\/[^/]+\/events\/[^/]+\/settings\/?$/.test(pathname) ||
    /^\/event\/[^/]+\/?$/.test(pathname) ||
    // band settings
    /^\/bands\/[^/]+\/settings\/?$/i.test(pathname) ||
    // proposal detail
    /^\/bands\/[^/]+\/proposals\/[^/]+$/.test(pathname) ||
    // song library
    /^\/bands\/[^/]+\/songs\/?$/.test(pathname) ||
    // song sheet
    /^\/bands\/[^/]+\/songs\/[^/]+\/?$/.test(pathname);

  if (hidden) return null;

  const HOME_INDEX = 0;
  const ACCOUNT_INDEX = 2;
  const selectedIndex: number = pathname.startsWith('/profile')
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
          height: 64,
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
          <FiHome size={26} />
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
          <IonIcon icon={add} style={{ fontSize: 30 }} />
        </NavBtn>

        <NavBtn
          ariaLabel="Account"
          selected={selectedIndex === ACCOUNT_INDEX}
          onClick={() => {
            if (!pathname.startsWith('/profile')) {
              nav('/profile');
            }
          }}
        >
          {profile ? (
            <AvatarImageMobile
              name={profile.name}
              bucket={AVATAR_BUCKET}
              avatarPath={profile.avatarUrl ?? undefined}
              size={32}
              style={{
                borderWidth: selectedIndex === ACCOUNT_INDEX ? 2 : 1,
              }}
            />
          ) : (
            <IonIcon icon={person} style={{ fontSize: 26 }} />
          )}
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
  const baseColor = isPrimary
    ? 'rgba(255,255,255,0.98)'
    : selected
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
        padding: '10px 8px',
        color: baseColor,
      }}
    >
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          transition: 'transform 150ms ease, background-color 150ms ease',
          transform: selected ? 'scale(1.06)' : 'scale(1.02)',
          borderRadius: 12,
          padding: 4,
          backgroundColor: 'transparent',
        }}
      >
        {children}
      </div>
    </button>
  );
}
