import { createClient } from '@supabase/supabase-js';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Disable body parsing, we need raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    // Validate Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
      console.error('[stripe-webhook] Stripe not configured');
      return NextResponse.json(
        { error: 'Stripe webhook not configured' },
        { status: 500 }
      );
    }

    // Get raw body
    const body = await req.text();

    // Get Stripe signature
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('[stripe-webhook] Missing stripe-signature header');
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      );
    }

    // Initialize Stripe
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-01-27.acacia',
    });

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      console.error('[stripe-webhook] Signature verification failed:', msg);
      return NextResponse.json(
        { error: `Webhook signature verification failed: ${msg}` },
        { status: 400 }
      );
    }

    // Create Supabase admin client
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Handle the event
    console.log(`[stripe-webhook] Processing ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabaseAdmin, stripe, session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(supabaseAdmin, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(supabaseAdmin, subscription);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabaseAdmin, invoice);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentSucceeded(supabaseAdmin, invoice);
        break;
      }

      default:
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (e) {
    console.error('[stripe-webhook] Error:', e);
    const msg = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      { error: msg },
      { status: 500 }
    );
  }
}

// ---- Event Handlers ----

async function handleCheckoutCompleted(
  supabase: ReturnType<typeof createClient>,
  stripe: Stripe,
  session: Stripe.Checkout.Session
) {
  console.log('[stripe-webhook] Checkout completed:', session.id);

  const bandId = session.metadata?.band_id;
  const productId = session.metadata?.product_id;
  const userId = session.metadata?.user_id;

  if (!bandId || !productId) {
    console.error('[stripe-webhook] Missing metadata in checkout session');
    return;
  }

  // Get the subscription
  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error('[stripe-webhook] No subscription in checkout session');
    return;
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Upsert the subscription record
  const { error } = await supabase
    .from('band_subscriptions')
    .upsert(
      {
        band_id: bandId,
        product_id: productId,
        stripe_subscription_id: subscription.id,
        stripe_customer_id: subscription.customer as string,
        status: mapStripeStatus(subscription.status),
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        created_by: userId || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'band_id,product_id',
      }
    );

  if (error) {
    console.error('[stripe-webhook] Failed to create subscription record:', error);
    return;
  }

  // Mark trial as converted if exists
  await supabase
    .from('band_trials')
    .update({
      converted_to_subscription_id: (
        await supabase
          .from('band_subscriptions')
          .select('id')
          .eq('band_id', bandId)
          .eq('product_id', productId)
          .single()
      ).data?.id,
    })
    .eq('band_id', bandId)
    .eq('product_id', productId)
    .is('converted_to_subscription_id', null);

  console.log('[stripe-webhook] Subscription created for band:', bandId);
}

async function handleSubscriptionUpdated(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  console.log('[stripe-webhook] Subscription updated:', subscription.id);

  const bandId = subscription.metadata?.band_id;
  const productId = subscription.metadata?.product_id;

  if (!bandId || !productId) {
    // Try to find by Stripe subscription ID
    const { data: existing } = await supabase
      .from('band_subscriptions')
      .select('band_id, product_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (!existing) {
      console.log('[stripe-webhook] No matching subscription found for:', subscription.id);
      return;
    }

    // Update the existing record
    const { error } = await supabase
      .from('band_subscriptions')
      .update({
        status: mapStripeStatus(subscription.status),
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        cancel_at_period_end: subscription.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', subscription.id);

    if (error) {
      console.error('[stripe-webhook] Failed to update subscription:', error);
    }
    return;
  }

  // Update by band_id and product_id
  const { error } = await supabase
    .from('band_subscriptions')
    .update({
      status: mapStripeStatus(subscription.status),
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    })
    .eq('band_id', bandId)
    .eq('product_id', productId);

  if (error) {
    console.error('[stripe-webhook] Failed to update subscription:', error);
  }
}

async function handleSubscriptionDeleted(
  supabase: ReturnType<typeof createClient>,
  subscription: Stripe.Subscription
) {
  console.log('[stripe-webhook] Subscription deleted:', subscription.id);

  const { error } = await supabase
    .from('band_subscriptions')
    .update({
      status: 'canceled',
      cancel_at_period_end: false,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('[stripe-webhook] Failed to mark subscription as canceled:', error);
  }
}

async function handlePaymentFailed(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  console.log('[stripe-webhook] Payment failed for invoice:', invoice.id);

  if (!invoice.subscription) return;

  const { error } = await supabase
    .from('band_subscriptions')
    .update({
      status: 'past_due',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', invoice.subscription as string);

  if (error) {
    console.error('[stripe-webhook] Failed to mark subscription as past_due:', error);
  }
}

async function handlePaymentSucceeded(
  supabase: ReturnType<typeof createClient>,
  invoice: Stripe.Invoice
) {
  console.log('[stripe-webhook] Payment succeeded for invoice:', invoice.id);

  if (!invoice.subscription) return;

  // Only update if currently past_due
  const { error } = await supabase
    .from('band_subscriptions')
    .update({
      status: 'active',
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', invoice.subscription as string)
    .eq('status', 'past_due');

  if (error) {
    console.error('[stripe-webhook] Failed to update subscription after payment:', error);
  }
}

// ---- Helpers ----

function mapStripeStatus(stripeStatus: Stripe.Subscription.Status): string {
  switch (stripeStatus) {
    case 'active':
      return 'active';
    case 'canceled':
      return 'canceled';
    case 'past_due':
      return 'past_due';
    case 'trialing':
      return 'trialing';
    case 'incomplete':
    case 'incomplete_expired':
      return 'incomplete';
    case 'unpaid':
      return 'past_due';
    case 'paused':
      return 'canceled';
    default:
      return 'active';
  }
}
