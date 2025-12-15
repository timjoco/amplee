// apps/mobile/src/hooks/useDeepLinks.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function routeFromUrl(raw: string): string | null {
  try {
    const url = new URL(raw);

    // Universal link: https://amplee.app/invite/<token>
    if (url.hostname === 'amplee.app' && url.pathname.startsWith('/invite/')) {
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

  useEffect(() => {
    let listener: PluginListenerHandle | undefined;

    // 1) Cold start (app launched from link)
    App.getLaunchUrl()
      .then((res) => {
        const raw = res?.url;
        if (!raw) return;
        const route = routeFromUrl(raw);
        if (route) nav(route, { replace: true });
      })
      .catch(() => {});

    // 2) Warm start / foreground (app already running)
    App.addListener('appUrlOpen', (event: any) => {
      const raw = event?.url;
      if (!raw) return;
      const route = routeFromUrl(raw);
      if (route) nav(route, { replace: true });
    })
      .then((handle) => (listener = handle))
      .catch((err) =>
        console.error('[useDeepLinks] failed to add listener', err)
      );

    return () => {
      listener?.remove();
    };
  }, [nav]);
}
