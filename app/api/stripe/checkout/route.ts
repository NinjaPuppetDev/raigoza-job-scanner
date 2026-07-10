import { NextResponse } from 'next/server';
import { stripe, STRIPE_PRICE_ID, APP_URL } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server'; // cookie-based server client
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchSubscription } from '@/lib/supabase/queries';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${APP_URL}/login?next=/api/stripe/checkout`);
  }

  const admin = createAdminClient();
  const existing = await fetchSubscription(admin, user.id);
  const stripeCustomerId = (existing as { stripeCustomerId?: string } | null)?.stripeCustomerId;

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: stripeCustomerId || undefined,
    customer_email: stripeCustomerId ? undefined : user.email,
    line_items: [{ price: STRIPE_PRICE_ID, quantity: 1 }],
    success_url: `${APP_URL}/dashboard?upgraded=true`,
    cancel_url: `${APP_URL}/dashboard`,
    client_reference_id: user.id,
    metadata: { userId: user.id },
  });

  return NextResponse.redirect(session.url!);
}