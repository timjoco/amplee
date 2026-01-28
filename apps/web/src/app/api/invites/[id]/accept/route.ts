import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---- CORS setup ----
const PROD_ORIGIN = 'https://amplee.app';
const ALLOWED_ORIGINS = [
  PROD_ORIGIN,
  'http://localhost:5173',
  'capacitor://localhost', // iOS Capacitor
  'http://localhost', // Android WebView (older)
  'https://localhost', // Android WebView (Capacitor default)
];

function addCorsHeaders(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get('origin') || '';

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    res.headers.set('Access-Control-Allow-Origin', PROD_ORIGIN);
  }

  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  res.headers.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.headers.set('Access-Control-Max-Age', '86400');

  return res;
}

export function OPTIONS(req: NextRequest) {
  const res = new NextResponse(null, { status: 204 });
  return addCorsHeaders(req, res);
}

// ---- helpers ----
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
      return addCorsHeaders(
        req,
        NextResponse.json({ error: 'Missing invite id' }, { status: 400 })
      );
    }
    if (!isUuidLike(token)) {
      return addCorsHeaders(
        req,
        NextResponse.json(
          { error: 'Invite id is not a valid UUID' },
          { status: 400 }
        )
      );
    }

    const authHeader =
      req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      return addCorsHeaders(
        req,
        NextResponse.json(
          { error: 'Missing Authorization header' },
          { status: 401 }
        )
      );
    }

    // User-context client (anon key + user JWT from Authorization header)
    const supabaseUser = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: authHeader,
          },
        },
      }
    );

    const { data: userInfo, error: userErr } =
      await supabaseUser.auth.getUser();
    if (userErr || !userInfo?.user) {
      return addCorsHeaders(
        req,
        NextResponse.json(
          { error: userErr?.message || 'Not authenticated' },
          { status: 401 }
        )
      );
    }

    const authedUserId = userInfo.user.id;
    const authedEmail = userInfo.user.email?.toLowerCase() || null;

    // Admin client (service role) for privileged writes
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
      return addCorsHeaders(
        req,
        NextResponse.json(
          { error: `invite lookup failed: ${inviteErr.message}` },
          { status: 400 }
        )
      );
    }

    if (!invite) {
      return addCorsHeaders(
        req,
        NextResponse.json({ error: 'Invite not found' }, { status: 404 })
      );
    }

    // ✅ Idempotent behavior:
    // - pending: proceed (normal flow below)
    // - accepted: return ok (don’t touch membership / role)
    // - revoked/expired: error
    if (invite.status === 'accepted') {
      if (!invite.band_id || !isUuidLike(invite.band_id)) {
        return addCorsHeaders(
          req,
          NextResponse.json(
            { error: 'Invite has invalid band_id' },
            { status: 400 }
          )
        );
      }

      const { data: existingMember, error: memErr } = await supabaseAdmin
        .from('band_members')
        .select('role')
        .eq('band_id', invite.band_id)
        .eq('user_id', authedUserId)
        .maybeSingle();

      if (memErr) {
        return addCorsHeaders(
          req,
          NextResponse.json(
            { error: `membership lookup failed: ${memErr.message}` },
            { status: 400 }
          )
        );
      }

      const role = (existingMember?.role ?? invite.role ?? 'member') as
        | 'admin'
        | 'member';

      return addCorsHeaders(
        req,
        NextResponse.json({
          ok: true,
          band_id: invite.band_id,
          bandId: invite.band_id,
          role,
          alreadyMember: !!existingMember,
          alreadyAccepted: true,
        })
      );
    }

    if (invite.status !== 'pending') {
      return addCorsHeaders(
        req,
        NextResponse.json(
          { error: `Invite is ${invite.status}` },
          { status: 400 }
        )
      );
    }

    if (!invite.band_id || !isUuidLike(invite.band_id)) {
      return addCorsHeaders(
        req,
        NextResponse.json(
          { error: 'Invite has invalid band_id' },
          { status: 400 }
        )
      );
    }

    // Only enforce email match if the invite has a specific email
    // Link-based invites (email: null) can be accepted by anyone
    if (
      invite.email &&
      authedEmail &&
      invite.email.toLowerCase() !== authedEmail
    ) {
      return addCorsHeaders(
        req,
        NextResponse.json(
          {
            error: `Invite email (${invite.email}) does not match logged-in user (${authedEmail}).`,
          },
          { status: 403 }
        )
      );
    }

    // ensure_profile in USER CONTEXT
    const { error: ensureErr } = await supabaseUser.rpc('ensure_profile');
    if (ensureErr) {
      return addCorsHeaders(
        req,
        NextResponse.json(
          { error: `ensure_profile failed: ${ensureErr.message}` },
          { status: 400 }
        )
      );
    }

    // Upsert membership
    const { data: existingMember, error: memErr } = await supabaseAdmin
      .from('band_members')
      .select('role')
      .eq('band_id', invite.band_id)
      .eq('user_id', authedUserId)
      .maybeSingle();

    if (memErr) {
      return addCorsHeaders(
        req,
        NextResponse.json(
          { error: `membership lookup failed: ${memErr.message}` },
          { status: 400 }
        )
      );
    }

    let finalRole: 'admin' | 'member' = (invite.role ?? 'member') as any;
    const alreadyMember = !!existingMember;

    // 2) If already a member, keep their existing role (never downgrade)
    if (existingMember?.role) {
      finalRole = existingMember.role as any;
    } else {
      // 3) Not a member yet → insert membership
      const { error: insErr } = await supabaseAdmin
        .from('band_members')
        .insert({
          band_id: invite.band_id,
          user_id: authedUserId,
          role: finalRole,
        });

      if (insErr) {
        return addCorsHeaders(
          req,
          NextResponse.json(
            { error: `membership insert failed: ${insErr.message}` },
            { status: 400 }
          )
        );
      }
    }

    // Mark invite accepted - but only for email-specific invites
    // Link-based invites (email: null) stay pending so multiple people can use them
    if (invite.email) {
      const { error: updErr } = await supabaseAdmin
        .from('band_invitations')
        .update({ status: 'accepted' })
        .eq('token', token);
      if (updErr) {
        return addCorsHeaders(
          req,
          NextResponse.json(
            { error: `failed to update invite: ${updErr.message}` },
            { status: 400 }
          )
        );
      }
    }

    return addCorsHeaders(
      req,
      NextResponse.json({
        ok: true,
        band_id: invite.band_id,
        bandId: invite.band_id,
        role: finalRole,
        alreadyMember,
      })
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return addCorsHeaders(
      req,
      NextResponse.json({ error: msg }, { status: 500 })
    );
  }
}
