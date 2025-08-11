-- Phase 2: Admin Core — Services, Add-ons, Pricing Config
-- Deny-by-default RLS; admin can write; staff/admin can read

-- Services
create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  category text,
  description text,
  base_price numeric(12,2) not null default 0,
  base_duration_min integer not null default 0,
  visible boolean not null default true,
  media_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index if not exists services_tenant_idx on public.services(tenant_id);
create index if not exists services_visible_idx on public.services(visible);

-- Add-ons
create table if not exists public.add_ons (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  description text,
  price_delta numeric(12,2) not null default 0,
  duration_delta_min integer not null default 0,
  compatibility jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, name)
);

create index if not exists add_ons_tenant_idx on public.add_ons(tenant_id);

-- Optional: suggested mapping service -> add_on for admin UX
create table if not exists public.service_addons (
  service_id uuid not null references public.services(id) on delete cascade,
  addon_id uuid not null references public.add_ons(id) on delete cascade,
  sort_order integer not null default 0,
  primary key (service_id, addon_id)
);

-- Pricing Config per tenant (single row)
create table if not exists public.pricing_configs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null unique references public.tenants(id) on delete cascade,
  vehicle_tiers jsonb not null default '{}'::jsonb,
  distance_policy jsonb not null default '{}'::jsonb,
  temporal_multipliers jsonb not null default '{}'::jsonb,
  minimum_callout jsonb not null default '{}'::jsonb,
  discounts jsonb not null default '[]'::jsonb,
  tax jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists pricing_configs_tenant_idx on public.pricing_configs(tenant_id);

-- Update timestamp trigger reuse
drop trigger if exists services_set_updated_at on public.services;
create trigger services_set_updated_at before update on public.services for each row execute function public.set_updated_at();

drop trigger if exists add_ons_set_updated_at on public.add_ons;
create trigger add_ons_set_updated_at before update on public.add_ons for each row execute function public.set_updated_at();

drop trigger if exists pricing_configs_set_updated_at on public.pricing_configs;
create trigger pricing_configs_set_updated_at before update on public.pricing_configs for each row execute function public.set_updated_at();

-- RLS
alter table public.services enable row level security;
alter table public.add_ons enable row level security;
alter table public.service_addons enable row level security;
alter table public.pricing_configs enable row level security;

-- Helper predicate via EXISTS against profiles
-- Services policies
drop policy if exists services_select_staff_admin on public.services;
create policy services_select_staff_admin on public.services
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = services.tenant_id
      and p.role in ('staff','admin')
  )
);

drop policy if exists services_modify_admin_only on public.services;
create policy services_modify_admin_only on public.services
for all to authenticated using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = services.tenant_id
      and p.role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = services.tenant_id
      and p.role = 'admin'
  )
);

-- Add-ons policies
drop policy if exists addons_select_staff_admin on public.add_ons;
create policy addons_select_staff_admin on public.add_ons
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = add_ons.tenant_id
      and p.role in ('staff','admin')
  )
);

drop policy if exists addons_modify_admin_only on public.add_ons;
create policy addons_modify_admin_only on public.add_ons
for all to authenticated using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = add_ons.tenant_id
      and p.role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = add_ons.tenant_id
      and p.role = 'admin'
  )
);

-- service_addons mapping (admin only writes; staff/admin read)
drop policy if exists service_addons_select_staff_admin on public.service_addons;
create policy service_addons_select_staff_admin on public.service_addons
for select using (
  exists (
    select 1 from public.profiles p
    join public.services s on s.tenant_id = p.tenant_id and s.id = service_addons.service_id
    where p.id = auth.uid() and p.role in ('staff','admin')
  )
);

drop policy if exists service_addons_modify_admin_only on public.service_addons;
create policy service_addons_modify_admin_only on public.service_addons
for all to authenticated using (
  exists (
    select 1 from public.profiles p
    join public.services s on s.tenant_id = p.tenant_id and s.id = service_addons.service_id
    where p.id = auth.uid() and p.role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles p
    join public.services s on s.tenant_id = p.tenant_id and s.id = service_addons.service_id
    where p.id = auth.uid() and p.role = 'admin'
  )
);

-- Pricing config policies
drop policy if exists pricing_select_staff_admin on public.pricing_configs;
create policy pricing_select_staff_admin on public.pricing_configs
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = pricing_configs.tenant_id
      and p.role in ('staff','admin')
  )
);

drop policy if exists pricing_modify_admin_only on public.pricing_configs;
create policy pricing_modify_admin_only on public.pricing_configs
for all to authenticated using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = pricing_configs.tenant_id
      and p.role = 'admin'
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = pricing_configs.tenant_id
      and p.role = 'admin'
  )
);

-- Grants (still gated by RLS)
revoke all on public.services from anon, authenticated;
revoke all on public.add_ons from anon, authenticated;
revoke all on public.service_addons from anon, authenticated;
revoke all on public.pricing_configs from anon, authenticated;

grant select on public.services to authenticated;
grant select on public.add_ons to authenticated;
grant select on public.service_addons to authenticated;
grant select on public.pricing_configs to authenticated;

grant insert, update, delete on public.services to authenticated;
grant insert, update, delete on public.add_ons to authenticated;
grant insert, update, delete on public.service_addons to authenticated;
grant insert, update, delete on public.pricing_configs to authenticated;


