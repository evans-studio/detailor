-- Fix Phase 5 policy: remove invalid reference to "new.status" in RLS policy
-- This script is safe to run whether or not the initial 0006 migration partially applied.

-- Ensure the quotes table exists (no-op if already there)
do $$ begin
  perform 1 from information_schema.tables where table_schema = 'public' and table_name = 'quotes';
  if not found then
    raise notice 'Table public.quotes not found. Run 0006_phase5_quoting.sql first.';
  end if;
end $$;

-- Drop and recreate the customer-accept policy with correct syntax
do $$ begin
  execute 'drop policy if exists quotes_accept_self on public.quotes';
exception when undefined_object then null; end $$;

create policy quotes_accept_self on public.quotes
for update using (
  exists (
    select 1 from public.customers c
    where c.id = quotes.customer_id and c.auth_user_id = auth.uid()
  ) and status = 'issued'
) with check (
  exists (
    select 1 from public.customers c
    where c.id = quotes.customer_id and c.auth_user_id = auth.uid()
  ) and status = 'accepted'
);


