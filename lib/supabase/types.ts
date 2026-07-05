export type ApplicationStage =
  | 'Applied' | 'Recruiter Screen' | 'Hiring Manager'
  | 'Final Interview' | 'Offer' | 'Rejected';

export interface Application {
  id: string;
  userId: string;
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

export function mapApplication(r: any): Application {
  return {
    id: r.id,
    userId: r.user_id,
    jobTitle: r.job_title ?? '',
    company: r.company ?? '',
    jobUrl: r.job_url ?? '',
    dateApplied: r.date_applied ?? '',
    currentStage: (r.current_stage as ApplicationStage) ?? 'Applied',
    applicationStatus: r.application_status ?? '',
    salaryRange: r.salary_range ?? '',
    resumeVersion: r.resume_version ?? '',
    portfolioVersion: r.portfolio_version ?? '',
    recruiter: r.recruiter ?? '',
    nextAction: r.next_action ?? '',
    nextActionDate: r.next_action_date ?? '',
    notes: r.notes ?? '',
    jobDescription: r.job_description ?? '',
    screeningQuestions: r.screening_questions ?? [],
  };
}

export function mapInterview(r: any): Interview {
  return {
    id: r.id,
    title: r.title ?? '',
    company: r.company ?? '',
    date: r.date ?? '',
    time: r.time ?? '',
    format: r.format ?? 'Online',
    applicationId: r.application_id ?? '',
  };
}

export function mapContact(r: any): Contact {
  return {
    id: r.id,
    name: r.name ?? '',
    role: r.role ?? '',
    company: r.company ?? '',
    followUpDate: r.follow_up_date ?? '',
    followUpStatus: (r.follow_up_status as Contact['followUpStatus']) ?? 'Upcoming',
  };
}

export function mapCandidate(r: any): Candidate {
  return {
    id: r.id,
    name: r.name ?? '',
    email: r.email ?? '',
    phone: r.phone ?? '',
    extractedProfile: r.extracted_profile ?? '',
    screeningAnswers: r.screening_answers ?? '',
    score: r.score ?? 0,
    scoreReasoning: r.score_reasoning ?? '',
    applicationId: r.application_id ?? '',
    submittedAt: r.submitted_at ?? '',
  };
}