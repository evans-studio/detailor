-- Phase 8: Messaging — templates, message ledger, basic inbound capture

create extension if not exists pgcrypto;

do $$ begin
  create type message_channel as enum ('email','sms','whatsapp');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_direction as enum ('outbound','inbound');
exception when duplicate_object then null; end $$;

do $$ begin
  create type message_status as enum ('queued','sent','delivered','failed','bounced');
exception when duplicate_object then null; end $$;

-- Templates per tenant
create table if not exists public.message_templates (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  key text not null,
  channel message_channel not null default 'email',
  subject text,
  body_html text,
  body_text text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, key)
);

create index if not exists message_templates_tenant_idx on public.message_templates(tenant_id);

-- Message ledger
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  booking_id uuid references public.bookings(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  channel message_channel not null,
  direction message_direction not null,
  status message_status not null default 'queued',
  template_key text,
  to_email text,
  to_phone text,
  subject text,
  body text,
  provider_id text,
  error_reason text,
  metadata jsonb not null default '{}'::jsonb,
  idempotency_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists messages_tenant_idx on public.messages(tenant_id);
create index if not exists messages_customer_idx on public.messages(customer_id);
create unique index if not exists messages_tenant_idem_idx on public.messages(tenant_id, idempotency_key) where idempotency_key is not null;

-- updated_at triggers
drop trigger if exists message_templates_set_updated_at on public.message_templates;
create trigger message_templates_set_updated_at before update on public.message_templates for each row execute function public.set_updated_at();

drop trigger if exists messages_set_updated_at on public.messages;
create trigger messages_set_updated_at before update on public.messages for each row execute function public.set_updated_at();

-- RLS
alter table public.message_templates enable row level security;
alter table public.messages enable row level security;

revoke all on public.message_templates from anon, authenticated;
revoke all on public.messages from anon, authenticated;
grant select on public.message_templates to authenticated;
grant select, insert, update on public.messages to authenticated;

-- Policies: staff/admin manage templates for their tenant
drop policy if exists msg_tpl_select_staff_admin on public.message_templates;
create policy msg_tpl_select_staff_admin on public.message_templates
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = message_templates.tenant_id and p.role in ('staff','admin'))
);

drop policy if exists msg_tpl_modify_admin_only on public.message_templates;
create policy msg_tpl_modify_admin_only on public.message_templates
for all to authenticated using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = message_templates.tenant_id and p.role = 'admin')
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = message_templates.tenant_id and p.role = 'admin')
);

-- Messages: staff/admin read tenant; customers can read own messages (via customer_id)
drop policy if exists msg_select_tenant_staff_admin on public.messages;
create policy msg_select_tenant_staff_admin on public.messages
for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = messages.tenant_id and p.role in ('staff','admin'))
);

drop policy if exists msg_select_self on public.messages;
create policy msg_select_self on public.messages
for select using (
  exists (select 1 from public.customers c where c.id = messages.customer_id and c.auth_user_id = auth.uid())
);

-- Insert/update: staff/admin can insert tenant messages (idempotent)
do $$ begin execute 'drop policy if exists msg_insert_staff_admin on public.messages'; exception when undefined_object then null; end $$;
create policy msg_insert_staff_admin on public.messages
for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = messages.tenant_id and p.role in ('staff','admin'))
);

drop policy if exists msg_update_staff_admin on public.messages;
create policy msg_update_staff_admin on public.messages
for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = messages.tenant_id and p.role in ('staff','admin'))
) with check (true);


