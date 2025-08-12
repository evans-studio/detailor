export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const upsertSchema = z.object({
  weekday: z.number().int().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  slot_duration_min: z.number().int().min(1),
  capacity: z.number().int().min(0),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff', 'admin'].includes(profile.role)) throw new Error('Forbidden');
    const { data, error } = await admin.from('work_patterns').select('*').eq('tenant_id', profile.tenant_id).order('weekday');
    if (error) throw error;
    return NextResponse.json({ ok: true, patterns: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const body = await req.json();
    const payload = upsertSchema.parse(body);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') throw new Error('Admin only');
    const { data, error } = await admin
      .from('work_patterns')
      .upsert({ tenant_id: profile.tenant_id, ...payload }, { onConflict: 'tenant_id,weekday' })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, pattern: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}


