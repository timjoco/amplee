import { supabaseServer } from '@/lib/supabaseServer';
import { NextRequest, NextResponse } from 'next/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function POST(req: NextRequest, context: any) {
  const { id } = context.params as { id: string };

  const supabase = await supabaseServer();

  // 1) Ensure we have a logged in user
  const {
    data: { user },
    error: uErr,
  } = await supabase.auth.getUser();

  if (uErr || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  // 2) Ensure profile exists
  await supabase.rpc('ensure_profile');

  // 3) Check if user has completed onboarding
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('onboarded')
    .eq('id', user.id)
    .maybeSingle();

  if (pErr) {
    return NextResponse.json({ error: pErr.message }, { status: 400 });
  }

  if (!profile?.onboarded) {
    // redirect to onboarding, and come back here after
    const next = `/invites/${id}/accept`;
    const search = new URLSearchParams({ next }).toString();
    return NextResponse.redirect(new URL(`/login?${search}`, req.url));
  }

  // 4) Now it's safe to accept the invite and upsert membership
  const { error: rpcErr } = await supabase.rpc('accept_band_invite', {
    invite_token: id,
  });

  if (rpcErr) {
    return NextResponse.json({ error: rpcErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
