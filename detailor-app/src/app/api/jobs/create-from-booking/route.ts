import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({ booking_id: z.string().uuid() });

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { booking_id } = schema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role, id').eq('id', user.id).single();
    if (!profile || !['admin','staff'].includes(profile.role)) throw new Error('Forbidden');
    const { data: booking } = await admin.from('bookings').select('*').eq('id', booking_id).eq('tenant_id', profile.tenant_id).single();
    if (!booking) throw new Error('Booking not found');
    const { data, error } = await admin
      .from('jobs')
      .insert({ tenant_id: profile.tenant_id, booking_id: booking_id, staff_profile_id: null, status: 'not_started', checklist: '[]' })
      .select('*')
      .single();
    if (error) throw error;
    await admin.from('job_activity').insert({ tenant_id: profile.tenant_id, job_id: data.id, actor_profile_id: profile.id, event: 'created', payload: {} });
    return NextResponse.json({ ok: true, job: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


