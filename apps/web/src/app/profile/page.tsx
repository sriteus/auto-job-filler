'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { CandidateProfile, CustomFieldEntry } from '@ai-job-agent/shared';
import { useProfileStore } from '../../stores/profileStore';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase/client';

type FormState = Record<string, string>;
const fields = [
  ['firstName', 'First name', true],
  ['lastName', 'Last name', true],
  ['email', 'Email', true],
  ['phone', 'Phone', false],
  ['city', 'City', false],
  ['country', 'Country', false],
  ['linkedin', 'LinkedIn URL', false],
  ['portfolio', 'Portfolio URL', false],
  ['currentTitle', 'Current job title', false],
  ['currentCompany', 'Current company', false],
  ['university', 'University or school', false],
  ['degree', 'Degree', false],
  ['skills', 'Skills (comma-separated)', false],
  ['noticePeriod', 'Notice period', false],
  ['salary', 'Desired compensation', false],
] as const;

function valueOf(profile: CandidateProfile, key: string): string {
  const personal = profile.personal;
  const experience = profile.experience.entries[0];
  const education = profile.education.entries[0];
  const values: Record<string, string> = {
    firstName: personal.firstName.value,
    lastName: personal.lastName.value,
    email: personal.email.value,
    phone: personal.phone.value,
    city: personal.city.value,
    country: personal.country.value,
    linkedin: personal.linkedin.value,
    portfolio: personal.portfolio.value,
    currentTitle: experience?.title.value || '',
    currentCompany: experience?.company.value || '',
    university: education?.university.value || '',
    degree: education?.degree.value || '',
    skills: profile.skills.programmingLanguages.value.join(', '),
    noticePeriod: profile.preferences.noticePeriod.value,
    salary: profile.preferences.salaryExpectations.value,
  };
  return values[key] || '';
}

