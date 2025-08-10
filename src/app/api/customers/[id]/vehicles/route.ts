export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const createSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().optional(),
  colour: z.string().optional(),
  size_tier: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const customerId = pathname.split('/')[pathname.split('/').indexOf('customers') + 1];
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (profile && ['staff', 'admin'].includes(profile.role)) {
      const { data, error } = await admin
        .from('vehicles')
        .select('*')
        .eq('tenant_id', profile.tenant_id)
        .eq('customer_id', customerId)
        .order('created_at');
      if (error) throw error;
      return NextResponse.json({ ok: true, vehicles: data });
    }
    const { data, error } = await admin.from('vehicles').select('*').order('created_at');
    if (error) throw error;
    return NextResponse.json({ ok: true, vehicles: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const customerId = pathname.split('/')[pathname.split('/').indexOf('customers') + 1];
    const body = await req.json();
    const payload = createSchema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff', 'admin'].includes(profile.role)) throw new Error('Forbidden');
    const { data, error } = await admin
      .from('vehicles')
      .insert({ tenant_id: profile.tenant_id, customer_id: customerId, ...payload })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, vehicle: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


