-- =============================================
-- BEING SEVAK CHARITABLE TRUST
-- Add profiles (roles) & link checklists to users
-- FIXED: uses SECURITY DEFINER is_admin() to avoid
-- infinite recursion in RLS policies.
-- =============================================

-- =============================================
-- HELPER FUNCTION: is_admin()
-- SECURITY DEFINER bypasses RLS so it does NOT
-- recurse into the profiles policy.
-- =============================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles p
    where p.id = auth.uid() and p.role = 'admin'
  );
$$;

-- Allow the anon/authenticated role to call it
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- =============================================
-- TABLE: profiles
-- Links Supabase auth.users to app-level roles
-- =============================================
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text not null default '',
  role text not null default 'normal'
    check (role in ('admin', 'normal')),
  created_at timestamptz not null default now()
);

-- =============================================
-- ALTER checklists: add owner (user_id)
-- =============================================
alter table checklists
  add column if not exists user_id uuid references auth.users(id);

create index if not exists idx_checklists_user_id on checklists(user_id);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table profiles enable row level security;
alter table checklists enable row level security;

-- -------- PROFILES POLICY (non-recursive via is_admin) --------
drop policy if exists "profiles_select_own_or_admin" on profiles;
create policy "profiles_select_own_or_admin"
  on profiles for select
  using (auth.uid() = id or public.is_admin());

drop policy if exists "profiles_insert_own" on profiles;
create policy "profiles_insert_own"
  on profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles_update_own" on profiles;
create policy "profiles_update_own"
  on profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- -------- CHECKLISTS POLICY --------
-- Insert: authenticated user can create own; admin can create for anyone
drop policy if exists "checklists_insert_own" on checklists;
create policy "checklists_insert_own"
  on checklists for insert
  with check (auth.uid() = user_id or public.is_admin());

-- Select: normal users see own; admin sees all
drop policy if exists "checklists_select_own_or_admin" on checklists;
create policy "checklists_select_own_or_admin"
  on checklists for select
  using (auth.uid() = user_id or public.is_admin());

-- Update: normal users update own; admin can update all (approval)
drop policy if exists "checklists_update_own_or_admin" on checklists;
create policy "checklists_update_own_or_admin"
  on checklists for update
  using (auth.uid() = user_id or public.is_admin());

-- Delete: normal users delete own; admin can delete all
drop policy if exists "checklists_delete_own_or_admin" on checklists;
create policy "checklists_delete_own_or_admin"
  on checklists for delete
  using (auth.uid() = user_id or public.is_admin());

-- Remove any older blanket policy that may exist
drop policy if exists "Allow all operations on checklists" on checklists;
drop policy if exists "Allow all operations on approvers" on approvers;

-- -------- APPROVERS POLICY --------
alter table approvers enable row level security;

create policy "approvers_read_all_on_checklist_access"
  on approvers for select
  using (
    exists (
      select 1 from checklists c
      where c.id = approvers.checklist_id
        and (auth.uid() = c.user_id or public.is_admin())
    )
  );

create policy "approvers_insert_access"
  on approvers for insert
  with check (
    exists (
      select 1 from checklists c
      where c.id = checklist_id
        and (auth.uid() = c.user_id or public.is_admin())
    )
  );
