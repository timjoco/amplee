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

    App.addListener('appUrlOpen', (event: any) => {
      console.log('[useDeepLinks] appUrlOpen:', event.url);

      try {
        const url = new URL(event.url);

        // Handle Universal Links: https://amplee.app/invite/<token>
        if (
          url.hostname === 'amplee.app' &&
          url.pathname.startsWith('/invite/')
        ) {
          const token = url.pathname.replace('/invite/', '');
          if (token) {
            console.log('[useDeepLinks] navigating to invite:', token);
            nav(`/invite/${encodeURIComponent(token)}`);
          }
          return;
        }

        // Handle custom scheme: amplee://invite/<token> (fallback)
        if (url.hostname === 'invite') {
          const token = url.pathname.replace(/^\/+/, '');
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

    return () => {
      if (listener) {
        listener.remove();
      }
    };
  }, [nav]);
}
