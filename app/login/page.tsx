'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  };

  if (sent) {
    return (
      <main style={{ maxWidth: 400, margin: '120px auto', textAlign: 'center' }}>
        <h1>Check your inbox</h1>
        <p>We sent a sign-in link to {email}. Click it to continue.</p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 400, margin: '120px auto' }}>
      <h1>Sign in</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        Enter your email and we'll send you a link. No password needed.
      </p>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="form-input"
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      {error && <p style={{ color: '#dc2626', marginTop: 8 }}>{error}</p>}
      <button className="btn-primary" onClick={handleSubmit} disabled={loading} style={{ marginTop: 16, width: '100%' }}>
        {loading ? 'Sending…' : 'Send magic link'}
      </button>
    </main>
  );
}