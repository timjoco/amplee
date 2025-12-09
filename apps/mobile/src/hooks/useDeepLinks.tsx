// apps/mobile/src/hooks/useDeepLinks.tsx
/* eslint-disable @typescript-eslint/no-explicit-any */
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useDeepLinks() {
  const nav = useNavigate();

  useEffect(() => {
    let listener: PluginListenerHandle | undefined;

    // Set up the listener and keep the handle
    App.addListener('appUrlOpen', (event: any) => {
      try {
        const url = new URL(event.url);

        // e.g. amplee://invite/<token>
        if (url.hostname === 'invite') {
          const token = url.pathname.replace(/^\/+/, ''); // strip leading /
          if (token) {
            nav(`/invite/${encodeURIComponent(token)}`);
          }
        }
      } catch (e) {
        console.error('[useDeepLinks] failed to parse app url', e);
      }
    })
      .then((handle) => {
        listener = handle;
      })
      .catch((err) => {
        console.error('[useDeepLinks] failed to add listener', err);
      });

    // Cleanup: remove listener if we got one
    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [nav]);
}
