export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const bodySchema = z.object({
  vehicle_tiers: z.record(z.string(), z.unknown()).optional(),
  distance_policy: z.record(z.string(), z.unknown()).optional(),
  temporal_multipliers: z.record(z.string(), z.unknown()).optional(),
  minimum_callout: z.record(z.string(), z.unknown()).optional(),
  discounts: z.array(z.unknown()).optional(),
  tax: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff', 'admin'].includes(profile.role)) throw new Error('Forbidden');
    const { data, error } = await admin
      .from('pricing_configs')
      .select('*')
      .eq('tenant_id', profile.tenant_id)
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, pricing: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const body = await req.json();
    const payload = bodySchema.parse(body);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') throw new Error('Admin only');
    const { data, error } = await admin
      .from('pricing_configs')
      .upsert({ tenant_id: profile.tenant_id, ...payload }, { onConflict: 'tenant_id' })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, pricing: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


