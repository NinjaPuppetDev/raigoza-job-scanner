'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  LayoutDashboard, Briefcase, Building2, Users, CalendarDays,
  FolderOpen, FileText, BarChart2, Bell, Search, Plus, TrendingUp,
  ChevronDown, MoreHorizontal, CheckCircle2, Activity, X
} from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import type { Application, ApplicationStage } from '@/lib/airtable';
import Sidebar from '@/components/Sidebar';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DashboardData {
  stats: {
    total: number; active: number; interviews: number;
    offers: number; responseRate: number;
  };
  funnel: { stage: string; count: number; pct: number }[];
  timeline: { label: string; count: number }[];
  recentApplications: Application[];
  upcomingInterviews: { id: string; title: string; company: string; date: string; time: string; format: string }[];
  followUps: { id: string; name: string; role: string; company: string; followUpDate: string; followUpStatus: string }[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function stageBadge(stage: ApplicationStage) {
  const map: Record<string, string> = {
    Applied: 'badge-status badge-applied',
    'Recruiter Screen': 'badge-status badge-recruiter',
    'Hiring Manager': 'badge-status badge-hiring',
    'Final Interview': 'badge-status badge-final',
    Offer: 'badge-status badge-offer',
    Rejected: 'badge-status badge-rejected',
  };
  return map[stage] ?? 'badge-status badge-applied';
}

function stageLabel(stage: ApplicationStage) {
  const map: Record<string, string> = {
    'Recruiter Screen': 'Recruiter Screen',
    'Hiring Manager': 'Hiring Manager',
    'Final Interview': 'Final Interview',
  };
  return map[stage] ?? stage;
}

function followupClass(status: string) {
  if (status === 'Overdue') return 'followup-status status-overdue';
  if (status === 'Today') return 'followup-status status-today';
  if (status === 'Tomorrow') return 'followup-status status-tomorrow';
  return 'followup-status';
}

function parseDateParts(dateStr: string) {
  if (!dateStr) return { month: '—', day: '—' };
  const d = new Date(dateStr);
  return {
    month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
    day: d.getDate().toString(),
  };
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const STAT_ICONS = [
  { icon: <Briefcase size={16} />, bg: '#ede9ff', color: '#5b4ff5' },
  { icon: <Activity size={16} />, bg: '#ede9ff', color: '#5b4ff5' },
  { icon: <CalendarDays size={16} />, bg: '#ede9ff', color: '#5b4ff5' },
  { icon: <CheckCircle2 size={16} />, bg: '#dcfce7', color: '#16a34a' },
  { icon: <TrendingUp size={16} />, bg: '#dbeafe', color: '#2563eb' },
];

// ─── Add Application Modal ────────────────────────────────────────────────────

function AddApplicationModal({ onClose, onSaved }: { onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    jobTitle: '', company: '', jobUrl: '', dateApplied: new Date().toISOString().slice(0, 10),
    currentStage: 'Applied' as ApplicationStage,
    applicationStatus: '', salaryRange: '', resumeVersion: '',
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

const handleSubmit = async () => {
    if (!form.jobTitle || !form.company) return;
    setSaving(true);
    try {
      // Strip linked record fields before sending — Airtable rejects them
      const { resumeVersion, ...safePayload } = form;
      void resumeVersion; // suppress unused var warning
      await fetch('/api/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(safePayload),
      });
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Add Application</h2>
        <div className="form-grid">
          <div className="form-row">
            <label className="form-label">Job Title *</label>
            <input className="form-input" name="jobTitle" value={form.jobTitle} onChange={handleChange} placeholder="Senior Product Designer" />
          </div>
          <div className="form-row">
            <label className="form-label">Company *</label>
            <input className="form-input" name="company" value={form.company} onChange={handleChange} placeholder="Stripe" />
          </div>
        </div>
        <div className="form-row">
          <label className="form-label">Job URL</label>
          <input className="form-input" name="jobUrl" value={form.jobUrl} onChange={handleChange} placeholder="https://..." />
        </div>
        <div className="form-grid">
          <div className="form-row">
            <label className="form-label">Date Applied</label>
            <input className="form-input" type="date" name="dateApplied" value={form.dateApplied} onChange={handleChange} />
          </div>
          <div className="form-row">
            <label className="form-label">Stage</label>
            <select className="form-select" name="currentStage" value={form.currentStage} onChange={handleChange}>
              {['Applied', 'Recruiter Screen', 'Hiring Manager', 'Final Interview', 'Offer', 'Rejected'].map(s => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="form-grid">
          <div className="form-row">
            <label className="form-label">Salary Range</label>
            <input className="form-input" name="salaryRange" value={form.salaryRange} onChange={handleChange} placeholder="$90k – $120k" />
          </div>
          <div className="form-row">
            <label className="form-label">Resume Version</label>
            <input className="form-input" name="resumeVersion" value={form.resumeVersion} onChange={handleChange} placeholder="v3-product" />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving}>
            {saving ? 'Saving…' : 'Save Application'}
          </button>
        </div>
      </div>
    </div>
  );
}



// ─── Custom Tooltip for chart ─────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text-secondary)' }}>{label}</div>
      <div style={{ fontWeight: 700, color: 'var(--accent)' }}>{payload[0].value} apps</div>
    </div>
  );
}

// ─── Dashboard Page ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Demo fallback data so UI renders even without Airtable connected
  const demo: DashboardData = {
    stats: { total: 48, active: 17, interviews: 5, offers: 1, responseRate: 37 },
    funnel: [
      { stage: 'Applied', count: 48, pct: 100 },
      { stage: 'Recruiter Screen', count: 21, pct: 44 },
      { stage: 'Hiring Manager', count: 12, pct: 25 },
      { stage: 'Final Interview', count: 5, pct: 10 },
      { stage: 'Offer', count: 1, pct: 2 },
    ],
    timeline: [
      { label: 'May 1', count: 6 }, { label: 'May 8', count: 14 },
      { label: 'May 15', count: 22 }, { label: 'May 22', count: 38 },
      { label: 'May 29', count: 48 },
    ],
    recentApplications: [
      { id: '1', jobTitle: 'Senior Product Designer', company: 'Stripe', jobUrl: '', dateApplied: '2024-05-20', currentStage: 'Hiring Manager', applicationStatus: '', salaryRange: '', resumeVersion: '', portfolioVersion: '', recruiter: '', nextAction: '', nextActionDate: '', notes: '', jobDescription: '', screeningQuestions: [] },
      { id: '2', jobTitle: 'Product Designer', company: 'Linear', jobUrl: '', dateApplied: '2024-05-18', currentStage: 'Final Interview', applicationStatus: '', salaryRange: '', resumeVersion: '', portfolioVersion: '', recruiter: '', nextAction: '', nextActionDate: '', notes: '', jobDescription: '', screeningQuestions: [] },
      { id: '3', jobTitle: 'Staff Product Designer', company: 'Figma', jobUrl: '', dateApplied: '2024-05-10', currentStage: 'Final Interview', applicationStatus: '', salaryRange: '', resumeVersion: '', portfolioVersion: '', recruiter: '', nextAction: '', nextActionDate: '', notes: '', jobDescription: '', screeningQuestions: [] },
      { id: '4', jobTitle: 'Product Designer', company: 'Notion', jobUrl: '', dateApplied: '2024-05-15', currentStage: 'Recruiter Screen', applicationStatus: '', salaryRange: '', resumeVersion: '', portfolioVersion: '', recruiter: '', nextAction: '', nextActionDate: '', notes: '', jobDescription: '', screeningQuestions: [] },
      { id: '5', jobTitle: 'Senior Designer', company: 'Vercel', jobUrl: '', dateApplied: '2024-05-21', currentStage: 'Applied', applicationStatus: '', salaryRange: '', resumeVersion: '', portfolioVersion: '', recruiter: '', nextAction: '', nextActionDate: '', notes: '', jobDescription: '', screeningQuestions: [] },
    ],
    upcomingInterviews: [
      { id: '1', title: 'Design Review', company: 'Stripe', date: '2024-05-23', time: '10:00 AM', format: 'Online' },
      { id: '2', title: 'Portfolio Presentation', company: 'Linear', date: '2024-05-24', time: '2:00 PM', format: 'Online' },
      { id: '3', title: 'Final Interview', company: 'Figma', date: '2024-05-26', time: '11:00 AM', format: 'Online' },
      { id: '4', title: 'Hiring Manager Chat', company: 'Notion', date: '2024-05-28', time: '1:00 PM', format: 'Online' },
      { id: '5', title: 'Culture Fit Interview', company: 'Vercel', date: '2024-05-30', time: '3:00 PM', format: 'Online' },
    ],
    followUps: [
      { id: '1', name: 'Alex Kim', role: 'Recruiter', company: 'Airbnb', followUpDate: '2024-05-22', followUpStatus: 'Overdue' },
      { id: '2', name: 'Sarah Johnson', role: 'Hiring Manager', company: 'Dropbox', followUpDate: '2024-05-24', followUpStatus: 'Today' },
      { id: '3', name: 'Michael Chen', role: 'Designer', company: 'Pinterest', followUpDate: '2024-05-25', followUpStatus: 'Tomorrow' },
    ],
  };

  const d = data ?? demo;

  const statCards = [
    { label: 'Total Applications', value: d.stats.total, delta: '+12 this month' },
    { label: 'Active Applications', value: d.stats.active, delta: '+4 this week' },
    { label: 'Interviews Scheduled', value: d.stats.interviews, delta: 'This week' },
    { label: 'Offers', value: d.stats.offers, delta: '🎉 Congrats!' },
    { label: 'Response Rate', value: `${d.stats.responseRate}%`, delta: '+8% vs last month' },
  ];

  return (
    <div className="layout">
      <Sidebar />

      <main className="main">
        {/* Topbar */}
        <div className="topbar">
          <div className="topbar-greeting">
            <h1>{greeting()}, Raigoza 👋</h1>
            <p>Here&apos;s your job search overview</p>
          </div>
          <div className="topbar-actions">
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              <Plus size={15} /> Add Application
            </button>
            <div className="search-box">
              <Search size={13} /> Search...
            </div>
            <div className="notif-btn">
              <Bell size={15} />
              <span className="notif-badge">3</span>
            </div>
          </div>
        </div>

        <div className="content">
          {/* Stat cards */}
          <div className="stats-row">
            {statCards.map((s, i) => (
              <div key={s.label} className="stat-card">
                <div className="stat-header">
                  <span className="stat-label">{s.label}</span>
                  <div className="stat-icon" style={{ background: STAT_ICONS[i].bg, color: STAT_ICONS[i].color }}>
                    {STAT_ICONS[i].icon}
                  </div>
                </div>
                <div>
                  {loading
                    ? <div className="skeleton" style={{ height: 34, width: 80, marginBottom: 8 }} />
                    : <div className="stat-value">{s.value}</div>
                  }
                  <div className="stat-delta">{s.delta}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Mid row: funnel + chart */}
          <div className="mid-row">
            {/* Funnel */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Application Funnel</div>
                  <div className="card-subtitle">Overview of your job search pipeline</div>
                </div>
                <span className="card-action">This Month ▾</span>
              </div>
              <div className="card-body">
                {d.funnel.map((f) => (
                  <div key={f.stage} className="funnel-row">
                    <span className="funnel-label">{f.stage}</span>
                    <span className="funnel-num">{f.count}</span>
                    <div className="funnel-bar-track">
                      <div className="funnel-bar-fill" style={{ width: `${f.pct}%` }} />
                    </div>
                    <span className="funnel-pct">{f.pct}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Line chart */}
            <div className="card">
              <div className="card-header">
                <div>
                  <div className="card-title">Applications Over Time</div>
                  <div className="card-subtitle">Track your application volume</div>
                </div>
                <span className="card-action">This Month ▾</span>
              </div>
              <div className="card-body" style={{ paddingTop: 8 }}>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={d.timeline} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-2)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} tickLine={false} axisLine={false} />
                    <Tooltip content={<ChartTooltip />} />
                    <Line type="monotone" dataKey="count" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 4, fill: 'var(--accent)', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Bottom row: recent apps + right col */}
          <div className="bottom-row">
            {/* Recent Applications table */}
            <div className="card">
              <div className="card-header">
                <div className="card-title">Recent Applications</div>
                <span className="card-action">View all</span>
              </div>
              <div className="card-body">
                <table className="app-table">
                  <thead>
                    <tr>
                      <th>Job Title</th>
                      <th>Company</th>
                      <th>Status</th>
                      <th>Date Applied</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.recentApplications.map((app) => (
                      <tr key={app.id}>
                        <td>{app.jobTitle}</td>
                        <td>
                          <div className="company-cell">
                            <div className="company-logo">{app.company[0]}</div>
                            {app.company}
                          </div>
                        </td>
                        <td>
                          <span className={stageBadge(app.currentStage)}>
                            {stageLabel(app.currentStage)}
                          </span>
                        </td>
                        <td style={{ color: 'var(--text-secondary)' }}>
                          {app.dateApplied ? new Date(app.dateApplied).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td><MoreHorizontal size={15} style={{ color: 'var(--text-tertiary)', cursor: 'pointer' }} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right column */}
            <div className="right-col">
              {/* Upcoming Interviews */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Upcoming Interviews</div>
                  <span className="card-action">View all</span>
                </div>
                <div className="card-body">
                  {d.upcomingInterviews.map((iv) => {
                    const { month, day } = parseDateParts(iv.date);
                    return (
                      <div key={iv.id} className="interview-item">
                        <div className="interview-date">
                          <span className="month">{month}</span>
                          <span className="day">{day}</span>
                        </div>
                        <div className="interview-info">
                          <strong>{iv.title}</strong>
                          <span>{iv.company} · {iv.time} · {iv.format}</span>
                        </div>
                        <div className="interview-co-logo">{iv.company[0]}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Follow-ups Due */}
              <div className="card">
                <div className="card-header">
                  <div className="card-title">Follow-ups Due</div>
                  <span className="card-action">View all</span>
                </div>
                <div className="card-body">
                  {d.followUps.map((f) => {
                    const { month, day } = parseDateParts(f.followUpDate);
                    return (
                      <div key={f.id} className="followup-item">
                        <div className="followup-date">
                          <span className="month">{month}</span>
                          <span className="day">{day}</span>
                        </div>
                        <div className="followup-info">
                          <strong>{f.name}</strong>
                          <span>{f.role} · {f.company}</span>
                        </div>
                        <span className={followupClass(f.followUpStatus)}>
                          {f.followUpStatus === 'Overdue' ? 'Follow up' : f.followUpStatus}
                        </span>
                      </div>
                    );
                  })}
                  <div className="add-followup">
                    <Plus size={14} /> Add Follow-up
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showModal && (
        <AddApplicationModal onClose={() => setShowModal(false)} onSaved={load} />
      )}
    </div>
  );
}
