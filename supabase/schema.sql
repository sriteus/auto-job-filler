create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  profile jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep any existing onboarding columns and add the shared candidate profile payload.
alter table public.profiles
  add column if not exists profile jsonb;

alter table public.profiles enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'ai_job_agent_read_own_profile') then
    create policy "ai_job_agent_read_own_profile" on public.profiles for select using (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'ai_job_agent_insert_own_profile') then
    create policy "ai_job_agent_insert_own_profile" on public.profiles for insert with check (auth.uid() = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'ai_job_agent_update_own_profile') then
    create policy "ai_job_agent_update_own_profile" on public.profiles for update using (auth.uid() = id);
  end if;
end $$;
