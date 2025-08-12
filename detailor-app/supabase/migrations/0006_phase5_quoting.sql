-- Phase 5: Quoting Engine — quotes table, RLS, status transitions

do $$ begin
  create type quote_status as enum ('draft','issued','accepted','expired','revoked');
exception when duplicate_object then null; end $$;

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

create index if not exists quotes_tenant_idx on public.quotes(tenant_id);
create index if not exists quotes_customer_idx on public.quotes(customer_id);
create index if not exists quotes_status_idx on public.quotes(status);

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at before update on public.quotes for each row execute function public.set_updated_at();

alter table public.quotes enable row level security;

-- Select policies
drop policy if exists quotes_select_self on public.quotes;
create policy quotes_select_self on public.quotes
for select using (
  exists (
    select 1 from public.customers c
    where c.id = quotes.customer_id and c.auth_user_id = auth.uid()
  )
);

drop policy if exists quotes_select_staff_admin on public.quotes;
create policy quotes_select_staff_admin on public.quotes
for select using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.tenant_id = quotes.tenant_id and p.role in ('staff','admin')
  )
);

-- Insert: customers can create their own quotes; staff/admin for tenant
drop policy if exists quotes_insert_self_or_staff on public.quotes;
create policy quotes_insert_self_or_staff on public.quotes
for insert to authenticated with check (
  (
    exists (
      select 1 from public.customers c
      where c.id = quotes.customer_id and c.auth_user_id = auth.uid()
    )
  )
  or (
    exists (
      select 1 from public.profiles p
      join public.customers c on c.tenant_id = p.tenant_id and c.id = quotes.customer_id
      where p.id = auth.uid() and p.role in ('staff','admin')
    )
  )
);

-- Update: staff/admin can update status; customers can only accept their own issued quotes
drop policy if exists quotes_update_staff_admin on public.quotes;
create policy quotes_update_staff_admin on public.quotes
for update using (
  exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.tenant_id = quotes.tenant_id and p.role in ('staff','admin')
  )
) with check (true);

drop policy if exists quotes_accept_self on public.quotes;
create policy quotes_accept_self on public.quotes
for update using (
  exists (
    select 1 from public.customers c where c.id = quotes.customer_id and c.auth_user_id = auth.uid()
  ) and quotes.status in ('issued')
) with check (
  exists (
    select 1 from public.customers c where c.id = quotes.customer_id and c.auth_user_id = auth.uid()
  ) and new.status = 'accepted'
);

-- Delete: not allowed (use revoke)
revoke all on public.quotes from anon, authenticated;
grant select, insert, update on public.quotes to authenticated;


