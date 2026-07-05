'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Briefcase } from 'lucide-react';
import type { Application } from '@/lib/supabase/types';

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/applications')
      .then(r => r.json())
      .then(setApplications)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="topbar">
        <div className="topbar-greeting">
          <h1>Postings</h1>
          <p>Every job you&apos;re tracking, with a public apply page for each</p>
        </div>
      </div>

      <div className="content">
        <div className="card">
          <div className="card-header">
            <div className="card-title">All Postings ({applications.length})</div>
          </div>
          <div className="card-body">
            {loading ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                Loading...
              </div>
            ) : applications.length === 0 ? (
              <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                <Briefcase size={32} style={{ marginBottom: 12, opacity: .3 }} />
                <p>No postings yet. Add an application from the dashboard first.</p>
              </div>
            ) : (
              <table className="app-table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Company</th>
                    <th>Status</th>
                    <th>Apply Page</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id}>
                      <td style={{ fontWeight: 600 }}>{app.jobTitle}</td>
                      <td>
                        <div className="company-cell">
                          <div className="company-logo">{app.company[0]}</div>
                          {app.company}
                        </div>
                      </td>
                      <td style={{ color: 'var(--text-secondary)' }}>
                        {app.currentStage}
                      </td>
                      <td>
                        <Link
                          href={`/apply/${app.id}`}
                          target="_blank"
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            fontSize: 12, fontWeight: 600,
                            color: 'var(--accent)', textDecoration: 'none',
                          }}
                        >
                          <ExternalLink size={13} /> Open Apply Page
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </>
  );
}