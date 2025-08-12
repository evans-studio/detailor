-- Phase 1: Identity & Tenancy Core
-- Non-negotiables: true multi-tenancy, strict RLS (deny-by-default), single-tenant binding per user

-- Extensions (if not already enabled)
create extension if not exists pgcrypto; -- for gen_random_uuid()

-- Enum for roles
do $$ begin
  create type user_role as enum ('customer', 'staff', 'admin');
exception when duplicate_object then null; end $$;

-- Tenants table
create table if not exists public.tenants (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  trading_name text,
  contact_email text,
  plan text default 'Starter',
  brand_theme jsonb default '{}'::jsonb,
  business_prefs jsonb default '{}'::jsonb,
  status text not null default 'active' check (status in ('active','suspended','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tenants_status_idx on public.tenants(status);

-- Profiles table bound to auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  tenant_id uuid not null references public.tenants(id) on delete restrict,
  role user_role not null,
  full_name text,
  email text,
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id),
  constraint one_tenant_per_user check (tenant_id is not null)
);

create index if not exists profiles_tenant_idx on public.profiles(tenant_id);
create index if not exists profiles_role_idx on public.profiles(role);

-- Tenant invites (admin invites staff/customers)
create table if not exists public.tenant_invites (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  email text not null,
  role user_role not null,
  invited_by uuid not null references auth.users(id) on delete set null,
  token uuid not null default gen_random_uuid(),
  status text not null default 'pending' check (status in ('pending','accepted','revoked','expired')),
  created_at timestamptz not null default now(),
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz
);

create unique index if not exists tenant_invites_token_uniq on public.tenant_invites(token);
create index if not exists tenant_invites_tenant_idx on public.tenant_invites(tenant_id);

-- Timestamps trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

drop trigger if exists tenants_set_updated_at on public.tenants;
create trigger tenants_set_updated_at
before update on public.tenants
for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- RLS: Deny-by-default
alter table public.tenants enable row level security;
alter table public.profiles enable row level security;
alter table public.tenant_invites enable row level security;

-- Helper predicate: current user's tenant and role
-- Using inline EXISTS to avoid creating security definer functions at this stage.

-- Tenants policies
drop policy if exists tenants_select_same_tenant_staff_admin on public.tenants;
create policy tenants_select_same_tenant_staff_admin on public.tenants
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = tenants.id
      and p.role in ('staff','admin')
  )
);

-- No public insert/update/delete on tenants (service role only)
drop policy if exists tenants_block_mods on public.tenants;
create policy tenants_block_mods on public.tenants
for all to authenticated using (false) with check (false);

-- Profiles policies
drop policy if exists profiles_select_self on public.profiles;
create policy profiles_select_self on public.profiles
for select using (id = auth.uid());

drop policy if exists profiles_select_tenant_staff_admin on public.profiles;
create policy profiles_select_tenant_staff_admin on public.profiles
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = profiles.tenant_id
      and p.role in ('staff','admin')
  )
);

drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
for update using (id = auth.uid()) with check (id = auth.uid());

-- Prevent public inserts/deletes; managed by backend (service role)
drop policy if exists profiles_block_insert_delete on public.profiles;
create policy profiles_block_insert_delete on public.profiles
for insert to authenticated with check (false);
-- delete blocked by omission (no delete policy)

-- Tenant invites policies
drop policy if exists invites_select_same_tenant_staff_admin on public.tenant_invites;
create policy invites_select_same_tenant_staff_admin on public.tenant_invites
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = tenant_invites.tenant_id
      and p.role in ('staff','admin')
  )
);

drop policy if exists invites_insert_admin_only on public.tenant_invites;
create policy invites_insert_admin_only on public.tenant_invites
for insert with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = tenant_invites.tenant_id
      and p.role = 'admin'
  )
);

drop policy if exists invites_update_admin_only on public.tenant_invites;
create policy invites_update_admin_only on public.tenant_invites
for update using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = tenant_invites.tenant_id
      and p.role = 'admin'
  )
);

-- Optional: revoke default grants; Supabase sets reasonable defaults, but we harden
revoke all on table public.tenants from anon, authenticated;
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.tenant_invites from anon, authenticated;
grant select on table public.tenants to authenticated; -- gated by RLS
grant select, update on table public.profiles to authenticated; -- gated by RLS
grant select, insert, update on table public.tenant_invites to authenticated; -- gated by RLS


