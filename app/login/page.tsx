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
      <nav className="nav shell" aria-label="Primary navigation">
        <Link className="wordmark" href="/" aria-label="SpeakQL home">
          <SpeakQLLogo size={36} showText={true} />
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
            <p className="eyebrow" style={{ margin: '0 0 4px', color: '#38bdf8' }}>
              {isLogin ? 'WELCOME BACK' : 'BEGIN YOUR ODYSSEY'}
            </p>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: '#ffffff' }}>
              {isLogin ? 'Sign in to SpeakQL' : 'Create your account'}
            </h2>
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
                  fontSize: '16px',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
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
