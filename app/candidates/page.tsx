'use client';

import { useEffect, useState } from 'react';
import { Users, ChevronDown, Star, AlertCircle, Search } from 'lucide-react';
import { LayoutDashboard, Briefcase, Building2, CalendarDays, FolderOpen, FileText, BarChart2, Bell, Plus } from 'lucide-react';
import type { Candidate } from '@/lib/airtable';
import Sidebar from '@/components/Sidebar';


// ─── Score ring ───────────────────────────────────────────────────────────────

function ScoreRing({ score }: { score: number }) {
  const r = 20; const circ = 2 * Math.PI * r;
  const fill = (score / 100) * circ;
  const color = score >= 75 ? 'var(--green)' : score >= 50 ? 'var(--amber)' : 'var(--red)';
  return (
    <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
      <svg width={48} height={48} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={24} cy={24} r={r} fill="none" stroke="var(--border)" strokeWidth={4} />
        <circle cx={24} cy={24} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${fill} ${circ}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 800, color }}>{score}</span>
      </div>
    </div>
  );
}

// ─── Score breakdown panel ────────────────────────────────────────────────────

function ScorePanel({ candidate, onClose }: { candidate: Candidate; onClose: () => void }) {
  let parsed: {
    score: number; grade: string; summary: string; recommendation: string;
    strengths: string[]; gaps: string[];
    breakdown: { skills_match: number; experience_relevance: number; screening_quality: number; overall_fit: number };
  } | null = null;

  try { parsed = JSON.parse(candidate.scoreReasoning); } catch { /* empty */ }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
    }} onClick={onClose}>
      <div style={{
        background: 'var(--surface)', borderRadius: 16, padding: 32,
        width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,.2)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 17, fontWeight: 700 }}>{candidate.name}</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{candidate.email}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', fontSize: 20 }}>✕</button>
        </div>

        {parsed && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--bg)', borderRadius: 10, padding: 16, marginBottom: 20 }}>
              <ScoreRing score={parsed.score} />
              <div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                  <span style={{ fontSize: 22, fontWeight: 800 }}>{parsed.grade}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{parsed.recommendation}</span>
                </div>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, lineHeight: 1.5 }}>{parsed.summary}</p>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              {[
                ['Skills Match', parsed.breakdown.skills_match],
                ['Experience Relevance', parsed.breakdown.experience_relevance],
                ['Screening Quality', parsed.breakdown.screening_quality],
                ['Overall Fit', parsed.breakdown.overall_fit],
              ].map(([label, val]) => {
                const v = val as number;
                const color = v >= 75 ? 'var(--green)' : v >= 50 ? 'var(--amber)' : 'var(--red)';
                return (
                  <div key={label as string} style={{ marginBottom: 10 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{label}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{v}</span>
                    </div>
                    <div style={{ height: 5, background: 'var(--border-2)', borderRadius: 3 }}>
                      <div style={{ height: '100%', width: `${v}%`, background: color, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'var(--green-light)', borderRadius: 8, padding: '12px 14px' }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: '#15803d', marginBottom: 8, textTransform: 'uppercase', letterSpacing: .4 }}>Strengths</h4>
                {parsed.strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                    <Star size={10} style={{ color: '#15803d', marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#166534' }}>{s}</span>
                  </div>
                ))}
              </div>
              <div style={{ background: 'var(--amber-light)', borderRadius: 8, padding: '12px 14px' }}>
                <h4 style={{ fontSize: 11, fontWeight: 700, color: '#92400e', marginBottom: 8, textTransform: 'uppercase', letterSpacing: .4 }}>Gaps</h4>
                {parsed.gaps.map((g, i) => (
                  <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 5 }}>
                    <AlertCircle size={10} style={{ color: '#92400e', marginTop: 2, flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#92400e' }}>{g}</span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Candidates Page ──────────────────────────────────────────────────────────

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Candidate | null>(null);

  useEffect(() => {
    fetch('/api/candidates')
      .then(r => r.json())
      .then(setCandidates)
      .finally(() => setLoading(false));
  }, []);

  const filtered = candidates.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const scoreColor = (s: number) => s >= 75 ? 'var(--green)' : s >= 50 ? 'var(--amber)' : 'var(--red)';

  let parsed: { grade: string } | null = null;

  return (
    <div className="layout">
      <Sidebar />
      <main className="main">
        <div className="topbar">
          <div className="topbar-greeting">
            <h1>Candidates</h1>
            <p>All applicants who submitted through the job scanner</p>
          </div>
          <div className="topbar-actions">
            <div className="search-box">
              <Search size={13} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search candidates..."
                style={{ border: 'none', background: 'none', outline: 'none', fontSize: 13, color: 'var(--text-primary)', width: 160 }}
              />
            </div>
          </div>
        </div>

        <div className="content">
          <div className="card">
            <div className="card-header">
              <div className="card-title">All Candidates ({filtered.length})</div>
            </div>
            <div className="card-body">
              {loading ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  <Users size={32} style={{ marginBottom: 12, opacity: .3 }} />
                  <p>No candidates yet.</p>
                </div>
              ) : (
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Job Applied</th>
                      <th>Score</th>
                      <th>Grade</th>
                      <th>Submitted</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(c => {
                      try { parsed = JSON.parse(c.scoreReasoning); } catch { parsed = null; }
                      return (
                        <tr key={c.id}>
                          <td style={{ fontWeight: 600 }}>{c.name || '—'}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                          <td>{c.applicationId || '—'}</td>
                          <td>
                            <span style={{ fontWeight: 700, color: scoreColor(c.score) }}>{c.score}</span>
                          </td>
                          <td>
                            <span style={{
                              background: c.score >= 75 ? 'var(--green-light)' : c.score >= 50 ? 'var(--amber-light)' : 'var(--red-light)',
                              color: c.score >= 75 ? '#15803d' : c.score >= 50 ? '#92400e' : 'var(--red)',
                              padding: '2px 8px', borderRadius: 12, fontSize: 12, fontWeight: 700,
                            }}>
                              {parsed?.grade ?? '—'}
                            </span>
                          </td>
                          <td style={{ color: 'var(--text-secondary)' }}>
                            {c.submittedAt ? new Date(c.submittedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                          <td>
                            <button
                              onClick={() => setSelected(c)}
                              style={{ fontSize: 12, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                            >
                              View Score
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>

      {selected && <ScorePanel candidate={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}