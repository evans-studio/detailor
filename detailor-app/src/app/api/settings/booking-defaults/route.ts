import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({
  start: z.string().regex(/^\d{2}:\d{2}$/),
  end: z.string().regex(/^\d{2}:\d{2}$/),
  slot_minutes: z.number().int().positive(),
  capacity: z.number().int().positive().default(2),
  weekdays: z.array(z.number().int().min(0).max(6)).default([1,2,3,4,5]),
});

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { start, end, slot_minutes, capacity, weekdays } = schema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') throw new Error('Forbidden');
    // Replace patterns for the given weekdays
    await admin.from('work_patterns').delete().eq('tenant_id', profile.tenant_id).in('weekday', weekdays);
    const inserts = weekdays.map((d) => ({ tenant_id: profile.tenant_id, weekday: d, start_time: start, end_time: end, slot_duration_min: slot_minutes, capacity }));
    const { error } = await admin.from('work_patterns').insert(inserts);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    const { data } = await admin.from('work_patterns').select('*').eq('tenant_id', profile.tenant_id).order('weekday');
    return NextResponse.json({ ok: true, patterns: data || [] });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


