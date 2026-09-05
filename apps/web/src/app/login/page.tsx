'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { signIn, error, user, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  useEffect(() => {
    if (!isLoading && user) router.replace('/profile');
  }, [isLoading, user, router]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await signIn(email, password);
    router.push('/profile');
  };
  return (
    <main className="shell">
      <section className="panel test-form">
        <p className="eyebrow">WELCOME BACK</p>
        <h1>Sign in</h1>
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
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="primary" type="submit">
            Continue
          </button>
        </form>
        {error && <p className="auth-error">{error}</p>}
        <p className="muted">
          New here? <Link href="/register">Create an account</Link>
        </p>
      </section>
    </main>
  );
}
