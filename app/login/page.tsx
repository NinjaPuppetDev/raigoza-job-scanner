'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

type Step = 'email' | 'code';

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);

  const wrapperStyle: React.CSSProperties = {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    boxSizing: 'border-box',
  };

  const cardStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 400,
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    boxSizing: 'border-box',
  };

  const sendCode = async () => {
    if (!email) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    // No emailRedirectTo — we want a numeric code, not a clickable link,
    // so the whole flow stays in this browser tab.
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    setStep('code');
    setTimeout(() => codeInputRef.current?.focus(), 50);
  };

  const verifyCode = async () => {
    if (code.length !== 6) return;
    setLoading(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: 'email',
    });
    setLoading(false);
    if (error) {
      setError('That code didn\'t work. Check it and try again, or request a new one.');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  };

  const resendCode = async () => {
    setResending(true);
    setError('');
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true },
    });
    setResending(false);
    if (error) setError(error.message);
  };

  if (step === 'code') {
    return (
      <main style={wrapperStyle}>
        <div style={cardStyle}>
          <h1>Enter your code</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
            We sent a 6-digit code to <strong>{email}</strong>. Enter it below.
          </p>
          <input
            ref={codeInputRef}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            className="form-input"
            style={{
              ...inputStyle,
              textAlign: 'center',
              fontSize: 24,
              letterSpacing: 8,
              fontVariantNumeric: 'tabular-nums',
            }}
            onKeyDown={(e) => e.key === 'Enter' && verifyCode()}
          />
          {error && <p style={{ color: '#dc2626', marginTop: 8, fontSize: 14 }}>{error}</p>}
          <button
            className="btn-primary"
            onClick={verifyCode}
            disabled={loading || code.length !== 6}
            style={{ marginTop: 16, width: '100%', boxSizing: 'border-box' }}
          >
            {loading ? 'Verifying…' : 'Verify & sign in'}
          </button>
          <button
            onClick={resendCode}
            disabled={resending}
            style={{
              marginTop: 12, width: '100%', background: 'none', border: 'none',
              color: 'var(--accent)', fontSize: 13, cursor: 'pointer', fontWeight: 600,
            }}
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
          <button
            onClick={() => { setStep('email'); setCode(''); setError(''); }}
            style={{
              marginTop: 4, width: '100%', background: 'none', border: 'none',
              color: 'var(--text-tertiary)', fontSize: 13, cursor: 'pointer',
            }}
          >
            Use a different email
          </button>
        </div>
      </main>
    );
  }

  return (
    <main style={wrapperStyle}>
      <div style={cardStyle}>
        <h1>Sign in</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
          Enter your email and we&apos;ll send you a code. No password needed.
        </p>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="form-input"
          style={inputStyle}
          onKeyDown={(e) => e.key === 'Enter' && sendCode()}
        />
        {error && <p style={{ color: '#dc2626', marginTop: 8, fontSize: 14 }}>{error}</p>}
        <button
          className="btn-primary"
          onClick={sendCode}
          disabled={loading || !email}
          style={{ marginTop: 16, width: '100%', boxSizing: 'border-box' }}
        >
          {loading ? 'Sending…' : 'Send code'}
        </button>
      </div>
    </main>
  );
}