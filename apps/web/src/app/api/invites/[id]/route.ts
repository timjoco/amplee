/* eslint-disable @typescript-eslint/no-explicit-any */

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---- CORS setup ----

const PROD_ORIGIN = 'https://amplee.app';
const ALLOWED_ORIGINS = [
  PROD_ORIGIN,
  'http://localhost:5173',
  'capacitor://localhost',
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
  res.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
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

/**
 * Obfuscate email to prevent information disclosure.
 * "john.doe@example.com" -> "j***@example.com"
 */
function obfuscateEmail(email: string | null): string | null {
  if (!email) return null;
  const atIndex = email.indexOf('@');
  if (atIndex <= 0) return '***';
  const local = email.slice(0, atIndex);
  const domain = email.slice(atIndex);
  if (local.length <= 1) return `${local}***${domain}`;
  return `${local[0]}***${domain}`;
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

    // Fetch invite WITH band name
    const { data: invite, error } = await supabaseAdmin
      .from('band_invitations')
      .select(
        `
        token, 
        status, 
        role, 
        band_id, 
        created_at, 
        email,
        bands ( name )
      `
      )
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

    // Extract band name from the joined data
    const bandName = (invite.bands as any)?.name || null;

    return addCorsHeaders(
      req,
      NextResponse.json({
        ok: true,
        invite: {
          token: invite.token,
          status: invite.status,
          role: invite.role,
          band_id: invite.band_id,
          // Obfuscate email to prevent information disclosure
          email: obfuscateEmail(invite.email),
          created_at: invite.created_at,
          accepted: invite.status === 'accepted',
          bandName: bandName,
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
