import { describe, it, expect, vi } from 'vitest';
import { checkUsageLimit, FREE_MONTHLY_LIMIT } from './usage';
import * as queries from '@/lib/supabase/queries';

vi.mock('@/lib/supabase/queries');

const supabase = {} as any; // not actually hit, queries module is mocked

describe('checkUsageLimit', () => {
  it('allows a free user under the limit', async () => {
    vi.mocked(queries.fetchSubscription).mockResolvedValue(null);
    vi.mocked(queries.countReviewsThisMonth).mockResolvedValue(3);

    const result = await checkUsageLimit(supabase, 'user-1');
    expect(result).toEqual({ allowed: true, used: 3, limit: FREE_MONTHLY_LIMIT });
  });

  it('blocks a free user at the limit', async () => {
    vi.mocked(queries.fetchSubscription).mockResolvedValue(null);
    vi.mocked(queries.countReviewsThisMonth).mockResolvedValue(FREE_MONTHLY_LIMIT);

    const result = await checkUsageLimit(supabase, 'user-1');
    expect(result.allowed).toBe(false);
  });

  it('allows an active paid user regardless of count', async () => {
    vi.mocked(queries.fetchSubscription).mockResolvedValue({ status: 'active', currentPeriodEnd: null });

    const result = await checkUsageLimit(supabase, 'user-2');
    expect(result).toEqual({ allowed: true, used: 0, limit: null });
  });

  it('treats trialing as paid', async () => {
    vi.mocked(queries.fetchSubscription).mockResolvedValue({ status: 'trialing', currentPeriodEnd: null });

    const result = await checkUsageLimit(supabase, 'user-3');
    expect(result.allowed).toBe(true);
  });

  it('treats past_due as free tier', async () => {
    vi.mocked(queries.fetchSubscription).mockResolvedValue({ status: 'past_due', currentPeriodEnd: null });
    vi.mocked(queries.countReviewsThisMonth).mockResolvedValue(0);

    const result = await checkUsageLimit(supabase, 'user-4');
    expect(result.limit).toBe(FREE_MONTHLY_LIMIT);
  });
});