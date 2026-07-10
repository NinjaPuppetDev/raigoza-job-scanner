import type { SupabaseClient } from '@supabase/supabase-js';
import { countReviewsThisMonth, fetchSubscription } from '@/lib/supabase/queries';

export const FREE_MONTHLY_LIMIT = 5;

export interface UsageCheck {
  allowed: boolean;
  used: number;
  limit: number | null; // null = unlimited (paid)
}

export async function checkUsageLimit(supabase: SupabaseClient, ownerId: string): Promise<UsageCheck> {
  const sub = await fetchSubscription(supabase, ownerId);
  const isPaid = sub?.status === 'active' || sub?.status === 'trialing';
  if (isPaid) return { allowed: true, used: 0, limit: null };

  const used = await countReviewsThisMonth(supabase, ownerId);
  return { allowed: used < FREE_MONTHLY_LIMIT, used, limit: FREE_MONTHLY_LIMIT };
}