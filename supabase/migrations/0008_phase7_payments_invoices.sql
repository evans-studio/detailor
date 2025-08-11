-- Phase 7: Payments & Invoices

create extension if not exists pgcrypto;

do $$ begin
  create type payment_provider as enum ('stripe','paypal','cash');
exception when duplicate_object then null; end $$;

-- Use a distinct enum for payment transaction status to avoid clashing with bookings.payment_status
do $$ begin
  create type payment_txn_status as enum ('requires_action','pending','succeeded','refunded','failed');
exception when duplicate_object then null; end $$;

create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  number text not null,
  issue_date date not null default current_date,
  due_date date,
  line_items jsonb not null default '[]'::jsonb,
  tax_rows jsonb not null default '[]'::jsonb,
  total numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  balance numeric(14,2) not null default 0,
  pdf_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, number)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  invoice_id uuid references public.invoices(id) on delete set null,
  provider payment_provider not null,
  amount numeric(14,2) not null,
  currency text not null default 'GBP',
  external_txn_id text,
  status payment_txn_status not null default 'pending',
  fee_breakdown jsonb not null default '{}'::jsonb,
  captured_at timestamptz,
  refunded_amount numeric(14,2) not null default 0,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoices_tenant_idx on public.invoices(tenant_id);
create index if not exists payments_tenant_idx on public.payments(tenant_id);

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at before update on public.invoices for each row execute function public.set_updated_at();
drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at before update on public.payments for each row execute function public.set_updated_at();

alter table public.invoices enable row level security;
alter table public.payments enable row level security;

revoke all on public.invoices from anon, authenticated;
revoke all on public.payments from anon, authenticated;
grant select, insert, update on public.invoices to authenticated;
grant select, insert, update on public.payments to authenticated;

-- Policies
create policy invoices_select_staff_admin on public.invoices for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = invoices.tenant_id and p.role in ('staff','admin'))
);
create policy invoices_select_self on public.invoices for select using (
  exists (
    select 1 from public.bookings b join public.customers c on c.id = b.customer_id
    where b.id = invoices.booking_id and c.auth_user_id = auth.uid()
  )
);
create policy payments_select_staff_admin on public.payments for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = payments.tenant_id and p.role in ('staff','admin'))
);
create policy payments_select_self on public.payments for select using (
  exists (
    select 1 from public.bookings b join public.customers c on c.id = b.customer_id
    where b.id = payments.booking_id and c.auth_user_id = auth.uid()
  )
);


