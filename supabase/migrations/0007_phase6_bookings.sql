-- Phase 6: Booking System — bookings table, RLS, overlap prevention

create extension if not exists pgcrypto;
create extension if not exists btree_gist;

do $$ begin
  create type booking_status as enum ('pending','confirmed','in_progress','completed','cancelled','no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_status as enum ('unpaid','deposit_paid','paid','refunded','partial_refund');
exception when duplicate_object then null; end $$;

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  customer_id uuid not null references public.customers(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  address_id uuid not null references public.addresses(id) on delete restrict,
  service_id uuid not null references public.services(id) on delete restrict,
  addon_ids uuid[] not null default '{}',
  start_at timestamptz not null,
  end_at timestamptz not null,
  time_range tstzrange generated always as (tstzrange(start_at, end_at, '[)')) stored,
  price_breakdown jsonb not null,
  notes_customer text,
  notes_internal text,
  status booking_status not null default 'pending',
  payment_status payment_status not null default 'unpaid',
  reference text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reference)
);

create index if not exists bookings_tenant_idx on public.bookings(tenant_id);
create index if not exists bookings_customer_idx on public.bookings(customer_id);
create index if not exists bookings_timerange_idx on public.bookings using gist (time_range);

-- Prevent overlapping bookings for the same tenant
do $$ begin
  alter table public.bookings add constraint bookings_no_overlap
    exclude using gist (tenant_id with =, time_range with &&);
exception when duplicate_object then null; end $$;

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at before update on public.bookings for each row execute function public.set_updated_at();

alter table public.bookings enable row level security;

-- Grants
revoke all on public.bookings from anon, authenticated;
grant select, insert, update on public.bookings to authenticated;

-- Policies
-- Customers can read their own bookings
do $$ begin execute 'drop policy if exists bookings_select_self on public.bookings'; exception when undefined_object then null; end $$;
create policy bookings_select_self on public.bookings
for select using (
  exists (
    select 1 from public.customers c where c.id = bookings.customer_id and c.auth_user_id = auth.uid()
  )
);

-- Staff/Admin can read tenant bookings
do $$ begin execute 'drop policy if exists bookings_select_staff_admin on public.bookings'; exception when undefined_object then null; end $$;
create policy bookings_select_staff_admin on public.bookings
for select using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = bookings.tenant_id and p.role in ('staff','admin')
  )
);

-- Insert: customer for own customer/vehicle/address; or staff/admin for tenant
do $$ begin execute 'drop policy if exists bookings_insert_policy on public.bookings'; exception when undefined_object then null; end $$;
create policy bookings_insert_policy on public.bookings
for insert with check (
  (
    exists (
      select 1 from public.customers c
      join public.vehicles v on v.customer_id = c.id
      join public.addresses a on a.customer_id = c.id
      where c.id = bookings.customer_id
        and v.id = bookings.vehicle_id
        and a.id = bookings.address_id
        and c.auth_user_id = auth.uid()
    )
  )
  or (
    exists (
      select 1 from public.profiles p
      join public.customers c on c.tenant_id = p.tenant_id and c.id = bookings.customer_id
      where p.id = auth.uid() and p.role in ('staff','admin')
    )
  )
);

-- Update: staff/admin can update; customers can update own booking notes or reschedule (simplified: allow by same predicate as insert)
do $$ begin execute 'drop policy if exists bookings_update_staff_admin on public.bookings'; exception when undefined_object then null; end $$;
create policy bookings_update_staff_admin on public.bookings
for update using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = bookings.tenant_id and p.role in ('staff','admin')
  )
) with check (true);

do $$ begin execute 'drop policy if exists bookings_update_self on public.bookings'; exception when undefined_object then null; end $$;
create policy bookings_update_self on public.bookings
for update using (
  exists (
    select 1 from public.customers c where c.id = bookings.customer_id and c.auth_user_id = auth.uid()
  )
) with check (
  exists (
    select 1 from public.customers c where c.id = bookings.customer_id and c.auth_user_id = auth.uid()
  )
);


