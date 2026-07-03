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

export async function createApplication(supabase: SupabaseClient, data: Omit<Application, 'id'>): Promise<Application> {
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

export async function createCandidate(supabase: SupabaseClient, data: Omit<Candidate, 'id'>): Promise<Candidate> {
  const { data: row, error } = await supabase
    .from('candidates')
    .insert({
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