import { NextResponse } from 'next/server';
import { fetchApplications, createApplication } from '@/lib/airtable';
import type { Application } from '@/lib/airtable';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const apps = await fetchApplications();
    return NextResponse.json(apps);
  } catch (err) {
    console.error('Airtable fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body: Omit<Application, 'id'> = await req.json();
    console.log('📋 Attempting Airtable create with fields:', JSON.stringify(body, null, 2));
    const created = await createApplication(body);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error('Airtable create error:', err);
    return NextResponse.json({ error: 'Failed to create application' }, { status: 500 });
  }
}