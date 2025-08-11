-- Phase 5 (Redux): Quoting Engine — idempotent, policy-safe script
-- This replaces/repairs any prior Phase 5 attempts.

-- Safety: required extension
create extension if not exists pgcrypto;

-- Enum
do $$ begin
  create type quote_status as enum ('draft','issued','accepted','expired','revoked');
exception when duplicate_object then null; end $$;

-- Table
create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  addon_ids uuid[] not null default '{}',
  vehicle_size_tier text not null,
  scheduled_at timestamptz,
  distance_miles numeric(10,2) default 0,
  discount_code text,
  price_breakdown jsonb not null,
  status quote_status not null default 'draft',
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists quotes_tenant_idx on public.quotes(tenant_id);
create index if not exists quotes_customer_idx on public.quotes(customer_id);
create index if not exists quotes_status_idx on public.quotes(status);

-- Updated_at trigger
drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
before update on public.quotes
for each row execute function public.set_updated_at();

-- RLS on
alter table public.quotes enable row level security;

-- Reset grants
revoke all on public.quotes from anon, authenticated;
grant select, insert, update on public.quotes to authenticated;

-- Drop existing policies (if any)
do $$ begin execute 'drop policy if exists quotes_select_self on public.quotes'; exception when undefined_object then null; end $$;
do $$ begin execute 'drop policy if exists quotes_select_staff_admin on public.quotes'; exception when undefined_object then null; end $$;
do $$ begin execute 'drop policy if exists quotes_insert_self_or_staff on public.quotes'; exception when undefined_object then null; end $$;
do $$ begin execute 'drop policy if exists quotes_update_staff_admin on public.quotes'; exception when undefined_object then null; end $$;
do $$ begin execute 'drop policy if exists quotes_accept_self on public.quotes'; exception when undefined_object then null; end $$;

-- Policies
-- 1) Customers can read their own quotes
create policy quotes_select_self on public.quotes
for select using (
  exists (
    select 1 from public.customers c
    where c.id = quotes.customer_id
      and c.auth_user_id = auth.uid()
  )
);

-- 2) Staff/Admin can read tenant quotes
create policy quotes_select_staff_admin on public.quotes
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = quotes.tenant_id
      and p.role in ('staff','admin')
  )
);

-- 3) Insert allowed for: (customer creating their own) OR (staff/admin of tenant)
create policy quotes_insert_self_or_staff on public.quotes
for insert with check (
  (
    exists (
      select 1 from public.customers c
      where c.id = quotes.customer_id
        and c.auth_user_id = auth.uid()
    )
  )
  or (
    exists (
      select 1 from public.profiles p
      join public.customers c on c.tenant_id = p.tenant_id and c.id = quotes.customer_id
      where p.id = auth.uid()
        and p.role in ('staff','admin')
    )
  )
);

-- 4) Staff/Admin can update any tenant quotes (state machine enforcement handled in app logic)
create policy quotes_update_staff_admin on public.quotes
for update using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = quotes.tenant_id
      and p.role in ('staff','admin')
  )
) with check (true);

-- 5) Customers can accept their own issued quote
create policy quotes_accept_self on public.quotes
for update using (
  exists (
    select 1 from public.customers c
    where c.id = quotes.customer_id
      and c.auth_user_id = auth.uid()
  )
  and status = 'issued'
) with check (
  exists (
    select 1 from public.customers c
    where c.id = quotes.customer_id
      and c.auth_user_id = auth.uid()
  )
  and status = 'accepted'
);


