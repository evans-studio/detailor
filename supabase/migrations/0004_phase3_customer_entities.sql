-- Phase 3: Customer, Vehicles, Addresses with strict RLS

-- Customers (CRM)
create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  auth_user_id uuid references auth.users(id) on delete set null,
  name text not null,
  email text,
  phone text,
  flags jsonb not null default '{}'::jsonb, -- e.g., VIP/blocked
  internal_notes text,
  ltv numeric(14,2) default 0,
  last_booking_at timestamptz,
  consents jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_tenant_idx on public.customers(tenant_id);
create index if not exists customers_auth_idx on public.customers(auth_user_id);

-- Vehicles
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  make text not null,
  model text not null,
  year int,
  colour text,
  size_tier text,
  vin text,
  photos jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists vehicles_tenant_idx on public.vehicles(tenant_id);
create index if not exists vehicles_customer_idx on public.vehicles(customer_id);

-- Addresses
create table if not exists public.addresses (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text,
  address_line1 text not null,
  address_line2 text,
  city text,
  postcode text,
  lat double precision,
  lng double precision,
  access_notes text,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists addresses_tenant_idx on public.addresses(tenant_id);
create index if not exists addresses_customer_idx on public.addresses(customer_id);

-- Triggers for updated_at
drop trigger if exists customers_set_updated_at on public.customers;
create trigger customers_set_updated_at before update on public.customers for each row execute function public.set_updated_at();

drop trigger if exists vehicles_set_updated_at on public.vehicles;
create trigger vehicles_set_updated_at before update on public.vehicles for each row execute function public.set_updated_at();

drop trigger if exists addresses_set_updated_at on public.addresses;
create trigger addresses_set_updated_at before update on public.addresses for each row execute function public.set_updated_at();

-- RLS
alter table public.customers enable row level security;
alter table public.vehicles enable row level security;
alter table public.addresses enable row level security;

-- Customers policies
drop policy if exists customers_select_self on public.customers;
create policy customers_select_self on public.customers
for select using (
  auth.uid() = auth_user_id
);

drop policy if exists customers_select_staff_admin on public.customers;
create policy customers_select_staff_admin on public.customers
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = customers.tenant_id
      and p.role in ('staff','admin')
  )
);

drop policy if exists customers_update_self on public.customers;
create policy customers_update_self on public.customers
for update using (auth.uid() = auth_user_id) with check (auth.uid() = auth_user_id);

drop policy if exists customers_modify_staff_admin on public.customers;
create policy customers_modify_staff_admin on public.customers
for all to authenticated using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = customers.tenant_id
      and p.role in ('staff','admin')
  )
) with check (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid()
      and p.tenant_id = customers.tenant_id
      and p.role in ('staff','admin')
  )
);

-- Vehicles policies
drop policy if exists vehicles_select_self on public.vehicles;
create policy vehicles_select_self on public.vehicles
for select using (
  exists (
    select 1 from public.customers c where c.id = vehicles.customer_id and c.auth_user_id = auth.uid()
  )
);

drop policy if exists vehicles_select_staff_admin on public.vehicles;
create policy vehicles_select_staff_admin on public.vehicles
for select using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = vehicles.tenant_id and p.role in ('staff','admin')
  )
);

drop policy if exists vehicles_modify_self on public.vehicles;
create policy vehicles_modify_self on public.vehicles
for all to authenticated using (
  exists (
    select 1 from public.customers c where c.id = vehicles.customer_id and c.auth_user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.customers c where c.id = vehicles.customer_id and c.auth_user_id = auth.uid()
  )
);

drop policy if exists vehicles_modify_staff_admin on public.vehicles;
create policy vehicles_modify_staff_admin on public.vehicles
for all to authenticated using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = vehicles.tenant_id and p.role in ('staff','admin')
  )
) with check (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = vehicles.tenant_id and p.role in ('staff','admin')
  )
);

-- Addresses policies
drop policy if exists addresses_select_self on public.addresses;
create policy addresses_select_self on public.addresses
for select using (
  exists (
    select 1 from public.customers c where c.id = addresses.customer_id and c.auth_user_id = auth.uid()
  )
);

drop policy if exists addresses_select_staff_admin on public.addresses;
create policy addresses_select_staff_admin on public.addresses
for select using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = addresses.tenant_id and p.role in ('staff','admin')
  )
);

drop policy if exists addresses_modify_self on public.addresses;
create policy addresses_modify_self on public.addresses
for all to authenticated using (
  exists (
    select 1 from public.customers c where c.id = addresses.customer_id and c.auth_user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.customers c where c.id = addresses.customer_id and c.auth_user_id = auth.uid()
  )
);

drop policy if exists addresses_modify_staff_admin on public.addresses;
create policy addresses_modify_staff_admin on public.addresses
for all to authenticated using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = addresses.tenant_id and p.role in ('staff','admin')
  )
) with check (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = addresses.tenant_id and p.role in ('staff','admin')
  )
);

-- Grants gated by RLS
revoke all on public.customers from anon, authenticated;
revoke all on public.vehicles from anon, authenticated;
revoke all on public.addresses from anon, authenticated;

grant select, insert, update, delete on public.customers to authenticated;
grant select, insert, update, delete on public.vehicles to authenticated;
grant select, insert, update, delete on public.addresses to authenticated;


