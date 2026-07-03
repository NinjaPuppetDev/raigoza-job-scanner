import { NextResponse } from 'next/server';
import { fetchCandidates } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const candidates = await fetchCandidates();
    return NextResponse.json(candidates);
  } catch (err) {
    console.error('Candidates fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}