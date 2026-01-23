// supabase/functions/notify-new-event/index.ts
//
// Database webhook handler for new events.
// Sends push notifications to band members when an event is created.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: {
    id: string;
    band_id: string;
    title: string;
    type: 'show' | 'practice';
    starts_at: string | null;
    location: string | null;
    created_by: string | null;
    created_at: string;
  };
  old_record: null | Record<string, unknown>;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Validate service role key - only database webhooks allowed
  const authHeader = req.headers.get('Authorization');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!serviceRoleKey || authHeader !== `Bearer ${serviceRoleKey}`) {
    console.error('Unauthorized: Invalid or missing service role key');
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  try {
    const payload = await req.json() as WebhookPayload;

    // Only handle inserts
    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { id, band_id, title, type, starts_at, created_by } = payload.record;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Get band name
    const { data: band, error: bandErr } = await supabase
      .from('bands')
      .select('name')
      .eq('id', band_id)
      .single();

    if (bandErr || !band) {
      console.error('Band not found:', bandErr);
      return new Response(JSON.stringify({ error: 'Band not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Format event type
    const eventType = type === 'show' ? 'Show' : type === 'practice' ? 'Practice' : 'Event';

    // Format date
    let eventDate = 'Date TBD';
    if (starts_at) {
      const date = new Date(starts_at);
      eventDate = date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    // Call the send-push-notification function
    const notifyResponse = await fetch(
      `${Deno.env.get('SUPABASE_URL')}/functions/v1/send-push-notification`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        },
        body: JSON.stringify({
          band_id: band_id,
          exclude_user_id: created_by,
          title: `New ${eventType} for ${band.name}`,
          body: `${title} - ${eventDate}`,
          data: {
            type: 'new_event',
            event_id: id,
            band_id: band_id,
          },
        }),
      }
    );

    const notifyResult = await notifyResponse.json();
    console.log('Notification result:', notifyResult);

    // Log the notification
    await supabase.from('notification_log').insert({
      notification_type: 'new_event',
      sender_user_id: created_by,
      band_id: band_id,
      event_id: id,
      payload: {
        title: `New ${eventType} for ${band.name}`,
        body: `${title} - ${eventDate}`,
      },
      status: notifyResult.ok ? 'sent' : 'failed',
      error_message: notifyResult.error || null,
    });

    return new Response(JSON.stringify({ ok: true, ...notifyResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('notify-new-event error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
