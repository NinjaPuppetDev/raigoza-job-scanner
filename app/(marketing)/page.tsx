'use client';

import Link from 'next/link';
import { ArrowRight, FileText, BarChart2, Lightbulb, Check } from 'lucide-react';
import styles from './marketing.module.css';
import { Reveal } from './reveal';

const METRICS = [
  { label: 'Skills Match', pct: 94 },
  { label: 'Experience', pct: 88 },
  { label: 'Keywords', pct: 91 },
  { label: 'Formatting', pct: 82 },
];

const FEATURES = [
  {
    icon: <FileText size={18} />,
    title: 'Track',
    body: 'Keep every application organized in one place.',
  },
  {
    icon: <BarChart2 size={18} />,
    title: 'Analyze',
    body: 'Upload your resume and receive an AI match score tailored to every job.',
  },
  {
    icon: <Lightbulb size={18} />,
    title: 'Improve',
    body: 'Understand exactly which skills and keywords are preventing interviews.',
  },
];

const PLANS = [
  {
    name: 'Free',
    price: '$0',
    period: '/mo',
    description: '5 resume reviews per month. Full application tracking, no card required.',
    features: ['Application tracker', 'Public apply pages', '5 AI resume reviews/mo'],
    cta: 'Get Started',
    href: '/login',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/mo',
    description: 'For recruiters actively hiring. Unlimited reviews, cancel anytime.',
    features: ['Everything in Free', 'Unlimited AI resume reviews', 'Priority scoring'],
    cta: 'Upgrade to Pro',
    href: '/api/stripe/checkout',
    highlight: true,
  },
];

function MatchRing({ pct }: { pct: number }) {
  const r = 34;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct / 100);
  return (
    <svg width="88" height="88" viewBox="0 0 88 88" className={styles.ring}>
      <circle cx="44" cy="44" r={r} className={styles.ringTrack} strokeWidth="7" fill="none" />
      <circle
        cx="44" cy="44" r={r}
        className={styles.ringFill}
        strokeWidth="7"
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 44 44)"
      />
      <text x="44" y="41" textAnchor="middle" className={styles.ringNum}>{pct}</text>
      <text x="44" y="56" textAnchor="middle" className={styles.ringPct}>%</text>
    </svg>
  );
}

export default function LandingPage() {
  return (
    <main className={styles.main}>
      {/* Hero */}
      <section className={styles.hero}>
        <Reveal>
          <span className={styles.eyebrow}>
            <span className={styles.eyebrowDot} />
            AI-powered resume matching
          </span>
          <h1 className={styles.heroTitle}>Land More<br />Interviews.</h1>
          <p className={styles.heroSub}>
            Track every application, upload your resume, and receive an AI-powered
            match score before you hit Apply.
          </p>
          <div className={styles.heroActions}>
            <Link href="/login" className={styles.btnPrimaryLg}>
              Start Free <ArrowRight size={15} />
            </Link>
            <Link href="#how-it-works" className={styles.linkGhost}>
              See how it works <ArrowRight size={13} />
            </Link>
          </div>
        </Reveal>

        {/* Resume match card */}
        <Reveal delay={150}>
          <div className={styles.matchCard}>
            <div className={styles.matchHeader}>
              <div>
                <span className={styles.matchEyebrow}>RESUME MATCH</span>
                <span className={styles.matchSubtitle}>Senior Product Designer · Figma</span>
              </div>
              <span className={styles.badgeExcellent}>Excellent Match</span>
            </div>

            <div className={styles.matchBody}>
              <MatchRing pct={89} />
              <div className={styles.matchSummary}>
                <strong>Excellent</strong>
                <p>Your resume is a strong fit for this role.</p>
              </div>
            </div>

            <div className={styles.matchMetrics}>
              {METRICS.map((m) => (
                <div key={m.label} className={styles.metricRow}>
                  <span className={styles.metricLabel}>{m.label}</span>
                  <div className={styles.metricTrack}>
                    <div className={styles.metricFill} style={{ width: `${m.pct}%` }} />
                  </div>
                  <span className={styles.metricPct}>{m.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* Feature grid */}
      <section id="how-it-works" className={styles.features}>
        {FEATURES.map((f, i) => (
          <Reveal key={f.title} delay={i * 100} className={styles.featureCard}>
            <div className={styles.featureIcon}>{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </Reveal>
        ))}
      </section>

      {/* Pricing */}
      <section id="pricing" className={styles.features} style={{ scrollMarginTop: 96 }}>
        {PLANS.map((plan, i) => (
          <Reveal
            key={plan.name}
            delay={i * 100}
            className={styles.featureCard}
            style={plan.highlight ? { border: '2px solid var(--accent, #111)' } : undefined}
          >
            <h3>{plan.name}</h3>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, margin: '8px 0' }}>
              <span style={{ fontSize: 32, fontWeight: 800 }}>{plan.price}</span>
              <span style={{ fontSize: 13, color: 'var(--text-secondary, #666)' }}>{plan.period}</span>
            </div>
            <p>{plan.description}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '16px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {plan.features.map((f) => (
                <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                  <Check size={14} /> {f}
                </li>
              ))}
            </ul>
            <Link
              href={plan.href}
              className={plan.highlight ? styles.btnPrimaryLg : styles.linkGhost}
            >
              {plan.cta} <ArrowRight size={plan.highlight ? 15 : 13} />
            </Link>
          </Reveal>
        ))}
      </section>

      {/* CTA */}
      <section className={styles.ctaSection}>
        <Reveal>
          <h2>Ready to apply<br />with confidence?</h2>
          <p>Start free, upgrade whenever you need more reviews.</p>
          <Link href="/login" className={styles.btnPrimaryLg}>
            Create Free Account <ArrowRight size={15} />
          </Link>
        </Reveal>
      </section>
    </main>
  );
}