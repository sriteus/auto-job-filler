'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, error, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  useEffect(() => {
    if (!isLoading && user) router.replace('/profile');
  }, [isLoading, user, router]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signUp(email, password);
      router.push('/profile');
    } catch {
      // AuthContext exposes the provider error below.
    } finally {
      setSubmitting(false);
    }
  };
  return (
    <main className="shell">
      <section className="panel test-form">
        <p className="eyebrow">YOUR WORKSPACE</p>
        <h1>Create account</h1>
        <form onSubmit={submit}>
          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              required
              minLength={6}
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="primary" type="submit" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Start onboarding'}
          </button>
        </form>
        {error && (
          <p className="auth-error">
            {error.toLowerCase().includes('rate limit')
              ? 'Supabase has temporarily limited signup emails. Wait about an hour, or use an existing account to sign in. For frequent testing, configure custom SMTP in Supabase Auth settings.'
              : error}
          </p>
        )}
        <p className="muted">
          Already have an account? <Link href="/login">Sign in</Link>
        </p>
      </section>
    </main>
  );
}
