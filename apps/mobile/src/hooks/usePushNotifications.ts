import { Capacitor } from '@capacitor/core';
import { FirebaseMessaging } from '@capacitor-firebase/messaging';
import {
  PushNotifications,
  type PushNotificationSchema,
  type ActionPerformed,
} from '@capacitor/push-notifications';
import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

// Track initialization globally to survive React strict mode double-renders
let globalInitialized = false;

/**
 * Hook to handle push notifications:
 * - Requests permission
 * - Registers FCM token with Supabase
 * - Handles notification taps for deep linking
 */
export function usePushNotifications(userId: string | null | undefined) {
  const navigate = useNavigate();
  const currentTokenRef = useRef<string | null>(null);
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    // Only run on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.warn('[Push] Not a native platform, skipping');
      return;
    }

    // Only initialize once globally (survives strict mode)
    if (globalInitialized) {
      console.warn('[Push] Already initialized globally, skipping');
      return;
    }

    // Need a user to register the token
    if (!userId) {
      console.warn('[Push] No userId, skipping');
      return;
    }

    console.warn('[Push] Initializing push notifications for user:', userId);
    globalInitialized = true;

    const platform = Capacitor.getPlatform() as 'ios' | 'android';

    // Save token to database
    const saveToken = async (token: string) => {
      console.warn('[Push] Saving FCM token:', token.substring(0, 20) + '...');
      currentTokenRef.current = token;

      try {
        const { error } = await supabase.rpc('upsert_push_token', {
          p_token: token,
          p_platform: platform,
          p_device_id: null,
        });

        if (error) {
          console.error('[Push] Failed to save token:', error);
        } else {
          console.warn('[Push] Token saved to database');
        }
      } catch (e) {
        console.error('[Push] Error saving token:', e);
      }
    };

    // Register listeners
    const setupListeners = async () => {
      // Listen for token updates from Firebase
      await FirebaseMessaging.addListener('tokenReceived', async ({ token }) => {
        console.warn('[Push] Token received from Firebase');
        await saveToken(token);
      });

      // On notification received while app is in foreground
      await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.warn('[Push] Notification received:', notification);
        }
      );

      // On notification tapped
      await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action: ActionPerformed) => {
          console.warn('[Push] Notification tapped:', action);

          const data = action.notification.data;
          if (!data) return;

          const notificationType = data.type as string;
          const eventId = data.event_id as string;
          const bandId = data.band_id as string;

          if (notificationType === 'chat_message' && eventId && bandId) {
            navigateRef.current(`/bands/${bandId}/events/${eventId}/chat`);
          } else if (notificationType === 'new_event' && eventId && bandId) {
            navigateRef.current(`/bands/${bandId}/events/${eventId}`);
          } else if (bandId) {
            navigateRef.current(`/bands/${bandId}`);
          }
        }
      );
    };

    // Request permission and get FCM token
    const requestPermissionAndRegister = async () => {
      try {
        const permStatus = await FirebaseMessaging.checkPermissions();
        console.warn('[Push] Permission status:', permStatus.receive);

        if (permStatus.receive === 'prompt') {
          const result = await FirebaseMessaging.requestPermissions();
          console.warn('[Push] Permission request result:', result.receive);

          if (result.receive !== 'granted') {
            console.warn('[Push] Permission denied');
            return;
          }
        } else if (permStatus.receive !== 'granted') {
          console.warn('[Push] Permission not granted:', permStatus.receive);
          return;
        }

        // Get FCM token
        const { token } = await FirebaseMessaging.getToken();
        console.warn('[Push] Got FCM token');
        await saveToken(token);
      } catch (e) {
        console.error('[Push] Error:', e);
      }
    };

    setupListeners();
    requestPermissionAndRegister();
  }, [userId]);

  // Return function to deactivate token (call on logout)
  const deactivateToken = async () => {
    if (!currentTokenRef.current) return;

    try {
      await supabase.rpc('deactivate_push_token', {
        p_token: currentTokenRef.current,
      });
      console.warn('[Push] Token deactivated');
      currentTokenRef.current = null;
    } catch (e) {
      console.error('[Push] Error deactivating token:', e);
    }
  };

  return { deactivateToken };
}
