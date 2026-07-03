import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchApplications, createApplication } from '@/lib/supabase/queries';
import type { Application } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const apps = await fetchApplications(supabase);
    return NextResponse.json(apps);
  } catch (err) {
    console.error('Supabase fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body: Omit<Application, 'id'> = await req.json();
    const created = await createApplication(supabase, body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('Supabase create error:', err);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}