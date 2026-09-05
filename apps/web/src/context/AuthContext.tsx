'use client';

import { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../lib/supabase/client';

type AuthContextValue = {
  user: User | { id: string; email?: string } | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const localKey = 'ai_job_agent_auth_user';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthContextValue['user']>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) {
      const saved = localStorage.getItem(localKey);
      if (saved) setUser(JSON.parse(saved));
      setLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user || null);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user || null);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const authenticate = async (email: string, password: string, mode: 'signIn' | 'signUp') => {
    setError(null);
    if (!supabase) {
      const next = { id: `local-${email}`, email };
      localStorage.setItem(localKey, JSON.stringify(next));
      setUser(next);
      return;
    }
    const result =
      mode === 'signIn'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password });
    if (result.error) {
      setError(result.error.message);
      throw result.error;
    }
    if (mode === 'signUp' && !result.data.session) {
      const confirmationError = new Error(
        'Account created. Check your email to confirm it, then sign in.'
      );
      setError(confirmationError.message);
      throw confirmationError;
    }
    setSession(result.data.session);
    setUser(result.data.user);
  };

  const signOut = async () => {
    if (supabaseConfigured && supabase) await supabase.auth.signOut();
    localStorage.removeItem(localKey);
    setSession(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        error,
        signIn: (email, password) => authenticate(email, password, 'signIn'),
        signUp: (email, password) => authenticate(email, password, 'signUp'),
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
