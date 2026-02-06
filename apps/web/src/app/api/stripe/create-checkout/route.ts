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
  productSlug: string;
  successUrl: string;
  cancelUrl: string;
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
    const { bandId, productSlug, successUrl, cancelUrl } = raw;

    if (!bandId || !productSlug || !successUrl || !cancelUrl) {
      return createCorsResponse(
        req,
        { error: 'Missing required fields: bandId, productSlug, successUrl, cancelUrl' },
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

    // Verify user is a band admin
    const { data: membership, error: membershipError } = await supabaseRls
      .from('band_members')
      .select('role')
      .eq('band_id', bandId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (membershipError || !membership || membership.role !== 'admin') {
      return createCorsResponse(
        req,
        { error: 'You must be a band admin to purchase subscriptions' },
        { status: 403 }
      );
    }

    // Get band info
    const { data: band } = await supabaseRls
      .from('bands')
      .select('id, name')
      .eq('id', bandId)
      .single();

    if (!band) {
      return createCorsResponse(
        req,
        { error: 'Band not found' },
        { status: 404 }
      );
    }

    // Get product info
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id, name, stripe_price_id, price_cents')
      .eq('slug', productSlug)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return createCorsResponse(
        req,
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    if (!product.stripe_price_id) {
      return createCorsResponse(
        req,
        { error: 'Product is not available for purchase (no Stripe price configured)' },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const { data: existingSub } = await supabaseAdmin
      .from('band_subscriptions')
      .select('id, status')
      .eq('band_id', bandId)
      .eq('product_id', product.id)
      .maybeSingle();

    if (existingSub && existingSub.status === 'active') {
      return createCorsResponse(
        req,
        { error: 'This band already has an active subscription for this product' },
        { status: 400 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
    });

    // Get or create Stripe customer
    let stripeCustomerId: string | undefined;

    // Check if band already has a customer ID from an existing subscription
    if (existingSub) {
      const { data: subData } = await supabaseAdmin
        .from('band_subscriptions')
        .select('stripe_customer_id')
        .eq('band_id', bandId)
        .not('stripe_customer_id', 'is', null)
        .maybeSingle();

      stripeCustomerId = subData?.stripe_customer_id ?? undefined;
    }

    // Create Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: stripeCustomerId,
      customer_email: stripeCustomerId ? undefined : user.email,
      line_items: [
        {
          price: product.stripe_price_id,
          quantity: 1,
        },
      ],
      metadata: {
        band_id: bandId,
        product_id: product.id,
        user_id: user.id,
      },
      subscription_data: {
        metadata: {
          band_id: bandId,
          product_id: product.id,
        },
      },
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl,
      allow_promotion_codes: true,
    });

    return createCorsResponse(
      req,
      {
        checkoutUrl: session.url,
        sessionId: session.id,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error('[create-checkout] error:', e);
    const msg = e instanceof Error ? e.message : 'Failed to create checkout session';
    return createCorsResponse(
      req,
      { error: msg },
      { status: 500 }
    );
  }
}
