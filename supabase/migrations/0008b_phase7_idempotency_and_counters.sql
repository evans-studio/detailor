-- Phase 7 addendum: Idempotency uniqueness and per-tenant invoice numbering

-- Unique idempotency per tenant (ignore nulls)
create unique index if not exists payments_tenant_idem_idx
  on public.payments(tenant_id, idempotency_key)
  where idempotency_key is not null;

-- Invoice counters per tenant
create table if not exists public.invoice_counters (
  tenant_id uuid primary key references public.tenants(id) on delete cascade,
  current_seq integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.invoice_counters enable row level security;
revoke all on public.invoice_counters from anon, authenticated;
grant select, update, insert on public.invoice_counters to authenticated;

drop policy if exists invoice_counters_tenant_admin_only on public.invoice_counters;
create policy invoice_counters_tenant_admin_only on public.invoice_counters
for all to authenticated using (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = invoice_counters.tenant_id and p.role in ('staff','admin')
  )
) with check (
  exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = invoice_counters.tenant_id and p.role in ('staff','admin')
  )
);

-- Generator function: INV-YYYY-XXXX per tenant
create or replace function public.generate_invoice_number(p_tenant_id uuid, p_today date default current_date)
returns text
language plpgsql
security definer
as $$
declare
  v_seq integer;
  v_prefix text;
begin
  v_prefix := 'INV-' || to_char(p_today, 'YYYY') || '-';
  -- Ensure counter row exists
  insert into public.invoice_counters(tenant_id, current_seq)
  values (p_tenant_id, 0)
  on conflict (tenant_id) do nothing;

  -- Advance sequence atomically
  update public.invoice_counters
     set current_seq = current_seq + 1,
         updated_at = now()
   where tenant_id = p_tenant_id
  returning current_seq into v_seq;

  return v_prefix || lpad(v_seq::text, 4, '0');
end;
$$;


