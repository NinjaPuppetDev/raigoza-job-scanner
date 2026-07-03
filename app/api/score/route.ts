import { NextResponse } from 'next/server';
import { groq, MODEL, SCORE_PROMPT } from '@/lib/groq';
import { createAdminClient } from '@/lib/supabase/admin';
import { createCandidate, fetchApplicationById } from '@/lib/supabase/queries';

export async function POST(req: Request) {
  try {
    const { applicationId, profile, screeningAnswers } = await req.json();
    const supabase = createAdminClient();

    const application = await fetchApplicationById(supabase, applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const profileStr = JSON.stringify(profile, null, 2);

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{
        role: 'user',
        content: SCORE_PROMPT(
          application.jobTitle,
          application.jobDescription || `${application.jobTitle} at ${application.company}`,
          application.screeningQuestions,
          profileStr,
          screeningAnswers
        )
      }],
      temperature: 0.2,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const scoreResult = JSON.parse(clean);

    const candidate = await createCandidate(supabase, {
      name:             profile.name ?? '',
      email:            profile.email ?? '',
      phone:            profile.phone ?? '',
      extractedProfile: profileStr,
      screeningAnswers: JSON.stringify(screeningAnswers),
      score:            scoreResult.score ?? 0,
      scoreReasoning:   JSON.stringify(scoreResult),
      applicationId,
      submittedAt:      new Date().toISOString(),
    });

    return NextResponse.json({ score: scoreResult, candidateId: candidate.id });
  } catch (err) {
    console.error('Score error:', err);
    return NextResponse.json({ error: 'Scoring failed' }, { status: 500 });
  }
}