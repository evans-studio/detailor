-- Phase 8c: Tenants & Profiles enhancements for demo flags and branding

-- Tenants: add slug, is_demo, feature flags and comms/payment fields
alter table public.tenants
  add column if not exists slug text,
  add column if not exists is_demo boolean not null default false,
  add column if not exists feature_flags jsonb not null default '{}'::jsonb,
  add column if not exists stripe_public_key text,
  add column if not exists stripe_secret_key text,
  add column if not exists sender_domain text,
  add column if not exists reply_to text;

create index if not exists tenants_slug_idx on public.tenants(slug);
create index if not exists tenants_is_demo_idx on public.tenants(is_demo);

-- Profiles: add status enum and column
do $$ begin
  create type user_status as enum ('active','disabled');
exception when duplicate_object then null; end $$;

alter table public.profiles
  add column if not exists status user_status not null default 'active';


