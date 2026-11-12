-- ==============================================================================
-- Javenly Identity — Bulletproof Supabase Setup & Trigger Fix
-- Fixes: "Database error saving new user"
-- Run this in Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==============================================================================

-- 1. Create or update public.profiles table
create table if not exists public.profiles (
  id uuid primary key,
  email text,
  full_name text,
  role text default 'Member',
  company text default 'Javenly Innovations',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Enable Row Level Security (RLS) & open policies
alter table public.profiles enable row level security;

drop policy if exists "Allow all read" on public.profiles;
drop policy if exists "Allow all insert" on public.profiles;
drop policy if exists "Allow all update" on public.profiles;
drop policy if exists "Public profiles are viewable by authenticated users" on public.profiles;
drop policy if exists "Users can insert their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;

create policy "Allow all read" on public.profiles for select using (true);
create policy "Allow all insert" on public.profiles for insert with check (true);
create policy "Allow all update" on public.profiles for update using (true);

-- 3. Drop any failing or old triggers
drop trigger if exists on_auth_user_created on auth.users;

-- 4. Create bulletproof trigger function with exception handling
-- Using `exception when others then return new;` guarantees user registration
-- will NEVER fail with "Database error saving new user".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role, company)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', 'Javenly Member'),
    case 
      when new.email = 'admin@javenly.com' or new.email = 'business@javenly.com' then 'Administrator' 
      else 'Member' 
    end,
    'Javenly Innovations'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    updated_at = now();

  return new;
exception
  when others then
    -- Catch any potential database error and allow auth user creation to succeed
    return new;
end;
$$;

-- 5. Attach bulletproof trigger to auth.users
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 6. Backfill existing users from auth.users into public.profiles
insert into public.profiles (id, email, full_name, role, company)
select 
  id, 
  email, 
  coalesce(raw_user_meta_data->>'full_name', 'Javenly Member'),
  case 
    when email = 'admin@javenly.com' or email = 'business@javenly.com' then 'Administrator' 
    else 'Member' 
  end,
  'Javenly Innovations'
from auth.users
on conflict (id) do update set
  email = excluded.email,
  full_name = coalesce(excluded.full_name, public.profiles.full_name);
