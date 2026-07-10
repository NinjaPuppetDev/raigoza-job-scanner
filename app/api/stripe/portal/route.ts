import { NextResponse } from 'next/server';
import { stripe, APP_URL } from '@/lib/stripe';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { fetchSubscription } from '@/lib/supabase/queries';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(`${APP_URL}/login`);

  const admin = createAdminClient();
  const sub = await fetchSubscription(admin, user.id);
  if (!sub || (typeof sub === 'object' && !('stripeCustomerId' in sub) && !('customer_id' in sub))) {
    return NextResponse.redirect(`${APP_URL}/dashboard`);
  }

  const stripeCustomerId = typeof sub === 'object'
    ? ('stripeCustomerId' in sub ? (sub as any).stripeCustomerId : (sub as any).customer_id)
    : undefined;

  if (!stripeCustomerId) return NextResponse.redirect(`${APP_URL}/dashboard`);

  const session = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${APP_URL}/dashboard`,
  });

  return NextResponse.redirect(session.url);
}