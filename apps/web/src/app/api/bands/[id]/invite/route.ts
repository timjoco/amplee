import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---- CORS setup ----

// Your API host
const PROD_ORIGIN = 'https://amplee.app';

function isAllowedOrigin(origin: string) {
  if (!origin) return false;

  // Prod site (also what you'll usually see in web)
  if (origin === PROD_ORIGIN) return true;

  // Capacitor (iOS)
  if (origin === 'capacitor://localhost') return true;

  // Android WebView often uses https://localhost
  if (origin === 'https://localhost') return true;

  // Local dev (localhost)
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;

  // Local dev over LAN (Vite --host gives you something like http://192.168.x.x:5173)
  if (/^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin))
    return true;

  return false;
}

function getCorsOrigin(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  return isAllowedOrigin(origin) ? origin : PROD_ORIGIN;
}

function createCorsResponse(
  req: NextRequest,
  body: any,
  options: { status: number }
) {
  const allowedOrigin = getCorsOrigin(req);

  return NextResponse.json(body, {
    status: options.status,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
      // Helps avoid weird caching issues across origins
      Vary: 'Origin',
    },
  });
}

export function OPTIONS(req: NextRequest) {
  const allowedOrigin = getCorsOrigin(req);

  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });
}

// ---- existing helpers / handler ----

type BodyIn = {
  email?: string;
  role?: 'member' | 'admin';
  bandName?: string;
};

async function getBandId(ctx: { params: any }) {
  const p = ctx?.params;
  if (!p) throw new Error('Missing params');
  if (typeof p.then === 'function') return (await p).id as string;
  return p.id as string;
}

export async function POST(req: NextRequest, ctx: { params: any }) {
  try {
    const bandId = await getBandId(ctx);

    const raw = (await req.json()) as BodyIn;
    const email = raw.email?.trim().toLowerCase();
    const role = raw.role?.toLowerCase() as 'member' | 'admin' | undefined;
    const bandName = raw.bandName?.toString();

    if (!email || !role) {
      return createCorsResponse(
        req,
        { error: 'email and role are required' },
        { status: 400 }
      );
    }

    const authHeader =
      req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      return createCorsResponse(
        req,
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    const supabaseRls = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    let token: string | null = null;

    const insertRes = await supabaseRls
      .from('band_invitations')
      .insert([{ band_id: bandId, email, role, status: 'pending' }])
      .select('token')
      .single();

    if (insertRes.error) {
      if ((insertRes.error as any).code === '23505') {
        const updRes = await supabaseRls
          .from('band_invitations')
          .update({ role })
          .eq('band_id', bandId)
          .eq('email', email)
          .eq('status', 'pending')
          .select('token')
          .maybeSingle();

        if (updRes.error) {
          return createCorsResponse(
            req,
            { error: updRes.error.message },
            { status: 400 }
          );
        }
        token = updRes.data?.token ?? null;
      } else {
        return createCorsResponse(
          req,
          {
            error: insertRes.error.message,
            details: insertRes.error.details,
            code: (insertRes.error as any).code,
          },
          { status: 400 }
        );
      }
    } else {
      token = insertRes.data?.token ?? null;
    }

    if (!token) {
      return createCorsResponse(
        req,
        { error: 'Failed to create invite token' },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;
    if (!baseUrl) {
      return createCorsResponse(
        req,
        { error: 'Missing NEXT_PUBLIC_APP_URL' },
        { status: 500 }
      );
    }

    const site = baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`;
    const acceptUrl = `${site}/invite/${encodeURIComponent(token)}`;

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const invokeRes = await supabaseAdmin.functions.invoke('send-invite', {
      body: { to: email, acceptUrl, bandName },
    });
    if (invokeRes.error) {
      return createCorsResponse(
        req,
        { error: invokeRes.error.message },
        { status: 400 }
      );
    }

    return createCorsResponse(
      req,
      { ok: true, token, acceptUrl, role },
      { status: 200 }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return createCorsResponse(
      req,
      { error: msg || 'Invite failed' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, ctx: { params: any }) {
  const bandId = await getBandId(ctx);
  return createCorsResponse(req, { ok: true, bandId }, { status: 200 });
}
