/* eslint-disable @typescript-eslint/no-explicit-any */
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

// ✅ FIX: Track handled URLs globally (survives re-renders and re-mounts)
const handledUrls = new Set<string>();

// ✅ FIX: Track URLs we've already visited and left (don't go back)
const completedInvites = new Set<string>();

function routeFromUrl(raw: string): string | null {
  try {
    const url = new URL(raw);

    // Universal link: https://amplee.app/invite/<token> or https://www.amplee.app/invite/<token>
    if ((url.hostname === 'amplee.app' || url.hostname === 'www.amplee.app') && url.pathname.startsWith('/invite/')) {
      const token = url.pathname.split('/invite/')[1]?.split('/')[0];
      return token ? `/invite/${encodeURIComponent(token)}` : null;
    }

    // Custom scheme fallback: amplee://invite/<token>
    // For amplee://invite/<token>, hostname === 'invite' and pathname === '/<token>'
    if (url.protocol === 'amplee:' && url.hostname === 'invite') {
      const token = url.pathname.replace(/^\/+/, '');
      return token ? `/invite/${encodeURIComponent(token)}` : null;
    }

    return null;
  } catch {
    return null;
  }
}

export function useDeepLinks() {
  const nav = useNavigate();
  const location = useLocation();
  const initializedRef = useRef(false);

  useEffect(() => {
    // ✅ FIX: Only run once on mount
    if (initializedRef.current) {
      console.log('[useDeepLinks] Already initialized, skipping');
      return;
    }
    initializedRef.current = true;

    let listener: PluginListenerHandle | undefined;

    const handleUrl = (raw: string | undefined | null, source: string) => {
      if (!raw) return;

      const route = routeFromUrl(raw);
      if (!route) return;

      // ✅ FIX: Don't re-handle URLs we've already processed
      if (handledUrls.has(raw)) {
        console.log(`[useDeepLinks] ${source}: already handled, skipping`, raw);
        return;
      }

      // ✅ FIX: Don't go back to completed invites
      if (completedInvites.has(route)) {
        console.log(
          `[useDeepLinks] ${source}: invite already completed, skipping`,
          route
        );
        return;
      }

      // ✅ FIX: Don't navigate if we're already on this route
      const currentPath = window.location.pathname;
      if (currentPath === route || currentPath.startsWith('/invite/')) {
        console.log(
          `[useDeepLinks] ${source}: already on invite route, skipping`,
          route
        );
        handledUrls.add(raw);
        return;
      }

      console.log(`[useDeepLinks] ${source}: navigating to`, route);
      handledUrls.add(raw);
      nav(route, { replace: true });
    };

    // 1) Cold start (app launched from link)
    App.getLaunchUrl()
      .then((res) => handleUrl(res?.url, 'getLaunchUrl'))
      .catch(() => {});

    // 2) Warm start / foreground (app already running)
    App.addListener('appUrlOpen', (event: any) => {
      handleUrl(event?.url, 'appUrlOpen');
    })
      .then((handle) => (listener = handle))
      .catch((err) =>
        console.error('[useDeepLinks] failed to add listener', err)
      );

    return () => {
      listener?.remove();
      // Reset on unmount so it can reinitialize if needed
      initializedRef.current = false;
    };
  }, [nav]);
}

// ✅ Call this when user leaves an invite (accepted, dismissed, etc.)
export function markInviteCompleted(token: string) {
  const route = `/invite/${encodeURIComponent(token)}`;
  completedInvites.add(route);
  console.log('[useDeepLinks] Marked invite as completed:', route);
}

// ✅ Optional: Clear a URL from handled set
export function clearHandledDeepLink(url: string) {
  handledUrls.delete(url);
}
