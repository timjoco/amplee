import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// ---- CORS setup ----
const PROD_ORIGIN = 'https://amplee.app';

function isAllowedOrigin(origin: string) {
  if (!origin) return false;
  if (origin === PROD_ORIGIN) return true;
  if (origin === 'capacitor://localhost') return true;
  if (origin === 'https://localhost') return true;
  if (/^https?:\/\/localhost(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/192\.168\.\d+\.\d+(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/10\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)) return true;
  if (/^https?:\/\/172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+(:\d+)?$/.test(origin)) return true;
  return false;
}

function getCorsOrigin(req: NextRequest) {
  const origin = req.headers.get('origin') || '';
  return isAllowedOrigin(origin) ? origin : PROD_ORIGIN;
}

function createCorsResponse(
  req: NextRequest,
  body: unknown,
  options: { status: number }
) {
  const allowedOrigin = getCorsOrigin(req);

  return NextResponse.json(body, {
    status: options.status,
    headers: {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
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
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Max-Age': '86400',
      Vary: 'Origin',
    },
  });
}

// ---- Handler ----

type BodyIn = {
  bandId: string;
  returnUrl: string;
};

export async function POST(req: NextRequest) {
  try {
    // Validate Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      return createCorsResponse(
        req,
        { error: 'Stripe is not configured' },
        { status: 500 }
      );
    }

    // Parse request
    const raw = (await req.json()) as BodyIn;
    const { bandId, returnUrl } = raw;

    if (!bandId || !returnUrl) {
      return createCorsResponse(
        req,
        { error: 'Missing required fields: bandId, returnUrl' },
        { status: 400 }
      );
    }

    // Verify auth
    const authHeader = req.headers.get('authorization') ?? req.headers.get('Authorization');
    if (!authHeader) {
      return createCorsResponse(
        req,
        { error: 'Missing Authorization header' },
        { status: 401 }
      );
    }

    // Create Supabase clients
    const supabaseRls = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get current user
    const { data: { user }, error: userError } = await supabaseRls.auth.getUser();
    if (userError || !user) {
      return createCorsResponse(
        req,
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify user is a band member (any member can view portal)
    const { data: membership, error: membershipError } = await supabaseRls
      .from('band_members')
      .select('role')
      .eq('band_id', bandId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership) {
      return createCorsResponse(
        req,
        { error: 'You must be a band member to manage subscriptions' },
        { status: 403 }
      );
    }

    // Get band's Stripe customer ID
    const { data: subscription, error: subError } = await supabaseAdmin
      .from('band_subscriptions')
      .select('stripe_customer_id')
      .eq('band_id', bandId)
      .not('stripe_customer_id', 'is', null)
      .maybeSingle();

    if (subError || !subscription?.stripe_customer_id) {
      return createCorsResponse(
        req,
        { error: 'No subscription found for this band' },
        { status: 404 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
    });

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: returnUrl,
    });

    return createCorsResponse(
      req,
      {
        portalUrl: session.url,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error('[create-portal] error:', e);
    const msg = e instanceof Error ? e.message : 'Failed to create portal session';
    return createCorsResponse(
      req,
      { error: msg },
      { status: 500 }
    );
  }
}
