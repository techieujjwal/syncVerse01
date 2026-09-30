-- SyncVerse: create missing profiles table.
--
-- Why: AuthContext reads `public.profiles` (id, display_name, avatar_url) for every
-- signed-in user and signUp() upserts into it, but the table did not exist in the
-- remote project, so profile data silently failed (display name fell back to the
-- email prefix everywhere).
--
-- Safe to re-run (IF NOT EXISTS / IF NOT FOUND guards).
-- Apply via: npx supabase db push   (after `supabase link`)
--         or paste into Supabase Dashboard → SQL Editor.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Everyone can read basic profile info (needed for peer/leaderboard features).
drop policy if exists "profiles_select_public" on public.profiles;
create policy "profiles_select_public"
  on public.profiles for select
  using (true);

-- Users can insert/update only their own profile row.
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Keep updated_at fresh.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row whenever a user signs up (auth.users → public.profiles).
-- security definer so the insert succeeds regardless of the signing-up user's RLS context.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'display_name', ''),
      nullif(new.raw_user_meta_data ->> 'full_name', ''),
      split_part(new.email, '@', 1)
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Recreate only if missing / definition changed.
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill: create profile rows for any users who signed up before this migration.
insert into public.profiles (id, display_name)
select u.id,
       coalesce(
         nullif(u.raw_user_meta_data ->> 'display_name', ''),
         split_part(u.email, '@', 1)
       )
from auth.users u
on conflict (id) do nothing;
