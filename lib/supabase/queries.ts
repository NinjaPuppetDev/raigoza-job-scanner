import type { SupabaseClient } from '@supabase/supabase-js';
import {
  mapApplication, mapInterview, mapContact, mapCandidate,
  type Application, type Interview, type Contact, type Candidate,
} from './types';

export async function fetchApplications(supabase: SupabaseClient): Promise<Application[]> {
  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('date_applied', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapApplication);
}

export async function fetchApplicationById(supabase: SupabaseClient, id: string): Promise<Application | null> {
  const { data, error } = await supabase.from('applications').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return mapApplication(data);
}

export async function fetchInterviews(supabase: SupabaseClient): Promise<Interview[]> {
  const { data, error } = await supabase.from('interviews').select('*').order('date', { ascending: true });
  if (error) return [];
  return (data ?? []).map(mapInterview);
}

export async function fetchContacts(supabase: SupabaseClient): Promise<Contact[]> {
  const { data, error } = await supabase.from('contacts').select('*').order('follow_up_date', { ascending: true });
  if (error) return [];
  return (data ?? []).map(mapContact);
}

export async function fetchCandidates(supabase: SupabaseClient): Promise<Candidate[]> {
  const { data, error } = await supabase.from('candidates').select('*');
  if (error) return [];
  return (data ?? []).map(mapCandidate);
}

// Returns a map of applicationId -> most recent score, for joining onto the
// applications list in the dashboard. Empty input short-circuits to avoid
// an unnecessary query.
export async function fetchLatestScores(
  supabase: SupabaseClient,
  applicationIds: string[]
): Promise<Record<string, number>> {
  if (applicationIds.length === 0) return {};
  const { data, error } = await supabase
    .from('candidates')
    .select('application_id, score, submitted_at')
    .in('application_id', applicationIds)
    .order('submitted_at', { ascending: false });
  if (error) return {};
  const latest: Record<string, number> = {};
  for (const row of data ?? []) {
    if (row.application_id && !(row.application_id in latest)) {
      latest[row.application_id] = row.score;
    }
  }
  return latest;
}

export async function createApplication(supabase: SupabaseClient, data: Omit<Application, 'id' | 'userId'>): Promise<Application> {
  const { data: row, error } = await supabase
    .from('applications')
    .insert({
      job_title: data.jobTitle,
      company: data.company,
      job_url: data.jobUrl,
      date_applied: data.dateApplied || null,
      current_stage: data.currentStage,
      application_status: data.applicationStatus,
      salary_range: data.salaryRange,
      next_action: data.nextAction || '',
      notes: data.notes || '',
    })
    .select()
    .single();
  if (error) throw error;
  return mapApplication(row);
}

// ownerId must be passed explicitly when inserting via the admin/service-role
// client (public apply flow) — that client has no auth session, so the
// column's `default auth.uid()` resolves to null and the row becomes
// invisible to the owner under RLS. Logged-in-session inserts could still
// rely on the default, but passing it explicitly here keeps one code path.
export async function createCandidate(
  supabase: SupabaseClient,
  data: Omit<Candidate, 'id'> & { ownerId: string }
): Promise<Candidate> {
  const { data: row, error } = await supabase
    .from('candidates')
    .insert({
      user_id: data.ownerId,
      name: data.name,
      email: data.email,
      phone: data.phone,
      extracted_profile: data.extractedProfile,
      screening_answers: data.screeningAnswers,
      score: data.score,
      score_reasoning: data.scoreReasoning,
      application_id: data.applicationId || null,
      submitted_at: data.submittedAt,
    })
    .select()
    .single();
  if (error) throw error;
  return mapCandidate(row);
}