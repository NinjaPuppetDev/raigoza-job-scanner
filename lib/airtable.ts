import Airtable from 'airtable';

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID ?? 'appENCG9LlfkG1tP1'
);

export default base;

export const TABLES = {
  applications: 'Applications',
  candidates:   'tblHJwuBdL4wRypnX',
  contacts:     'Contacts',
  interviews:   'Interviews',
};

// ─── Types ────────────────────────────────────────────────────────────────────

export type ApplicationStage =
  | 'Applied' | 'Recruiter Screen' | 'Hiring Manager'
  | 'Final Interview' | 'Offer' | 'Rejected';

export interface Application {
  id: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  dateApplied: string;
  currentStage: ApplicationStage;
  applicationStatus: string;
  salaryRange: string;
  resumeVersion: string;
  portfolioVersion: string;
  recruiter: string;
  nextAction: string;
  nextActionDate: string;
  notes: string;
  jobDescription: string;
  screeningQuestions: string[];
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  extractedProfile: string;
  screeningAnswers: string;
  score: number;
  scoreReasoning: string;
  applicationId: string;
  submittedAt: string;
}

export interface Interview {
  id: string;
  title: string;
  company: string;
  date: string;
  time: string;
  format: string;
  applicationId: string;
}

export interface Contact {
  id: string;
  name: string;
  role: string;
  company: string;
  followUpDate: string;
  followUpStatus: 'Overdue' | 'Today' | 'Tomorrow' | 'Upcoming';
}

// ─── Fetchers ─────────────────────────────────────────────────────────────────

export async function fetchApplications(): Promise<Application[]> {
  const records = await base(TABLES.applications)
    .select({ view: 'Grid view', cellFormat: 'string', timeZone: 'America/Bogota', userLocale: 'en-us' })
    .all();
  return records.map(mapApplication);
}

export async function fetchApplicationById(id: string): Promise<Application | null> {
  try {
    const records = await base(TABLES.applications)
      .select({
        filterByFormula: `RECORD_ID() = '${id}'`,
        cellFormat: 'string',
        timeZone: 'America/Bogota',
        userLocale: 'en-us',
      })
      .firstPage();
    if (!records.length) return null;
    return mapApplication(records[0]);
  } catch {
    return null;
  }
}

export async function fetchCandidates(): Promise<Candidate[]> {
  try {
    const records = await base(TABLES.candidates).select({ view: 'Grid view' }).all();
    return records.map((r) => ({
      id:               r.id,
      name:             (r.fields['Name'] as string) ?? '',
      email:            (r.fields['Email'] as string) ?? '',
      phone:            (r.fields['Phone'] as string) ?? '',
      extractedProfile: (r.fields['ExtractedProfile'] as string) ?? '',
      screeningAnswers: (r.fields['ScreeningAnswers'] as string) ?? '',
      score:            (r.fields['Score'] as number) ?? 0,
      scoreReasoning:   (r.fields['ScoreReasoning'] as string) ?? '',
      applicationId:    (r.fields['Application'] as string[])?.[0] ?? '',
      submittedAt:      (r.fields['Submitted At'] as string) ?? '',
    }));
  } catch { return []; }
}

function mapApplication(r: Airtable.Record<Airtable.FieldSet>): Application {
  const raw = (r.fields['Screening Questions'] as string) ?? '';
  const screeningQuestions = raw
    .split('\n')
    .map(q => q.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  return {
    id:               r.id,
    jobTitle:         (r.fields['Job Title'] as string) ?? '',
    company:          (r.fields['Company'] as string) ?? '',
    jobUrl:           (r.fields['Job URL'] as string) ?? '',
    dateApplied:      (r.fields['Date Applied'] as string) ?? '',
    currentStage:     (r.fields['Current Stage'] as ApplicationStage) ?? 'Applied',
    applicationStatus:(r.fields['Application Status'] as string) ?? '',
    salaryRange:      (r.fields['Salary Range'] as string) ?? '',
    resumeVersion:    (r.fields['Resume Version'] as string) ?? '',
    portfolioVersion: (r.fields['Portfolio Version'] as string) ?? '',
    recruiter:        (r.fields['Recruiter'] as string) ?? '',
    nextAction:       (r.fields['Next Action'] as string) ?? '',
    nextActionDate:   (r.fields['Next Action Date'] as string) ?? '',
    notes:            (r.fields['Notes'] as string) ?? '',
    jobDescription:   (r.fields['Job Description'] as string) ?? '',
    screeningQuestions,
  };
}

export async function fetchInterviews(): Promise<Interview[]> {
  try {
    const records = await base(TABLES.interviews).select({ view: 'Grid view' }).all();
    return records.map((r) => ({
      id:            r.id,
      title:         (r.fields['Title'] as string) ?? '',
      company:       (r.fields['Company'] as string) ?? '',
      date:          (r.fields['Date'] as string) ?? '',
      time:          (r.fields['Time'] as string) ?? '',
      format:        (r.fields['Format'] as string) ?? 'Online',
      applicationId: (r.fields['Application'] as string[])?.[0] ?? '',
    }));
  } catch { return []; }
}

export async function fetchContacts(): Promise<Contact[]> {
  try {
    const records = await base(TABLES.contacts).select({ view: 'Grid view' }).all();
    return records.map((r) => ({
      id:             r.id,
      name:           (r.fields['Name'] as string) ?? '',
      role:           (r.fields['Role'] as string) ?? '',
      company:        (r.fields['Company'] as string) ?? '',
      followUpDate:   (r.fields['Follow-up Date'] as string) ?? '',
      followUpStatus: (r.fields['Follow-up Status'] as Contact['followUpStatus']) ?? 'Upcoming',
    }));
  } catch { return []; }
}

export async function createApplication(
  data: Omit<Application, 'id'>
): Promise<Application> {
  const record = await base(TABLES.applications).create({
    'Job Title':          data.jobTitle,
    'Company':            data.company,
    'Job URL':            data.jobUrl,
    'Date Applied':       data.dateApplied,
    'Current Stage':      data.currentStage,
    'Application Status': data.applicationStatus,
    'Salary Range':       data.salaryRange,
    'Next Action':        data.nextAction || '',
    'Notes':              data.notes || '',
  } as Airtable.FieldSet, { typecast: true });
  return mapApplication(record);
}

export async function createCandidate(data: Omit<Candidate, 'id'>): Promise<Candidate> {
  const record = await base(TABLES.candidates).create({
    'Name':             data.name,
    'Email':            data.email,
    'Phone':            data.phone,
    'ExtractedProfile': data.extractedProfile,
    'ScreeningAnswers': data.screeningAnswers,
    'Score':            data.score,
    'ScoreReasoning':   data.scoreReasoning,
    'Application':      data.applicationId ? [data.applicationId] : [],
    'Submitted At': data.submittedAt.split('T')[0],
  });
  return {
    id:               record.id,
    name:             (record.fields['Name'] as string) ?? '',
    email:            (record.fields['Email'] as string) ?? '',
    phone:            (record.fields['Phone'] as string) ?? '',
    extractedProfile: (record.fields['ExtractedProfile'] as string) ?? '',
    screeningAnswers: (record.fields['ScreeningAnswers'] as string) ?? '',
    score:            (record.fields['Score'] as number) ?? 0,
    scoreReasoning:   (record.fields['ScoreReasoning'] as string) ?? '',
    applicationId:    data.applicationId,
    submittedAt:      data.submittedAt,
  };
}