import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchCandidates } from '@/lib/supabase/queries';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const candidates = await fetchCandidates(supabase);
    return NextResponse.json(candidates);
  } catch (err) {
    console.error('Candidates fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}