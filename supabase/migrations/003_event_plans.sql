-- =============================================
-- BEING SEVAK CHARITABLE TRUST
-- NGO Program Event Planning Form Schema
-- Stores each event / program planning form.
-- =============================================

-- =============================================
-- TABLE: event_plans
-- Stores each event planning submission
-- =============================================
create table if not exists event_plans (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- Owner
  user_id uuid references auth.users(id),

  -- 1. Program Details
  ngo_name text not null default '',
  program_title text not null default '',
  program_date date,
  program_time text not null default '',
  program_description text not null default '',
  location text not null default '',

  -- 2. Volunteer Requirement
  volunteers_required text not null default '',
  volunteer_role text not null default '',

  -- 3. Beneficiary Details
  beneficiary_categories text[] not null default '{}',
  beneficiaries_required text not null default '',

  -- 4. Distribution / Service Details (array of {item, quantity, remarks})
  distribution_items jsonb not null default '[]'::jsonb,

  -- 5. Additional Requirements
  special_requirements text not null default ''
);

create index if not exists idx_event_plans_user_id on event_plans(user_id);
create index if not exists idx_event_plans_created_at on event_plans(created_at desc);

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================
alter table event_plans enable row level security;

drop policy if exists "event_plans_insert_own" on event_plans;
create policy "event_plans_insert_own"
  on event_plans for insert
  with check (auth.uid() = user_id or public.is_admin());

drop policy if exists "event_plans_select_own_or_admin" on event_plans;
create policy "event_plans_select_own_or_admin"
  on event_plans for select
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "event_plans_update_own_or_admin" on event_plans;
create policy "event_plans_update_own_or_admin"
  on event_plans for update
  using (auth.uid() = user_id or public.is_admin());

drop policy if exists "event_plans_delete_own_or_admin" on event_plans;
create policy "event_plans_delete_own_or_admin"
  on event_plans for delete
  using (auth.uid() = user_id or public.is_admin());