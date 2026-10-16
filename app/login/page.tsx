'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/src/client/auth/supabase';
import { WhaleMascot, SpeakQLLogo } from '@/src/client/components/whale-mascot';

const MAX_EMAIL_LENGTH = 320;
const MAX_PASSWORD_LENGTH = 1_024;

const DEMO_EMAIL = 'facttech.prime@gmail.com';
const DEMO_PASSWORD = 'Spk_2bQvm0RntGfCt9TRaD0nN8mM!9x';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [authStatusText, setAuthStatusText] = useState('');
  const router = useRouter();

  const performLogin = async (targetEmail: string, targetPassword: string, isDemo = false) => {
    setLoading(true);
    setAuthStatusText(isDemo ? 'Authenticating verified learner...' : 'Signing in...');

    const client = createSupabaseBrowserClient();
    const normalizedEmail = targetEmail.trim();

    if (!normalizedEmail || !targetPassword || normalizedEmail.length > MAX_EMAIL_LENGTH || targetPassword.length > MAX_PASSWORD_LENGTH) {
      toast.error('Unable to authenticate. Check your details and try again.');
      setLoading(false);
      setAuthStatusText('');
      return;
    }

    if (!client) {
      toast.error('Authentication service is initializing. Please refresh or try again in a moment.');
      setLoading(false);
      setAuthStatusText('');
      return;
    }

    try {
      const result = isLogin
        ? await client.auth.signInWithPassword({ email: normalizedEmail, password: targetPassword })
        : await client.auth.signUp({ email: normalizedEmail, password: targetPassword });

      if (result.error) {
        toast.error(isLogin
          ? 'Unable to sign in. Check your email and password.'
          : 'Unable to create your account. Check your details and try again.');
      } else if (isLogin) {
        toast.success(isDemo ? 'Verified Demo Learner authenticated! Entering ocean world...' : 'Welcome back! Entering ocean world...');
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
      setAuthStatusText('');
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    await performLogin(email, password, false);
  };

  const handle1ClickDemoLogin = async () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
    await performLogin(DEMO_EMAIL, DEMO_PASSWORD, true);
  };

  return (
    <main style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', position: 'relative' }}>
      {/* Ocean Nav */}
      <nav className="nav shell" aria-label="Primary navigation" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link className="wordmark" href="/" aria-label="SpeakQL home" style={{ textDecoration: 'none' }}>
          <SpeakQLLogo size={36} showText={true} />
        </Link>
        <Link href="/" style={{ color: '#94a3b8', fontSize: '13px', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>← Back to home</span>
        </Link>
      </nav>

      {/* Apple-Grade Glassmorphic Login Container */}
      <section
        className="apple-glass-card"
        style={{
          width: 'min(440px, calc(100% - 32px))',
          margin: '3vh auto 8vh',
          padding: 'clamp(24px, 5vw, 36px) clamp(20px, 4vw, 32px)',
          textAlign: 'left',
          position: 'relative',
        }}
      >
        {/* Welcome Mascot Avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
          <WhaleMascot mood="happy" size={64} animated={true} />
          <div>
            <p
              className="eyebrow"
              style={{
                margin: '0 0 4px',
                color: '#38bdf8',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                fontWeight: 700,
                letterSpacing: '0.12em',
                fontSize: '11px',
              }}
            >
              {isLogin ? 'ENTERPRISE ACCESS' : 'BEGIN YOUR ODYSSEY'}
            </p>
            <h1 style={{ margin: 0, fontSize: 'clamp(20px, 4vw, 24px)', fontWeight: 800, color: '#ffffff', letterSpacing: '-0.02em' }}>
              {isLogin ? 'Sign in to SpeakQL' : 'Create your account'}
            </h1>
          </div>
        </div>

        {/* 1-Click Corporate Demo Sign-In (Top Priority for Evaluators) */}
        {isLogin && (
          <div style={{ marginBottom: '20px' }}>
            <button
              type="button"
              disabled={loading}
              onClick={handle1ClickDemoLogin}
              className="neo-press"
              style={{
                width: '100%',
                padding: '14px 16px',
                borderRadius: '14px',
                border: '1.5px solid rgba(56, 189, 248, 0.45)',
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(168, 85, 247, 0.18) 100%)',
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 800,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: '0 4px 20px rgba(56, 189, 248, 0.22)',
              }}
            >
              <span style={{ fontSize: '16px' }}>⚡</span>
              <span>1-Click Verified Corporate Demo Sign-In</span>
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0 16px' }}>
              <div style={{ height: '1px', flex: 1, background: 'rgba(139, 92, 246, 0.25)' }} />
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                OR SIGN IN WITH EMAIL
              </span>
              <div style={{ height: '1px', flex: 1, background: 'rgba(139, 92, 246, 0.25)' }} />
            </div>
          </div>
        )}

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
              className="neo-well"
              style={{
                width: '100%',
                padding: '0.85rem 1rem',
                fontSize: '16px',
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
                className="neo-well"
                style={{
                  width: '100%',
                  padding: '0.85rem 3rem 0.85rem 1rem',
                  fontSize: '16px',
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
                  padding: '6px',
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
            className="button button-primary neo-press"
            style={{
              marginTop: '0.5rem',
              width: '100%',
              justifyContent: 'center',
              padding: '14px',
              fontSize: '14px',
              borderRadius: '12px',
            }}
          >
            {loading ? (authStatusText || 'Diving in...') : isLogin ? 'Sign In ▶' : 'Create Free Account ▶'}
          </button>
        </form>

        <p style={{ marginTop: '1.75rem', textAlign: 'center', fontSize: '13px', color: '#c4b5fd' }}>
          <button
            type="button"
            onClick={() => setIsLogin(!isLogin)}
            className="text-link"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#38bdf8', padding: '6px' }}
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </p>
      </section>
    </main>
  );
}
