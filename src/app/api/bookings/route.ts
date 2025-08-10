export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const createSchema = z.object({
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  address_id: z.string().uuid(),
  service_id: z.string().uuid(),
  addon_ids: z.array(z.string().uuid()).optional(),
  start_at: z.string(),
  end_at: z.string(),
  reference: z.string().min(4),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    const { data: selfCustomer } = await admin.from('customers').select('id, tenant_id').eq('auth_user_id', user.id).single();
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const from = url.searchParams.get('from') || undefined;
    const to = url.searchParams.get('to') || undefined;
    const q = url.searchParams.get('q') || undefined;

    let query;
    if (profile?.tenant_id) {
      // staff/admin path: tenant scoped
      query = admin.from('bookings').select('*').eq('tenant_id', profile.tenant_id);
      if (profile.role === 'customer' && selfCustomer) {
        // Guard: if role mislabeled, still self-scope
        query = admin.from('bookings').select('*').eq('customer_id', selfCustomer.id);
      }
    } else if (selfCustomer) {
      // customer path: self-scope
      query = admin.from('bookings').select('*').eq('customer_id', selfCustomer.id);
    } else {
      throw new Error('No profile or customer context');
    }
    if (status) query = query.eq('status', status);
    if (from) query = query.gte('start_at', from);
    if (to) query = query.lte('start_at', to);
    if (q) query = query.ilike('reference', `%${q}%`);
    const { data, error } = await query.order('start_at', { ascending: true });
    if (error) throw error;
    return NextResponse.json({ ok: true, bookings: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = createSchema.parse(body);
    const addonIds = payload.addon_ids ?? [];

    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    let tenantId = profile?.tenant_id as string | undefined;
    if (!tenantId) {
      const { data: selfCustomer } = await admin.from('customers').select('tenant_id').eq('auth_user_id', user.id).single();
      tenantId = selfCustomer?.tenant_id as string | undefined;
    }
    if (!tenantId) throw new Error('No tenant context');

    // Compute price from quote-like method using service price and pricing config
    const { data: svc } = await admin.from('services').select('*').eq('id', payload.service_id).single();
    if (!svc) throw new Error('Service not found');

    let addonsTotal = 0;
    if (addonIds.length) {
      const { data: addons } = await admin.from('add_ons').select('*').in('id', addonIds);
      addonsTotal = (addons || []).reduce((sum, a) => sum + Number(a.price_delta || 0), 0);
    }

    const { data: pricing } = await admin
      .from('pricing_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();
    const taxRate = Number(pricing?.tax?.rate ?? 0);
    const basePrice = Number(svc.base_price) + addonsTotal;
    const tax = Math.round(basePrice * taxRate * 100) / 100;
    const total = Math.round((basePrice + tax) * 100) / 100;
    const price_breakdown = { base: Number(svc.base_price), addons: addonsTotal, taxRate, tax, total };

    const { data, error } = await admin
      .from('bookings')
      .insert({
        tenant_id: tenantId,
        customer_id: payload.customer_id,
        vehicle_id: payload.vehicle_id,
        address_id: payload.address_id,
        service_id: payload.service_id,
        addon_ids: addonIds,
        start_at: payload.start_at,
        end_at: payload.end_at,
        reference: payload.reference,
        price_breakdown,
        status: 'pending',
      })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, booking: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


