import Groq from 'groq-sdk';

export const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
export const MODEL = 'llama-3.3-70b-versatile';

export const EXTRACT_PROMPT = (resumeText: string) => `
You are a resume parser. Extract structured information from the resume text below.
Respond ONLY with a valid JSON object — no preamble, no markdown, no backticks.

Resume text:
"""
${resumeText}
"""

Return exactly this shape:
{
  "name": "Full name",
  "email": "email@example.com",
  "phone": "+1 555 000 0000",
  "location": "City, Country",
  "title": "Current or most recent job title",
  "summary": "2-3 sentence professional summary",
  "skills": ["skill1", "skill2"],
  "experience": [
    {
      "company": "Company name",
      "title": "Job title",
      "start": "Mon YYYY",
      "end": "Mon YYYY or Present",
      "bullets": ["achievement 1", "achievement 2"]
    }
  ],
  "education": [
    {
      "institution": "School name",
      "degree": "Degree type and field",
      "year": "YYYY"
    }
  ]
}
`;

export const SCORE_PROMPT = (
  jobTitle: string,
  jobDescription: string,
  screeningQuestions: string[],
  candidateProfile: string,
  screeningAnswers: Record<string, string>
) => `
You are an expert technical recruiter. Score this candidate for the role below.
Respond ONLY with a valid JSON object — no preamble, no markdown, no backticks.

Job Title: ${jobTitle}
Job Description:
"""
${jobDescription}
"""

Screening Questions and Candidate Answers:
${screeningQuestions.map((q, i) => `Q${i + 1}: ${q}\nA${i + 1}: ${screeningAnswers[`q${i}`] ?? '(no answer)'}`).join('\n\n')}

Candidate Profile:
"""
${candidateProfile}
"""

Return exactly this shape:
{
  "score": 78,
  "grade": "B+",
  "summary": "2-3 sentence overall assessment",
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "gaps": ["gap 1", "gap 2"],
  "recommendation": "Strong Yes | Yes | Maybe | No",
  "breakdown": {
    "skills_match": 85,
    "experience_relevance": 80,
    "screening_quality": 70,
    "overall_fit": 75
  }
}

Score 0-100. Be honest and specific. Base score primarily on skills match and experience relevance to the job description.
`;
