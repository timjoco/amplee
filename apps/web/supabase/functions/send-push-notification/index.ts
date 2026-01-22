// supabase/functions/send-push-notification/index.ts
//
// This Edge Function sends push notifications via Firebase Cloud Messaging (FCM).
// It can be called directly or triggered by database webhooks.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types
interface PushPayload {
  // Required: specify either tokens OR band_id
  tokens?: string[];           // Direct list of FCM tokens
  band_id?: string;            // Send to all members of this band
  exclude_user_id?: string;    // Don't send to this user (e.g., the sender)

  // Notification content
  title: string;
  body: string;

  // Optional: data payload for handling tap
  data?: {
    type: 'chat_message' | 'new_event' | 'invite' | string;
    event_id?: string;
    band_id?: string;
    message_id?: string;
    [key: string]: string | undefined;
  };

  // Optional: iOS specific
  badge?: number;
  sound?: string;
}

interface FCMMessage {
  token: string;
  notification: {
    title: string;
    body: string;
  };
  data?: Record<string, string>;
  android?: {
    priority: 'high' | 'normal';
    notification?: {
      sound?: string;
      click_action?: string;
    };
  };
  apns?: {
    payload: {
      aps: {
        badge?: number;
        sound?: string;
        'mutable-content'?: number;
      };
    };
  };
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function jsonResponse(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Get FCM access token using service account
async function getFCMAccessToken(): Promise<string> {
  const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT');
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT not configured');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);

  // Create JWT for FCM
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: serviceAccount.client_email,
    sub: serviceAccount.client_email,
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
  };

  // Encode header and payload
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const unsignedToken = `${headerB64}.${payloadB64}`;

  // Sign with private key
  const privateKey = serviceAccount.private_key;
  const keyData = privateKey
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '');

  const binaryKey = Uint8Array.from(atob(keyData), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    encoder.encode(unsignedToken)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  const jwt = `${unsignedToken}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenResponse.ok) {
    const error = await tokenResponse.text();
    throw new Error(`Failed to get FCM access token: ${error}`);
  }

  const tokenData = await tokenResponse.json();
  return tokenData.access_token;
}

// Send notification via FCM HTTP v1 API
async function sendFCMNotification(
  accessToken: string,
  projectId: string,
  message: FCMMessage
): Promise<{ success: boolean; error?: string }> {
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  console.log(`FCM URL: ${url}`);
  console.log(`FCM Token (first 30 chars): ${message.token.substring(0, 30)}`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });

    console.log(`FCM Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.log(`FCM Error response: ${errorText}`);

      try {
        const error = JSON.parse(errorText);
        if (error?.error?.details?.[0]?.errorCode === 'UNREGISTERED') {
          return { success: false, error: 'TOKEN_INVALID' };
        }
        return { success: false, error: errorText };
      } catch {
        return { success: false, error: errorText };
      }
    }

    console.log('FCM Success!');
    return { success: true };
  } catch (e) {
    console.log(`FCM request exception: ${String(e)}`);
    return { success: false, error: String(e) };
  }
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const payload = await req.json() as PushPayload;

    // Validate required fields
    if (!payload.title || !payload.body) {
      return jsonResponse({ error: 'title and body are required' }, 400);
    }

    if (!payload.tokens && !payload.band_id) {
      return jsonResponse({ error: 'Either tokens or band_id is required' }, 400);
    }

    // Get Firebase config
    const firebaseProjectId = Deno.env.get('FIREBASE_PROJECT_ID');
    if (!firebaseProjectId) {
      return jsonResponse({ error: 'FIREBASE_PROJECT_ID not configured' }, 500);
    }

    // Get tokens to send to
    let tokens: Array<{ token: string; user_id: string; platform: string }> = [];

    if (payload.tokens) {
      // Direct tokens provided
      tokens = payload.tokens.map(t => ({ token: t, user_id: 'unknown', platform: 'unknown' }));
    } else if (payload.band_id) {
      // Look up tokens for band members
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { persistSession: false } }
      );

      const { data: tokenRows, error: tokenErr } = await supabase
        .rpc('get_band_member_push_tokens', {
          p_band_id: payload.band_id,
          p_exclude_user_id: payload.exclude_user_id || null,
        });

      if (tokenErr) {
        console.error('Failed to get tokens:', tokenErr);
        return jsonResponse({ error: `Failed to get tokens: ${tokenErr.message}` }, 500);
      }

      tokens = tokenRows || [];
    }

    if (tokens.length === 0) {
      console.log('No tokens to send to');
      return jsonResponse({ ok: true, sent: 0, message: 'No tokens to send to' }, 200);
    }

    console.log(`Sending notification to ${tokens.length} devices`);

    // Get FCM access token
    const accessToken = await getFCMAccessToken();

    // Prepare data payload (convert all values to strings for FCM)
    const dataPayload: Record<string, string> = {};
    if (payload.data) {
      for (const [key, value] of Object.entries(payload.data)) {
        if (value !== undefined) {
          dataPayload[key] = String(value);
        }
      }
    }

    // Send to each token
    const results = await Promise.all(
      tokens.map(async ({ token, user_id, platform }) => {
        console.log(`Sending to token: ${token.substring(0, 30)}... (platform: ${platform})`);

        const message: FCMMessage = {
          token,
          notification: {
            title: payload.title,
            body: payload.body,
          },
          data: dataPayload,
          android: {
            priority: 'high',
            notification: {
              sound: payload.sound || 'default',
            },
          },
          apns: {
            payload: {
              aps: {
                badge: payload.badge,
                sound: payload.sound || 'default',
                'mutable-content': 1,
              },
            },
          },
        };

        const result = await sendFCMNotification(accessToken, firebaseProjectId, message);
        console.log(`Result for ${token.substring(0, 20)}...: ${JSON.stringify(result)}`);

        return {
          token, // Keep full token for deactivation
          token_display: token.substring(0, 20) + '...', // Truncate for logging
          user_id,
          platform,
          ...result,
        };
      })
    );

    // Count successes and failures
    const sent = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    // Mark invalid tokens as inactive
    const invalidTokens = results
      .filter(r => r.error === 'TOKEN_INVALID')
      .map(r => r.token);

    if (invalidTokens.length > 0) {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        { auth: { persistSession: false } }
      );

      // Deactivate invalid tokens
      for (const token of invalidTokens) {
        await supabase
          .from('push_tokens')
          .update({ is_active: false })
          .eq('token', token);
      }
      console.log(`Deactivated ${invalidTokens.length} invalid tokens`);
    }

    console.log(`Notification sent: ${sent} success, ${failed} failed`);

    return jsonResponse({
      ok: true,
      sent,
      failed,
      total: tokens.length,
    }, 200);

  } catch (e) {
    console.error('Push notification error:', e);
    return jsonResponse({ error: String(e) }, 500);
  }
});
