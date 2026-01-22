// supabase/functions/notify-chat-message/index.ts
//
// Database webhook handler for new chat messages.
// Sends push notifications to band members when a message is posted.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  schema: string;
  record: {
    id: string;
    event_id: string;
    user_id: string;
    body: string;
    created_at: string;
  };
  old_record: null | Record<string, unknown>;
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json() as WebhookPayload;

    // Only handle inserts
    if (payload.type !== 'INSERT') {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { event_id, user_id, body } = payload.record;

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Get event and band info
    const { data: event, error: eventErr } = await supabase
      .from('events')
      .select('id, title, band_id')
      .eq('id', event_id)
      .single();

    if (eventErr || !event) {
      console.error('Event not found:', eventErr);
      return new Response(JSON.stringify({ error: 'Event not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get sender name
    const { data: sender } = await supabase
      .from('profiles')
      .select('display_name, first_name')
      .eq('id', user_id)
      .single();

    const senderName = sender?.display_name || sender?.first_name || 'Someone';

    // Truncate message for preview
    let messagePreview = body.substring(0, 100);
    if (body.length > 100) {
      messagePreview += '...';
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
          band_id: event.band_id,
          exclude_user_id: user_id,
          title: `${senderName} in ${event.title}`,
          body: messagePreview,
          data: {
            type: 'chat_message',
            event_id: event_id,
            band_id: event.band_id,
            message_id: payload.record.id,
          },
        }),
      }
    );

    const notifyResult = await notifyResponse.json();
    console.log('Notification result:', notifyResult);

    // Log the notification
    await supabase.from('notification_log').insert({
      notification_type: 'chat_message',
      sender_user_id: user_id,
      band_id: event.band_id,
      event_id: event_id,
      payload: {
        title: `${senderName} in ${event.title}`,
        body: messagePreview,
      },
      status: notifyResult.ok ? 'sent' : 'failed',
      error_message: notifyResult.error || null,
    });

    return new Response(JSON.stringify({ ok: true, ...notifyResult }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('notify-chat-message error:', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
