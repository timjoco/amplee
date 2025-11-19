/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function getParamId(ctx: { params: any }) {
  const p = ctx?.params;
  if (!p) throw new Error('Missing params');
  if (typeof p.then === 'function') return (await p).id as string;
  return p.id as string;
}

function isUuidLike(s: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s
  );
}

export async function POST(req: NextRequest, ctx: { params: any }) {
  try {
    const token = await getParamId(ctx);
    if (!token) {
      return NextResponse.json({ error: 'Missing invite id' }, { status: 400 });
    }
    if (!isUuidLike(token)) {
      return NextResponse.json(
        { error: 'Invite id is not a valid UUID' },
        { status: 400 }
      );
    }

    const authHeader =
      req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: userInfo, error: userErr } =
      await supabaseUser.auth.getUser();
    if (userErr || !userInfo?.user) {
      return NextResponse.json(
        { error: userErr?.message || 'Not authenticated' },
        { status: 401 }
      );
    }
    const authedUserId = userInfo.user.id;
    const authedEmail = userInfo.user.email?.toLowerCase() || null;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: invite, error: inviteErr } = await supabaseAdmin
      .from('band_invitations')
      .select('token, status, band_id, role, email')
      .eq('token', token)
      .maybeSingle();

    if (inviteErr) {
      return NextResponse.json(
        { error: `invite lookup failed: ${inviteErr.message}` },
        { status: 400 }
      );
    }
    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }
    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: 'Invite is not pending' },
        { status: 400 }
      );
    }
    if (!invite.band_id || !isUuidLike(invite.band_id)) {
      return NextResponse.json(
        { error: 'Invite has invalid band_id' },
        { status: 400 }
      );
    }

    if (
      invite.email &&
      authedEmail &&
      invite.email.toLowerCase() !== authedEmail
    ) {
      return NextResponse.json(
        {
          error: `Invite email (${invite.email}) does not match logged-in user (${authedEmail}).`,
        },
        { status: 403 }
      );
    }

    const { error: upsertErr } = await supabaseAdmin
      .from('band_members')
      .upsert(
        {
          band_id: invite.band_id,
          user_id: authedUserId,
          role: invite.role ?? 'member',
        },
        { onConflict: 'band_id,user_id' }
      );
    if (upsertErr) {
      return NextResponse.json(
        { error: `membership upsert failed: ${upsertErr.message}` },
        { status: 400 }
      );
    }

    // 4) mark invite accepted
    const { error: updErr } = await supabaseAdmin
      .from('band_invitations')
      .update({ status: 'accepted' })
      .eq('token', token);
    if (updErr) {
      return NextResponse.json(
        { error: `failed to update invite: ${updErr.message}` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      ok: true,
      band_id: invite.band_id,
      role: invite.role ?? 'member',
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
