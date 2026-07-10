'use client';

import { useEffect, useState, use } from 'react';
import { Upload, FileText, CheckCircle, ChevronRight, ChevronLeft, Loader2, Star, AlertCircle, User, Mail, Phone, MapPin, Briefcase } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ExtractedProfile {
  name: string; email: string; phone: string; location: string;
  title: string; summary: string; skills: string[];
  experience: { company: string; title: string; start: string; end: string; bullets: string[] }[];
  education: { institution: string; degree: string; year: string }[];
}

interface ScoreResult {
  score: number; grade: string; summary: string;
  strengths: string[]; gaps: string[];
  recommendation: string;
  breakdown: { skills_match: number; experience_relevance: number; screening_quality: number; overall_fit: number };
}

interface JobData {
  id: string; jobTitle: string; company: string;
  jobDescription: string; screeningQuestions: string[];
  salaryRange: string;
}

// ─── Step indicator ───────────────────────────────────────────────────────────

function Steps({ current }: { current: number }) {
  const steps = ['Upload Resume', 'Review Info', 'Screening', 'Your Score'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {steps.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 'none' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: i < current ? 'var(--accent)' : i === current ? 'var(--accent)' : 'var(--border)',
              color: i <= current ? 'white' : 'var(--text-tertiary)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 13, fontWeight: 700,
              boxShadow: i === current ? '0 0 0 4px var(--accent-light)' : 'none',
              transition: 'all .3s',
            }}>
              {i < current ? <CheckCircle size={16} /> : i + 1}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: i <= current ? 'var(--accent)' : 'var(--text-tertiary)', whiteSpace: 'nowrap' }}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ flex: 1, height: 2, background: i < current ? 'var(--accent)' : 'var(--border)', margin: '0 8px', marginBottom: 20, transition: 'background .3s' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 54; const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ position: 'relative', width: 140, height: 140 }}>
      <svg width={140} height={140} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={70} cy={70} r={r} fill="none" stroke="var(--border)" strokeWidth={10} />
        <circle cx={70} cy={70} r={r} fill="none" stroke={color} strokeWidth={10}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 32, fontWeight: 800, letterSpacing: -1, color }}>{score}</span>
        <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 600 }}>/ 100</span>
      </div>
    </div>
  );
}

// ─── Breakdown bar ────────────────────────────────────────────────────────────

function BreakdownBar({ label, value }: { label: string; value: number }) {
  const color = value >= 75 ? 'var(--green)' : value >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{value}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border-2)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3, transition: 'width 1s ease' }} />
      </div>
    </div>
  );
}

// ─── Main apply page ──────────────────────────────────────────────────────────

