import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { fetchApplications, fetchInterviews, fetchContacts, fetchLatestScores } from '@/lib/supabase/queries';

export async function GET() {
  try {
    const supabase = await createClient();
    const [apps, interviews, contacts] = await Promise.all([
      fetchApplications(supabase),
      fetchInterviews(supabase),
      fetchContacts(supabase),
    ]);

    const scores = await fetchLatestScores(supabase, apps.map((a) => a.id));

    const total = apps.length;
    const active = apps.filter((a) =>
      ['Applied', 'Recruiter Screen', 'Hiring Manager', 'Final Interview'].includes(a.currentStage)
    ).length;
    const offers = apps.filter((a) => a.currentStage === 'Offer').length;
    const responded = apps.filter((a) => a.currentStage !== 'Applied').length;
    const responseRate = total > 0 ? Math.round((responded / total) * 100) : 0;

    const stages = ['Applied', 'Recruiter Screen', 'Hiring Manager', 'Final Interview', 'Offer'];
    const funnel = stages.map((stage) => ({
      stage,
      count: apps.filter((a) => a.currentStage === stage).length,
      pct: total > 0
        ? Math.round((apps.filter((a) => a.currentStage === stage).length / total) * 100)
        : 0,
    }));

    const now = new Date();
    const weeks: { label: string; count: number }[] = [];
    for (let i = 4; i >= 0; i--) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - i * 7);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 7);
      const count = apps.filter((a) => {
        const d = new Date(a.dateApplied);
        return d >= weekStart && d < weekEnd;
      }).length;
      weeks.push({
        label: `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
        count,
      });
    }

    return NextResponse.json({
      stats: { total, active, interviews: interviews.length, offers, responseRate },
      funnel,
      timeline: weeks,
      recentApplications: apps.slice(-5).reverse(),
      upcomingInterviews: interviews.slice(0, 5),
      followUps: contacts.slice(0, 4),
      scores,
    });
  } catch (err) {
    console.error('Dashboard fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}