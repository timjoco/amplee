// supabase/functions/delete-band/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ORIGIN = Deno.env.get('CORS_ORIGIN') ?? '*'; // dev: "*"
const corsHeaders = {
  'Access-Control-Allow-Origin': ORIGIN,
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
};

function isUuidLike(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
}

function jsonResponse(body: object, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200, headers: corsHeaders });
  }

  try {
    const { band_id } = await req.json();

    if (!band_id) {
      return jsonResponse({ error: 'Missing band_id' }, 400);
    }

    if (!isUuidLike(band_id)) {
      return jsonResponse({ error: 'Invalid band_id format' }, 400);
    }

    // Verify user authentication via Authorization header
    const authHeader = req.headers.get('Authorization') ?? '';
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401);
    }

    // User-context client to verify identity and permissions
    const supabaseUser = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userData, error: userErr } = await supabaseUser.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: 'Not authenticated' }, 401);
    }

    const userId = userData.user.id;

    // Service-role client for privileged queries
    const service = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } }
    );

    // Verify user is an admin of this band
    const { data: membership, error: memErr } = await service
      .from('band_members')
      .select('role')
      .eq('band_id', band_id)
      .eq('user_id', userId)
      .maybeSingle();

    if (memErr) {
      return jsonResponse({ error: 'Failed to verify membership' }, 500);
    }

    if (!membership) {
      return jsonResponse({ error: 'You are not a member of this band' }, 403);
    }

    if (membership.role !== 'admin') {
      return jsonResponse({ error: 'Only band admins can delete bands' }, 403);
    }

    // Perform delete (schema should have FK cascades for related data)
    const { error: delErr } = await service
      .from('bands')
      .delete()
      .eq('id', band_id);

    if (delErr) {
      return jsonResponse({ error: delErr.message }, 500);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500);
  }
});
