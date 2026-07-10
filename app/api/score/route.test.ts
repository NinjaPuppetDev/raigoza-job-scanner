import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import * as queries from '@/lib/supabase/queries';
import * as usage from '@/lib/billing/usage';
import { groq } from '@/lib/groq';

vi.mock('@/lib/supabase/queries');
vi.mock('@/lib/billing/usage');
vi.mock('@/lib/supabase/admin', () => ({ createAdminClient: () => ({}) }));
vi.mock('@/lib/groq', () => ({
  groq: { chat: { completions: { create: vi.fn() } } },
  MODEL: 'test-model',
  SCORE_PROMPT: () => 'prompt',
}));

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/score', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());

describe('POST /api/score', () => {
  it('returns 403 and never calls Groq when the limit is hit', async () => {
    vi.mocked(queries.fetchApplicationById).mockResolvedValue({ userId: 'owner-1', jobTitle: 'PM' } as any);
    vi.mocked(usage.checkUsageLimit).mockResolvedValue({ allowed: false, used: 5, limit: 5 });

    const res = await POST(makeRequest({ applicationId: 'app-1', profile: {}, screeningAnswers: {} }));
    const json = await res.json();

    expect(res.status).toBe(403);
    expect(json.upgradeRequired).toBe(true);
    expect(groq.chat.completions.create).not.toHaveBeenCalled();
    expect(queries.createCandidate).not.toHaveBeenCalled();
  });

  it('scores and saves a candidate when under the limit', async () => {
    vi.mocked(queries.fetchApplicationById).mockResolvedValue({ userId: 'owner-1', jobTitle: 'PM' } as any);
    vi.mocked(usage.checkUsageLimit).mockResolvedValue({ allowed: true, used: 2, limit: 5 });
    vi.mocked(groq.chat.completions.create).mockResolvedValue({
      choices: [{ message: { content: '{"score": 82}' } }],
    } as any);
    vi.mocked(queries.createCandidate).mockResolvedValue({ id: 'cand-1' } as any);

    const res = await POST(makeRequest({ applicationId: 'app-1', profile: { name: 'Dave' }, screeningAnswers: {} }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.score.score).toBe(82);
    expect(queries.createCandidate).toHaveBeenCalledWith(
      expect.objectContaining({ ownerId: 'owner-1' })
    );
  });
});