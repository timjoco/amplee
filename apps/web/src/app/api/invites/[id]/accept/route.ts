import { supabaseServer } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await supabaseServer();

  const {
    data: { user },
    error: uErr,
  } = await supabase.auth.getUser();
  if (uErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  await supabase.rpc('ensure_profile');

  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .maybeSingle();

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 400 });
  }

  if (!profile?.onboarded) {
    const next = `/invites/${params.id}/accept`;
    const search = new URLSearchParams({ next }).toString();
    return NextResponse.redirect(new URL(`/login?${search}`, req.url));
  }

  const inviteId = params.id;

  const { error: rpcErr } = await supabase.rpc('accept_band_invite', {
    invite_token: inviteId,
  });

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
