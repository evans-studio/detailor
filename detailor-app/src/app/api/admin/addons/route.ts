export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const bodySchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price_delta: z.number().min(0),
  duration_delta_min: z.number().int().min(0),
  compatibility: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff', 'admin'].includes(profile.role)) throw new Error('Forbidden');
    const { data, error } = await admin.from('add_ons').select('*').eq('tenant_id', profile.tenant_id).order('name');
    if (error) throw error;
    return NextResponse.json({ ok: true, addons: data });
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
      .from('add_ons')
      .insert({ tenant_id: profile.tenant_id, ...payload })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, addon: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


