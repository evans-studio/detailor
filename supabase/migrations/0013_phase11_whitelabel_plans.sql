-- Phase 11: White-Label & Plans (backend schema)

create table if not exists public.plans (
  id text primary key,
  name text not null,
  features jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.tenants add column if not exists plan_id text references public.plans(id) on delete set null;
alter table public.tenants add column if not exists feature_flags jsonb not null default '{}'::jsonb;
alter table public.tenants add column if not exists brand_theme jsonb not null default '{}'::jsonb;

-- Seed minimal plans
insert into public.plans (id, name, features) values
  ('starter', 'Starter', '{"limits":{"services":10,"staff":3}}'::jsonb),
  ('pro', 'Pro', '{"limits":{"services":100,"staff":20},"messaging":true}'::jsonb)
on conflict (id) do nothing;


