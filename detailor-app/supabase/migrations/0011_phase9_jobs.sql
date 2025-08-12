-- Phase 9: Operational Layer (Jobs)

create extension if not exists pgcrypto;

do $$ begin
  create type job_status as enum ('not_started','in_progress','completed','paid');
exception when duplicate_object then null; end $$;

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  booking_id uuid not null references public.bookings(id) on delete cascade,
  staff_profile_id uuid references public.profiles(id) on delete set null,
  status job_status not null default 'not_started',
  checklist jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tenant_id, booking_id)
);

create table if not exists public.job_media (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  kind text not null check (kind in ('before','after','other')),
  url text not null,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.job_activity (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  event text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists jobs_tenant_idx on public.jobs(tenant_id);
create index if not exists job_media_tenant_idx on public.job_media(tenant_id);
create index if not exists job_activity_tenant_idx on public.job_activity(tenant_id);

drop trigger if exists jobs_set_updated_at on public.jobs;
create trigger jobs_set_updated_at before update on public.jobs for each row execute function public.set_updated_at();

alter table public.jobs enable row level security;
alter table public.job_media enable row level security;
alter table public.job_activity enable row level security;

revoke all on public.jobs from anon, authenticated;
revoke all on public.job_media from anon, authenticated;
revoke all on public.job_activity from anon, authenticated;
grant select, insert, update on public.jobs to authenticated;
grant select, insert on public.job_media to authenticated;
grant select, insert on public.job_activity to authenticated;

-- Policies: staff/admin within tenant; staff limited to assigned jobs for write
create policy jobs_select_tenant on public.jobs for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = jobs.tenant_id)
);
create policy jobs_insert_admin on public.jobs for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = jobs.tenant_id and p.role in ('staff','admin'))
);
create policy jobs_update_admin_staff on public.jobs for update using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = jobs.tenant_id and (
    p.role = 'admin' or (p.role = 'staff' and jobs.staff_profile_id = p.id)
  ))
) with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = jobs.tenant_id and (
    p.role = 'admin' or (p.role = 'staff' and jobs.staff_profile_id = p.id)
  ))
);

create policy job_media_select_tenant on public.job_media for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = job_media.tenant_id)
);
create policy job_media_insert_staff on public.job_media for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = job_media.tenant_id and p.role in ('staff','admin'))
);

create policy job_activity_select_tenant on public.job_activity for select using (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = job_activity.tenant_id)
);
create policy job_activity_insert_staff on public.job_activity for insert with check (
  exists (select 1 from public.profiles p where p.id = auth.uid() and p.tenant_id = job_activity.tenant_id and p.role in ('staff','admin'))
);


