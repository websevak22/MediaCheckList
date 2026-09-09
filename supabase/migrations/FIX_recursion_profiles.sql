-- ============================================================
-- FIX: Infinite recursion in profiles RLS policy
-- PASTE THIS ENTIRE BLOCK into Supabase SQL Editor and RUN it.
-- This will fix login role loading for the app.
-- ============================================================

-- 1) Create a SECURITY DEFINER helper so admin checks never recurse
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

grant execute on function public.is_admin() to anon, authenticated, service_role;

-- 2) Fix the PROFILES policies (non-recursive)
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

-- 3) Fix the CHECKLISTS policies
drop policy if exists "checklists_insert_own" on checklists;
create policy "checklists_insert_own"
  on checklists for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "checklists_select_own_or_admin" on checklists;
create policy "checklists_select_own_or_admin"
  on checklists for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "checklists_update_own_or_admin" on checklists;
create policy "checklists_update_own_or_admin"
  on checklists for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "checklists_delete_own_or_admin" on checklists;
create policy "checklists_delete_own_or_admin"
  on checklists for delete
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "Allow all operations on checklists" on checklists;

-- 4) Add user_id column if it does not exist yet
alter table checklists
  add column if not exists user_id uuid references auth.users(id);
create index if not exists idx_checklists_user_id on checklists(user_id);

-- 5) Fix the APPROVERS policies
alter table approvers enable row level security;
drop policy if exists "Allow all operations on approvers" on approvers;
drop policy if exists "approvers_read_all_on_checklist_access" on approvers;
create policy "approvers_read_all_on_checklist_access"
  on approvers for select
  using (
    exists (
      select 1 from checklists c
      where c.id = approvers.checklist_id
        and (auth.uid() = c.user_id or public.is_admin())
    )
  );
drop policy if exists "approvers_insert_access" on approvers;
create policy "approvers_insert_access"
  on approvers for insert
  with check (
    exists (
      select 1 from checklists c
      where c.id = checklist_id
        and (auth.uid() = c.user_id or public.is_admin())
    )
  );

-- 6) Make sevak@ufs.com an ADMIN in profiles (idempotent)
insert into profiles (id, email, role, full_name)
select u.id, u.email, 'admin', 'Sevak Admin'
from auth.users u
where u.email = 'sevak@ufs.com'
  and not exists (select 1 from profiles p where p.id = u.id);

-- 7) Confirm the admin profile row exists
select p.email, p.role, p.full_name
from profiles p
where p.email = 'sevak@ufs.com';
