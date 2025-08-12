-- Phase 4: Availability Engine — Work patterns, blackouts, slot API support

-- Weekly work patterns per tenant
create table if not exists public.work_patterns (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0 = Sunday
  start_time time not null,
  end_time time not null,
  slot_duration_min integer not null check (slot_duration_min > 0),
  capacity integer not null check (capacity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, weekday)
);

create index if not exists work_patterns_tenant_idx on public.work_patterns(tenant_id);

-- Blackout windows per tenant (closed periods)
create table if not exists public.blackouts (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);

create index if not exists blackouts_tenant_idx on public.blackouts(tenant_id);
create index if not exists blackouts_range_idx on public.blackouts(starts_at, ends_at);

-- Triggers for updated_at
drop trigger if exists work_patterns_set_updated_at on public.work_patterns;
create trigger work_patterns_set_updated_at before update on public.work_patterns for each row execute function public.set_updated_at();

-- RLS
alter table public.work_patterns enable row level security;
alter table public.blackouts enable row level security;

-- Policies: staff/admin can read, admin can modify
drop policy if exists work_patterns_select_staff_admin on public.work_patterns;
create policy work_patterns_select_staff_admin on public.work_patterns
for select using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = work_patterns.tenant_id and p.role in ('staff','admin')
  )
);

drop policy if exists work_patterns_modify_admin_only on public.work_patterns;
create policy work_patterns_modify_admin_only on public.work_patterns
for all to authenticated using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = work_patterns.tenant_id and p.role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = work_patterns.tenant_id and p.role = 'admin'
  )
);

drop policy if exists blackouts_select_staff_admin on public.blackouts;
create policy blackouts_select_staff_admin on public.blackouts
for select using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = blackouts.tenant_id and p.role in ('staff','admin')
  )
);

drop policy if exists blackouts_modify_admin_only on public.blackouts;
create policy blackouts_modify_admin_only on public.blackouts
for all to authenticated using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = blackouts.tenant_id and p.role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = blackouts.tenant_id and p.role = 'admin'
  )
);

-- Grants gated by RLS
revoke all on public.work_patterns from anon, authenticated;
revoke all on public.blackouts from anon, authenticated;
grant select on public.work_patterns to authenticated;
grant select on public.blackouts to authenticated;
grant insert, update, delete on public.work_patterns to authenticated;
grant insert, update, delete on public.blackouts to authenticated;


