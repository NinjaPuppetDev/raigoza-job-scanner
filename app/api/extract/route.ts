import { NextResponse } from 'next/server';
import { groq, MODEL, EXTRACT_PROMPT } from '@/lib/groq';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('resume') as File | null;
    const rawText = formData.get('text') as string | null;
    let resumeText = '';

    if (file) {
      const buffer = new Uint8Array(await file.arrayBuffer());
      const { extractText } = await import('unpdf');
      const { text } = await extractText(buffer);
      resumeText = Array.isArray(text) ? text.join('\n') : text;
    } else if (rawText) {
      resumeText = rawText;
    } else {
      return NextResponse.json({ error: 'No resume provided' }, { status: 400 });
    }

    if (!resumeText.trim()) {
      return NextResponse.json({ error: 'Could not extract text from resume' }, { status: 422 });
    }

    const completion = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: EXTRACT_PROMPT(resumeText.slice(0, 8000)) }],
      temperature: 0.1,
    });

    const raw = completion.choices[0]?.message?.content ?? '{}';
    const clean = raw.replace(/```json|```/g, '').trim();
    const profile = JSON.parse(clean);

    return NextResponse.json({ profile });
  } catch (err) {
    console.error('Extract error:', err);
    return NextResponse.json({ error: 'Extraction failed' }, { status: 500 });
  }
}