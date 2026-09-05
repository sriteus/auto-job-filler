'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function TestFormsPage() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          Job Agent
        </Link>
        <Link href="/profile">Edit profile</Link>
      </header>
      <section className="page-heading">
        <p className="eyebrow">EXTENSION TEST BENCH</p>
        <h1>One small form, many applications.</h1>
        <p>Open the extension on this page to scan and fill the fields below.</p>
      </section>
      <form
        className="panel test-form"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
        }}
      >
        <h2>Application details</h2>
        <label>
          First name
          <input name="first_name" />
        </label>
        <label>
          Last name
          <input name="last_name" />
        </label>
        <label>
          Email
          <input name="email" type="email" />
        </label>
        <label>
          Security clearance
          <input name="clearance_level" />
        </label>
        <label>
          Why are you interested?
          <textarea name="interest" />
        </label>
        <button className="primary" type="submit">
          {submitted ? 'Submitted for testing' : 'Preview submission'}
        </button>
      </form>
    </main>
  );
}
