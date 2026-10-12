'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { createSupabaseBrowserClient } from '@/src/client/auth/supabase';

const MAX_EMAIL_LENGTH = 320;
const MAX_PASSWORD_LENGTH = 1_024;

const supabase = createSupabaseBrowserClient();

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
        toast.success("Successfully logged in");
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
    <main className="shell">
      <nav className="nav shell" aria-label="Primary navigation">
        <Link className="wordmark" href="/" aria-label="SpeakQL home"><span>Speak</span>QL</Link>
      </nav>
      <section className="statement shell" style={{ maxWidth: '400px', margin: '10vh auto', textAlign: 'left' }}>
        <p className="section-kicker">{isLogin ? 'Welcome back' : 'Start your journey'}</p>
        <h2>{isLogin ? 'Sign in' : 'Create an account'}</h2>
        
        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '2rem' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Email</label>
            <input 
              type="email" 
               id="email"
               value={email}
               onChange={(e) => setEmail(e.target.value)}
              maxLength={MAX_EMAIL_LENGTH}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent' }}
            />
          </div>
          <div>
            <label htmlFor="password" style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500 }}>Password</label>
            <input 
              type="password" 
               id="password"
               value={password}
               onChange={(e) => setPassword(e.target.value)}
              maxLength={MAX_PASSWORD_LENGTH}
              required
              style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'transparent' }}
            />
          </div>
          
          <button type="submit" disabled={loading} className="button button-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>
            {loading ? 'Processing...' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button 
            type="button" 
            onClick={() => setIsLogin(!isLogin)}
            className="text-link"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </p>
      </section>
    </main>
  );
}
