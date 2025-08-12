-- Phase 10: Analytics & Reporting

drop view if exists public.v_tenant_bookings_today;
create view public.v_tenant_bookings_today as
select b.tenant_id,
       count(*) as bookings_today
from public.bookings b
where b.start_at::date = current_date
group by b.tenant_id;

drop view if exists public.v_tenant_revenue_window;
create view public.v_tenant_revenue_window as
select i.tenant_id,
       sum(case when i.created_at >= now() - interval '7 days' then i.total else 0 end) as revenue_7d,
       sum(case when i.created_at >= now() - interval '30 days' then i.total else 0 end) as revenue_30d
from public.invoices i
group by i.tenant_id;

drop view if exists public.v_tenant_repeat_rate;
create view public.v_tenant_repeat_rate as
select b.tenant_id,
       case when count(distinct c.id) = 0 then 0::numeric
            else (count(distinct case when x.cnt > 1 then c.id end)::numeric / count(distinct c.id)::numeric) end as repeat_rate
from public.bookings b
join public.customers c on c.id = b.customer_id
join (
  select tenant_id, customer_id, count(*) as cnt
  from public.bookings
  group by tenant_id, customer_id
) x on x.tenant_id = b.tenant_id and x.customer_id = b.customer_id
group by b.tenant_id;

drop view if exists public.v_tenant_avg_ltv;
create view public.v_tenant_avg_ltv as
select coalesce(t.tenant_id, avg_totals.tenant_id) as tenant_id,
       coalesce(avg_totals.avg_total, 0) as avg_ltv
from (
  select b.tenant_id, b.customer_id, sum(i.total) as total_per_customer
  from public.invoices i
  join public.bookings b on b.id = i.booking_id
  group by b.tenant_id, b.customer_id
) t
right join (
  select tenant_id, avg(total_per_customer) as avg_total
  from (
    select b.tenant_id as tenant_id, b.customer_id as customer_id, sum(i.total) as total_per_customer
    from public.invoices i
    join public.bookings b on b.id = i.booking_id
    group by b.tenant_id, b.customer_id
  ) s
  group by tenant_id
) avg_totals on avg_totals.tenant_id = t.tenant_id;

drop view if exists public.v_tenant_kpis;
create view public.v_tenant_kpis as
select tenants.id as tenant_id,
       coalesce(tb.bookings_today, 0) as bookings_today,
       coalesce(rw.revenue_7d, 0) as revenue_7d,
       coalesce(rw.revenue_30d, 0) as revenue_30d,
       coalesce(rr.repeat_rate, 0) as repeat_rate,
       coalesce(ltv.avg_ltv, 0) as avg_ltv
from public.tenants
left join public.v_tenant_bookings_today tb on tb.tenant_id = tenants.id
left join public.v_tenant_revenue_window rw on rw.tenant_id = tenants.id
left join public.v_tenant_repeat_rate rr on rr.tenant_id = tenants.id
left join public.v_tenant_avg_ltv ltv on ltv.tenant_id = tenants.id;

-- Export helper views
drop view if exists public.v_export_bookings;
create view public.v_export_bookings as
select b.tenant_id, b.id as booking_id, b.reference, b.start_at, b.end_at, b.status, b.payment_status,
       c.name as customer_name, v.make || ' ' || v.model as vehicle, a.postcode,
       (b.price_breakdown->>'total')::numeric as total
from public.bookings b
left join public.customers c on c.id = b.customer_id
left join public.vehicles v on v.id = b.vehicle_id
left join public.addresses a on a.id = b.address_id;

drop view if exists public.v_export_invoices;
create view public.v_export_invoices as
select i.tenant_id, i.id as invoice_id, i.number, i.created_at, i.total, i.paid_amount, i.balance,
       b.reference as booking_reference
from public.invoices i
left join public.bookings b on b.id = i.booking_id;


