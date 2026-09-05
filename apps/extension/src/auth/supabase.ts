import { createClient } from '@supabase/supabase-js';
import type { CandidateProfile } from '@ai-job-agent/shared';

const env = (import.meta as ImportMeta & { env?: Record<string, string> }).env || {};
const url = env.VITE_SUPABASE_URL;
const anonKey = env.VITE_SUPABASE_ANON_KEY;

export const supabaseConfigured = Boolean(url && anonKey);
export const supabase = supabaseConfigured
  ? createClient(url, anonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    })
  : null;

export async function signInAndLoadProfile(email: string, password: string) {
  if (!supabase)
    throw new Error(
      'Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect the extension.'
    );
  const { data: auth, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (authError) throw authError;
  const { data, error } = await supabase
    .from('profiles')
    .select('profile')
    .eq('id', auth.user.id)
    .maybeSingle();
  if (error) throw error;
  return { userId: auth.user.id, profile: data?.profile as CandidateProfile | undefined };
}

export async function loadSessionProfile() {
  if (!supabase) return null;
  const { data: session } = await supabase.auth.getSession();
  if (!session.session) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('profile')
    .eq('id', session.session.user.id)
    .maybeSingle();
  if (error) throw error;
  return {
    userId: session.session.user.id,
    profile: data?.profile as CandidateProfile | undefined,
  };
}
