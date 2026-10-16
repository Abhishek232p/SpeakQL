'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/src/client/auth/supabase';
import { WhaleMascot, SpeakQLLogo } from '@/src/client/components/whale-mascot';

const MAX_EMAIL_LENGTH = 320;
const MAX_PASSWORD_LENGTH = 1_024;

const supabase = createSupabaseBrowserClient();

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const normalizedEmail = email.trim();
    if (!supabase || !normalizedEmail || !password || normalizedEmail.length > MAX_EMAIL_LENGTH || password.length > MAX_PASSWORD_LENGTH) {
      toast.error('Unable to authenticate. Check your details and try again.');
      setLoading(false);
      return;
    }

    try {
      const result = isLogin
        ? await supabase.auth.signInWithPassword({ email: normalizedEmail, password })
        : await supabase.auth.signUp({ email: normalizedEmail, password });

      if (result.error) {
        toast.error(isLogin
          ? 'Unable to sign in. Check your email and password.'
          : 'Unable to create your account. Check your details and try again.');
      } else if (isLogin) {
        toast.success("Welcome back! Entering ocean world...");
        router.push('/dashboard');
        router.refresh();
      } else {
        toast.success('Sign up successful! Please check your email.');
      }
    } catch {
      toast.error(isLogin
        ? 'Unable to sign in. Check your email and password.'
        : 'Unable to create your account. Check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Ocean Nav */}
      <nav className="nav shell" aria-label="Primary navigation" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link className="wordmark" href="/" aria-label="SpeakQL home" style={{ textDecoration: 'none' }}>
          <SpeakQLLogo size={36} showText={true} />
        </Link>
        <Link href="/" style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>← Back to home</span>
        </Link>
      </nav>

      {/* Ocean Login Box */}
      <section
        style={{
          width: 'min(440px, calc(100% - 32px))',
          margin: '4vh auto 8vh',
          background: 'rgba(16, 22, 58, 0.85)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 92, 246, 0.35)',
          borderRadius: '24px',
          padding: '36px 32px',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 30px rgba(139, 92, 246, 0.15)',
          textAlign: 'left',
          position: 'relative',
        }}
      >
        {/* Welcome Mascot Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <WhaleMascot mood="happy" size={68} animated={true} />
          <div>
            <p
              className="eyebrow"
              style={{
                margin: '0 0 4px',
                color: '#38bdf8',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.12em',
              }}
            >
              {isLogin ? 'WELCOME BACK' : 'BEGIN YOUR ODYSSEY'}
            </p>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
              {isLogin ? 'Sign in to SpeakQL' : 'Create your account'}
            </h1>
          </div>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label
              htmlFor="email"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '13px', color: '#c4b5fd' }}
            >
              Email address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={MAX_EMAIL_LENGTH}
              required
              placeholder="you@example.com"
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(139, 92, 246, 0.3)',
                background: 'rgba(24, 32, 75, 0.7)',
                color: '#ffffff',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
              }}
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '13px', color: '#c4b5fd' }}
            >
              Password
            </label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={MAX_PASSWORD_LENGTH}
                required
                placeholder="••••••••••••"
                style={{
                  width: '100%',
                  padding: '0.85rem 3rem 0.85rem 1rem',
                  borderRadius: '12px',
                  border: '1px solid rgba(139, 92, 246, 0.3)',
                  background: 'rgba(24, 32, 75, 0.7)',
                  color: '#ffffff',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                style={{
                  position: 'absolute',
                  right: '12px',
                  background: 'transparent',
                  border: 'none',
                  color: '#c4b5fd',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="button button-primary"
            style={{
              marginTop: '0.75rem',
              width: '100%',
              justifyContent: 'center',
              padding: '14px',
              fontSize: '14px',
              borderRadius: '12px',
            }}
          >
            {loading ? 'Diving in...' : isLogin ? 'Sign In ▶' : 'Create Free Account ▶'}
          </button>

          {isLogin && (
            <button
              type="button"
              onClick={() => {
                setEmail('facttech.prime@gmail.com');
                setPassword('Spk_2bQvm0RntGfCt9TRaD0nN8mM!9x');
                toast.info('Test learner credentials populated. Click Sign In to enter.');
              }}
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '10px',
                border: '1px dashed rgba(56, 189, 248, 0.4)',
                background: 'rgba(56, 189, 248, 0.08)',
                color: '#38bdf8',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span>🔑</span>
              <span>Use Verified Demo Learner Credentials</span>
            </button>
          )}
        </form>

        <p style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '13px', color: '#c4b5fd' }}>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-link"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#38bdf8' }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </p>
      </section>
    </main>
  );
}
