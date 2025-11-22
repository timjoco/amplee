/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---- CORS setup ----

// Production domain (your API host)
const PROD_ORIGIN = 'https://amplee.app';

// Origins we want to allow to call these APIs from the browser
const ALLOWED_ORIGINS = [PROD_ORIGIN, 'http://localhost:5173'];

function addCorsHeaders(req: NextRequest, res: NextResponse) {
  const origin = req.headers.get('origin') || '';

  if (ALLOWED_ORIGINS.includes(origin)) {
    res.headers.set('Access-Control-Allow-Origin', origin);
  } else {
    // Fallback – keep API usable for non-browser clients
    res.headers.set('Access-Control-Allow-Origin', PROD_ORIGIN);
  }

  res.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization'
  );
  res.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.headers.set('Access-Control-Max-Age', '86400');

  return res;
}

export function OPTIONS(req: NextRequest) {
  const res = new NextResponse(null, { status: 204 });
  return addCorsHeaders(req, res);
}

// ---- helpers / handler ----

async function getParamId(ctx: { params: any }) {
  const p = ctx?.params;
  if (!p) throw new Error('Missing params');
  if (typeof p.then === 'function') return (await p).id as string;
  return p.id as string;
}

export async function GET(req: NextRequest, ctx: { params: any }) {
  try {
    const token = await getParamId(ctx);
    if (!token) {
      return addCorsHeaders(
        req,
        NextResponse.json({ error: 'Missing invite id' }, { status: 400 })
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: invite, error } = await supabaseAdmin
      .from('band_invitations')
      .select('token, status, role, band_id, created_at, email')
      .eq('token', token)
      .maybeSingle();

    if (error) {
      return addCorsHeaders(
        req,
        NextResponse.json(
          { error: `invite lookup failed: ${error.message}` },
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

    return addCorsHeaders(
      req,
      NextResponse.json({
        ok: true,
        invite: {
          token: invite.token,
          status: invite.status,
          role: invite.role,
          band_id: invite.band_id,
          email: invite.email,
          created_at: invite.created_at,
          accepted: invite.status === 'accepted',
        },
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