export default function ApplyPage({ params }: { params: Promise<{ jobId: string }> }) {
  const { jobId } = use(params);
  const [step, setStep] = useState(0);
  const [job, setJob] = useState<JobData | null>(null);
  const [jobLoading, setJobLoading] = useState(true);

  // Step 0
  const [file, setFile] = useState<File | null>(null);
  const [pastedText, setPastedText] = useState('');
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

  // Step 1
  const [profile, setProfile] = useState<ExtractedProfile | null>(null);

  // Step 2
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [scoring, setScoring] = useState(false);
  const [scoreError, setScoreError] = useState('');

  // Step 3
  const [scoreResult, setScoreResult] = useState<ScoreResult | null>(null);

  // Load job data
  useEffect(() => {
    fetch(`/api/applications/${jobId}`)
      .then(r => r.json())
      .then(setJob)
      .catch(() => setJob(null))
      .finally(() => setJobLoading(false));
  }, [jobId]);

  // ── Step 0: Extract ─────────────────────────────────────────────────────────
  const handleExtract = async () => {
    setExtracting(true);
    setExtractError('');
    try {
      const fd = new FormData();
      if (file) fd.append('resume', file);
      else if (pastedText) fd.append('text', pastedText);
      else { setExtractError('Please upload a PDF or paste your resume text.'); return; }

      const res = await fetch('/api/extract', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setProfile(data.profile);
      setStep(1);
    } catch (e) {
      setExtractError((e as Error).message ?? 'Extraction failed. Try pasting your resume text instead.');
    } finally {
      setExtracting(false);
    }
  };

  // ── Step 2: Score ───────────────────────────────────────────────────────────
  const handleScore = async () => {
    setScoring(true);
    setScoreError('');
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: jobId, profile, screeningAnswers: answers }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.upgradeRequired) {
          setScoreError(
            "This posting has reached its review limit for the month. The recruiter needs to upgrade — please try again later or reach out directly."
          );
        } else {
          throw new Error(data.error);
        }
        return;
      }
      setScoreResult(data.score);
      setStep(3);
    } catch (e) {
      console.error(e);
      setScoreError('Something went wrong while scoring your application. Please try again.');
    } finally {
      setScoring(false);
    }
  };

  // ── Shared card wrapper ─────────────────────────────────────────────────────
  const card = (children: React.ReactNode) => (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 16, padding: '32px 36px',
      boxShadow: '0 4px 24px rgba(0,0,0,.06)',
      width: '100%', maxWidth: 620,
    }}>{children}</div>
  );

  if (jobLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
      <Loader2 size={28} style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }} />
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 20px' }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } } @keyframes fadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } } .fadein { animation: fadeIn .4s ease; }`}</style>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36, width: '100%', maxWidth: 620 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          <div style={{ width: 36, height: 36, background: 'var(--accent)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16 }}>R</div>
          <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: -.3 }}>Raigoza Job Scanner</span>
        </div>
        {job && (
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -.5, marginBottom: 6 }}>{job.jobTitle}</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
              {job.company}{job.salaryRange ? ` · ${job.salaryRange}` : ''}
            </p>
          </div>
        )}
      </div>

      <div style={{ width: '100%', maxWidth: 620 }}>
        <Steps current={step} />
      </div>

      {/* ── Step 0: Upload ── */}
      {step === 0 && card(
        <div className="fadein">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Upload your resume</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>Upload a PDF or paste your resume text. Our AI will extract your information.</p>

          {/* Drop zone */}
          <label style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            border: `2px dashed ${file ? 'var(--accent)' : 'var(--border)'}`,
            borderRadius: 12, padding: '32px 20px', cursor: 'pointer',
            background: file ? 'var(--accent-light)' : 'var(--surface-2)',
            transition: 'all .2s', marginBottom: 20,
          }}>
            <input type="file" accept=".pdf" style={{ display: 'none' }}
              onChange={e => { setFile(e.target.files?.[0] ?? null); setPastedText(''); }} />
            {file
              ? <><FileText size={28} style={{ color: 'var(--accent)', marginBottom: 8 }} /><span style={{ fontWeight: 600, color: 'var(--accent)' }}>{file.name}</span><span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>Click to change</span></>
              : <><Upload size={28} style={{ color: 'var(--text-tertiary)', marginBottom: 8 }} /><span style={{ fontWeight: 600 }}>Drop PDF here or click to upload</span><span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 4 }}>PDF only · Max 5MB</span></>
            }
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontWeight: 500 }}>or paste text</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <textarea
            value={pastedText}
            onChange={e => { setPastedText(e.target.value); setFile(null); }}
            placeholder="Paste your resume text here..."
            style={{
              width: '100%', height: 120, border: '1px solid var(--border)',
              borderRadius: 10, padding: '10px 12px', fontFamily: 'inherit',
              fontSize: 13, color: 'var(--text-primary)', background: 'var(--surface-2)',
              resize: 'vertical', outline: 'none',
            }}
          />

          {extractError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)', fontSize: 13, marginTop: 12, background: 'var(--red-light)', padding: '10px 14px', borderRadius: 8 }}>
              <AlertCircle size={15} /> {extractError}
            </div>
          )}

          <button className="btn-primary" onClick={handleExtract} disabled={extracting || (!file && !pastedText.trim())}
            style={{ width: '100%', justifyContent: 'center', marginTop: 20, padding: '12px', fontSize: 14, opacity: (!file && !pastedText.trim()) ? .5 : 1 }}>
            {extracting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Extracting with AI…</> : <>Extract Information <ChevronRight size={16} /></>}
          </button>
        </div>
      )}

      {/* ── Step 1: Review ── */}
      {step === 1 && profile && card(
        <div className="fadein">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Review your information</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 24 }}>Our AI extracted this from your resume. Edit anything that's incorrect.</p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
            {[
              { icon: <User size={13} />, label: 'Full Name', key: 'name' },
              { icon: <Mail size={13} />, label: 'Email', key: 'email' },
              { icon: <Phone size={13} />, label: 'Phone', key: 'phone' },
              { icon: <MapPin size={13} />, label: 'Location', key: 'location' },
              { icon: <Briefcase size={13} />, label: 'Current Title', key: 'title' },
            ].map(({ icon, label, key }) => (
              <div key={key} style={{ gridColumn: key === 'title' ? '1 / -1' : undefined }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>{icon} {label}</label>
                <input className="form-input" value={(profile as unknown as Record<string, string>)[key] ?? ''}
                  onChange={e => setProfile(p => p ? { ...p, [key]: e.target.value } : p)} />
              </div>
            ))}
          </div>

          <div style={{ marginBottom: 14 }}>
            <label className="form-label">Summary</label>
            <textarea value={profile.summary} onChange={e => setProfile(p => p ? { ...p, summary: e.target.value } : p)}
              style={{ width: '100%', height: 80, border: '1px solid var(--border)', borderRadius: 8, padding: '9px 12px', fontFamily: 'inherit', fontSize: 13, resize: 'vertical', outline: 'none', background: 'var(--surface-2)' }} />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label className="form-label">Skills detected</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {profile.skills.map((s, i) => (
                <span key={i} style={{ background: 'var(--accent-light)', color: 'var(--accent)', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600 }}>{s}</span>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-ghost" onClick={() => setStep(0)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ChevronLeft size={15} /> Back</button>
            <button className="btn-primary" onClick={() => setStep(2)} style={{ flex: 1, justifyContent: 'center' }}>
              Continue to Screening <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Screening ── */}
      {step === 2 && card(
        <div className="fadein">
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>Screening questions</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 28 }}>Answer these questions to help the hiring team evaluate your fit.</p>

          {(job?.screeningQuestions?.length ?? 0) === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-tertiary)' }}>
              <FileText size={32} style={{ marginBottom: 12, opacity: .4 }} />
              <p style={{ fontSize: 14 }}>No screening questions for this role.</p>
            </div>
          ) : (
            job?.screeningQuestions.map((q, i) => (
              <div key={i} style={{ marginBottom: 22 }}>
                <label className="form-label" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8, display: 'block' }}>
                  <span style={{ color: 'var(--accent)', marginRight: 6 }}>{i + 1}.</span>{q}
                </label>
                <textarea
                  value={answers[`q${i}`] ?? ''}
                  onChange={e => setAnswers(a => ({ ...a, [`q${i}`]: e.target.value }))}
                  placeholder="Your answer..."
                  rows={3}
                  style={{ width: '100%', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontFamily: 'inherit', fontSize: 13, resize: 'vertical', outline: 'none', background: 'var(--surface-2)' }}
                />
              </div>
            ))
          )}

          {scoreError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--red)', fontSize: 13, marginBottom: 16, background: 'var(--red-light)', padding: '10px 14px', borderRadius: 8 }}>
              <AlertCircle size={15} /> {scoreError}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn-ghost" onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><ChevronLeft size={15} /> Back</button>
            <button className="btn-primary" onClick={handleScore} disabled={scoring} style={{ flex: 1, justifyContent: 'center' }}>
              {scoring ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Scoring your application…</> : <>Submit Application <ChevronRight size={16} /></>}
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Score ── */}
      {step === 3 && scoreResult && card(
        <div className="fadein">
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <CheckCircle size={36} style={{ color: 'var(--green)', marginBottom: 12 }} />
            <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 6 }}>Application submitted!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Here's how you matched for <strong>{job?.jobTitle}</strong> at <strong>{job?.company}</strong></p>
          </div>

          {/* Score ring + grade */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 32, padding: '24px', background: 'var(--bg)', borderRadius: 12, marginBottom: 24 }}>
            <ScoreRing score={scoreResult.score} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 6 }}>
                <span style={{ fontSize: 28, fontWeight: 800 }}>{scoreResult.grade}</span>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{scoreResult.recommendation}</span>
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{scoreResult.summary}</p>
            </div>
          </div>

          {/* Breakdown */}
          <div style={{ marginBottom: 24 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: .5, marginBottom: 14 }}>Score Breakdown</h3>
            <BreakdownBar label="Skills Match" value={scoreResult.breakdown.skills_match} />
            <BreakdownBar label="Experience Relevance" value={scoreResult.breakdown.experience_relevance} />
            <BreakdownBar label="Screening Quality" value={scoreResult.breakdown.screening_quality} />
            <BreakdownBar label="Overall Fit" value={scoreResult.breakdown.overall_fit} />
          </div>

          {/* Strengths + Gaps */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div style={{ background: 'var(--green-light)', borderRadius: 10, padding: '14px 16px' }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#15803d', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .4 }}>Strengths</h4>
              {scoreResult.strengths.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                  <Star size={11} style={{ color: '#15803d', marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#166534' }}>{s}</span>
                </div>
              ))}
            </div>
            <div style={{ background: 'var(--amber-light)', borderRadius: 10, padding: '14px 16px' }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#92400e', marginBottom: 10, textTransform: 'uppercase', letterSpacing: .4 }}>Areas to Address</h4>
              {scoreResult.gaps.map((g, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, marginBottom: 6 }}>
                  <AlertCircle size={11} style={{ color: '#92400e', marginTop: 2, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#92400e' }}>{g}</span>
                </div>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)' }}>
            Your application has been saved. The hiring team will be in touch.
          </p>
        </div>
      )}
    </div>
  );
}
