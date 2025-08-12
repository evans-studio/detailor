export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { computePriceBreakdown, calculateDistanceSurcharge } from '@/lib/pricing';

const createSchema = z.object({
  customer_id: z.string().uuid(),
  service_id: z.string().uuid(),
  addon_ids: z.array(z.string().uuid()).optional(),
  vehicle_size_tier: z.string().min(1),
  scheduled_at: z.string().optional(),
  distance_miles: z.number().optional(),
  discount_code: z.string().optional(),
});


export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    if (['staff', 'admin'].includes(profile.role)) {
      const { data, error } = await admin
        .from('quotes')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ ok: true, quotes: data });
    }
    const { data, error } = await admin
      .from('quotes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, quotes: data });
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

    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');

    const { data: svc } = await admin.from('services').select('*').eq('id', payload.service_id).single();
    if (!svc) throw new Error('Service not found');

    const addonIds = payload.addon_ids ?? [];
    let addonsTotal = 0;
    if (addonIds.length) {
      const { data: addons } = await admin.from('add_ons').select('*').in('id', addonIds);
      addonsTotal = (addons || []).reduce((sum, a) => sum + Number(a.price_delta || 0), 0);
    }

    const { data: pricing } = await admin
      .from('pricing_configs')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .single();

    const vehicleMultiplier = Number(pricing?.vehicle_tiers?.[payload.vehicle_size_tier] ?? 1);
    const taxRate = Number(pricing?.tax?.rate ?? 0);
    const distance = Number(payload.distance_miles ?? 0);
    
    const distancePolicy = {
      free_radius: Number(pricing?.distance_policy?.free_radius ?? 0),
      surcharge_per_mile: Number(pricing?.distance_policy?.surcharge_per_mile ?? 0),
    };
    const distanceSurcharge = calculateDistanceSurcharge(distance, distancePolicy);

    const breakdown = computePriceBreakdown(Number(svc.base_price), vehicleMultiplier, addonsTotal, distanceSurcharge, taxRate);

    const { data: quote, error } = await admin
      .from('quotes')
      .insert({
        tenant_id: profile.tenant_id,
        customer_id: payload.customer_id,
        service_id: payload.service_id,
        addon_ids: addonIds,
        vehicle_size_tier: payload.vehicle_size_tier,
        scheduled_at: payload.scheduled_at,
        distance_miles: distance,
        discount_code: payload.discount_code,
        price_breakdown: breakdown,
        status: 'issued',
        expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
      })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, quote });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


