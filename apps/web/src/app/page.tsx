'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

const areas = [
  [
    'Candidate profile',
    'Store the personal and professional facts used by the extension.',
    '/profile',
  ],
  ['Test forms', 'Preview how saved answers map into common application fields.', '/test-forms'],
];

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) router.replace('/profile');
  }, [isLoading, user, router]);

  if (isLoading || user) {
    return <main className="shell" aria-busy="true" />;
  }

  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand brand-mark">
          <img src="/app-logo-job-filler.svg" alt="Auto Job Filler logo" />{' '}
          <span>Auto Job Filler</span>
        </Link>
        <Link href="/login">Sign in</Link>
      </header>
      <section className="hero">
        <p className="eyebrow">PRIVATE / CLOUD-SYNCED</p>
        <h1>Apply with less repetition.</h1>
        <p>
          Your profile stays under your control, and the extension uses only the answers you choose
          to save.
        </p>
        <Link className="primary inline-button" href="/register">
          Create your profile
        </Link>
      </section>
      <section className="dashboard-grid">
        {areas.map(([title, description, href]) => (
          <Link className="panel dashboard-card" href={href} key={title}>
            <span className="eyebrow">WORKSPACE</span>
            <h2>{title}</h2>
            <p>{description}</p>
            <span className="arrow">Open workspace -&gt;</span>
          </Link>
        ))}
      </section>
    </main>
  );
}
