import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { stripe } from '@/lib/stripe';
import { createAdminClient } from '@/lib/supabase/admin';
import { upsertSubscription } from '@/lib/supabase/queries';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId ?? session.client_reference_id;
      if (!userId) break;

      await upsertSubscription(supabase, {
        userId,
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: session.subscription as string,
        status: 'active',
      });
      break;
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const status = event.type === 'customer.subscription.deleted' ? 'canceled' : sub.status;

      await upsertSubscription(supabase, {
        stripeCustomerId: sub.customer as string,
        stripeSubscriptionId: sub.id,
        status,
        currentPeriodEnd: new Date(sub.items.data[0].current_period_end * 1000).toISOString(),
      });
      break;
    }

    case 'invoice.payment_failed': {
      // event.data.object may not strictly match Stripe.Invoice in some typings
      const invoice: any = event.data.object;
      const subId = typeof invoice.subscription === 'string' ? invoice.subscription : invoice.subscription?.id;
      if (subId) {
        await upsertSubscription(supabase, { stripeSubscriptionId: subId, status: 'past_due' });
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}