function emptyProfile(userId: string, email = ''): CandidateProfile {
  const fact = <T,>(value: T) => ({ value, source: 'user_input' as const, verified: false });
  return {
    id: `profile-${userId}`,
    userId,
    personal: {
      firstName: fact(''), lastName: fact(''), fullName: fact(''), email: fact(email),
      phone: fact(''), address: fact(''), city: fact(''), state: fact(''), country: fact(''),
      postalCode: fact(''), linkedin: fact(''), github: fact(''), portfolio: fact(''),
    },
    education: { entries: [{ id: 'education-1', university: fact(''), degree: fact(''), field: fact(''), startDate: fact(''), endDate: fact('') }] },
    experience: { entries: [{ id: 'experience-1', company: fact(''), title: fact(''), startDate: fact(''), endDate: fact(''), description: fact(''), responsibilities: fact<string[]>([]), achievements: fact<string[]>([]), technologies: fact<string[]>([]) }] },
    skills: { programmingLanguages: fact<string[]>([]), frameworks: fact<string[]>([]), databases: fact<string[]>([]), cloud: fact<string[]>([]), tools: fact<string[]>([]), other: fact<string[]>([]) },
    projects: { entries: [] },
    preferences: { desiredRoles: fact<string[]>([]), desiredLocations: fact<string[]>([]), remotePreference: fact('any'), relocationPreference: fact(false), salaryExpectations: fact(''), noticePeriod: fact('') },
    applicationAnswers: { entries: [] },
    customFields: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const { profile, setProfile } = useProfileStore();
  const { user, isLoading: authLoading, signOut } = useAuth();
  const [form, setForm] = useState<FormState>({});
  const [customFields, setCustomFields] = useState<CustomFieldEntry[]>([]);
  const [newCustom, setNewCustom] = useState({ label: '', value: '' });
  const [saved, setSaved] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const initial = profile || emptyProfile(user?.id || 'new-user', user?.email || '');
    setForm(Object.fromEntries(fields.map(([key]) => [key, valueOf(initial, key)])));
    setCustomFields(initial.customFields || []);
  }, [profile, user]);

  useEffect(() => {
    if (!authLoading && supabase && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (authLoading || !user || !supabase) return;
    supabase
      .from('profiles')
      .select('profile')
      .eq('id', user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) setMessage(error.message);
        if (data?.profile) {
          setProfile(data.profile as CandidateProfile);
        } else if (!error) {
          const blank = emptyProfile(user.id, user.email || '');
          setProfile(blank);
          localStorage.removeItem('ai_job_agent_cached_profile');
        }
      });
  }, [authLoading, user, setProfile]);

  const update = (key: string, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (supabase && !user) {
      setMessage('Sign in before saving your profile.');
      router.replace('/login');
      return;
    }
    const previous = profile || emptyProfile(user?.id || 'new-user', user?.email || '');
    const fact = <T,>(value: T) => ({
      value,
      source: 'user_input' as const,
      verified: Array.isArray(value) ? value.length > 0 : Boolean(value),
    });
    const skills = (form.skills || '')
      .split(',')
      .map((skill) => skill.trim())
      .filter(Boolean);
    const now = new Date().toISOString();
    const updated: CandidateProfile = {
      ...previous,
      userId: user?.id || previous.userId,
      personal: {
        ...previous.personal,
        firstName: fact(form.firstName || ''),
        lastName: fact(form.lastName || ''),
        fullName: fact(`${form.firstName || ''} ${form.lastName || ''}`.trim()),
        email: fact(form.email || ''),
        phone: fact(form.phone || ''),
        city: fact(form.city || ''),
        country: fact(form.country || ''),
        linkedin: fact(form.linkedin || ''),
        portfolio: fact(form.portfolio || ''),
      },
      experience: {
        entries: [
          {
            ...previous.experience.entries[0],
            company: fact(form.currentCompany || ''),
            title: fact(form.currentTitle || ''),
          },
        ],
      },
      education: {
        entries: [
          {
            ...previous.education.entries[0],
            university: fact(form.university || ''),
            degree: fact(form.degree || ''),
          },
        ],
      },
      skills: { ...previous.skills, programmingLanguages: fact(skills) },
      preferences: {
        ...previous.preferences,
        noticePeriod: fact(form.noticePeriod || ''),
        salaryExpectations: fact(form.salary || ''),
      },
      customFields,
      updatedAt: now,
    };
    if (supabase && user) {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        profile: updated,
        updated_at: now,
      });
      if (error) {
        setMessage(error.message);
        return;
      }
      setProfile(updated);
      localStorage.setItem('ai_job_agent_cached_profile', JSON.stringify(updated));
      setMessage('Saved to your Supabase account and this device.');
    } else {
      setProfile(updated);
      localStorage.setItem('ai_job_agent_cached_profile', JSON.stringify(updated));
      setMessage('Saved locally. Add Supabase environment variables for cloud sync.');
    }
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  };

  const addCustomField = () => {
    const label = newCustom.label.trim();
    const value = newCustom.value.trim();
    if (!label || !value) return;
    setCustomFields((current) => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        label,
        key: label
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '_')
          .replace(/^_|_$/g, ''),
        value,
        verified: true,
        category: 'other',
      },
    ]);
    setNewCustom({ label: '', value: '' });
  };

  return (
    <main className="shell">
      <header className="topbar">
        <Link href="/" className="brand">
          Job Agent
        </Link>
        <div className="topbar-actions">
          <Link href="/test-forms">Test forms</Link>
          <button
            type="button"
            className="quiet"
            onClick={async () => {
              await signOut();
              router.replace('/login');
            }}
          >
            Sign out
          </button>
        </div>
      </header>
      <section className="page-heading">
        <p className="eyebrow">ONBOARDING / PROFILE</p>
        <h1>Tell us what to remember.</h1>
        <p>
          Required basics help the extension fill forms. Everything else is optional and can be
          added later.
        </p>
      </section>
      <form onSubmit={save} className="profile-form">
        <section className="panel">
          <h2>Start here</h2>
          <p className="muted">These three fields are the only required information.</p>
          <div className="form-grid">
            {fields.slice(0, 3).map(([key, label, required]) => (
              <label key={key}>
                {label}
                {required && <span className="required"> required</span>}
                <input
                  required={required}
                  type={key === 'email' ? 'email' : 'text'}
                  value={form[key] || ''}
                  onChange={(event) => update(key, event.target.value)}
                />
              </label>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>
            Details <span className="optional">optional</span>
          </h2>
          <div className="form-grid">
            {fields.slice(3).map(([key, label]) => (
              <label key={key}>
                {label}
                <input
                  value={form[key] || ''}
                  onChange={(event) => update(key, event.target.value)}
                />
              </label>
            ))}
          </div>
        </section>
        <section className="panel">
          <h2>
            Custom answers <span className="optional">add later anytime</span>
          </h2>
          <p className="muted">
            Save work authorization, clearance, pronouns, or reusable screening answers.
          </p>
          {customFields.map((field) => (
            <div className="custom-row" key={field.id}>
              <span>
                <strong>{field.label}</strong>
                <small>{field.value}</small>
              </span>
              <button
                type="button"
                className="quiet"
                onClick={() =>
                  setCustomFields((current) => current.filter((item) => item.id !== field.id))
                }
              >
                Remove
              </button>
            </div>
          ))}
          <div className="custom-add">
            <input
              placeholder="Field name"
              value={newCustom.label}
              onChange={(event) => setNewCustom({ ...newCustom, label: event.target.value })}
            />
            <input
              placeholder="Answer"
              value={newCustom.value}
              onChange={(event) => setNewCustom({ ...newCustom, value: event.target.value })}
            />
            <button type="button" onClick={addCustomField}>
              Add field
            </button>
          </div>
        </section>
        <div className="form-actions">
          <button className="primary" type="submit">
            {saved ? 'Saved' : 'Save profile'}
          </button>
          <span className="muted">Saved to your account and cached for the extension.</span>
        </div>
        {message && <p className="muted">{message}</p>}
      </form>
    </main>
  );
}
