-- Phase 6 addendum: transactional quote->booking conversion and immutability guard

create or replace function public.bookings_create_from_quote(
  p_quote_id uuid,
  p_vehicle_id uuid,
  p_address_id uuid,
  p_start_at timestamptz,
  p_end_at timestamptz,
  p_reference text
) returns public.bookings
language plpgsql
security definer
as $$
declare
  v_quote record;
  v_svc record;
  v_booking public.bookings;
begin
  -- Fetch quote and validate
  select * into v_quote from public.quotes where id = p_quote_id for update;
  if not found then
    raise exception 'quote not found';
  end if;
  if v_quote.status <> 'accepted' then
    raise exception 'quote not accepted';
  end if;

  -- Fetch service for duration sanity if needed
  select * into v_svc from public.services where id = v_quote.service_id;

  -- Insert booking; exclusion constraint will enforce no overlap
  insert into public.bookings (
    tenant_id,
    customer_id,
    vehicle_id,
    address_id,
    service_id,
    addon_ids,
    start_at,
    end_at,
    reference,
    price_breakdown,
    status,
    payment_status
  ) values (
    v_quote.tenant_id,
    v_quote.customer_id,
    p_vehicle_id,
    p_address_id,
    v_quote.service_id,
    coalesce(v_quote.addon_ids, '{}'),
    p_start_at,
    p_end_at,
    p_reference,
    v_quote.price_breakdown,
    'pending',
    'unpaid'
  ) returning * into v_booking;

  return v_booking;
end;
$$;

-- Prevent price_breakdown updates after confirmation
drop trigger if exists bookings_immutable_price_after_confirm on public.bookings;
create or replace function public.enforce_booking_price_immutable()
returns trigger
language plpgsql
as $$
begin
  if old.status in ('confirmed','in_progress','completed','cancelled','no_show') then
    if new.price_breakdown is distinct from old.price_breakdown then
      raise exception 'price_breakdown is immutable after confirmation';
    end if;
  end if;
  return new;
end;
$$;

create trigger bookings_immutable_price_after_confirm
before update on public.bookings
for each row execute function public.enforce_booking_price_immutable();


