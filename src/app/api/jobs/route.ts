import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role, id').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    const url = new URL(req.url);
    const day = url.searchParams.get('day');
    const status = url.searchParams.get('status');
    let query = admin
      .from('jobs')
      .select('*, bookings(*), customers:bookings_customer_id_fkey(*), vehicles:bookings_vehicle_id_fkey(*)')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at', { ascending: false });
    if (status) query = query.eq('status', status);
    if (day) query = query.gte('created_at', `${day} 00:00:00+00`).lte('created_at', `${day} 23:59:59+00`);
    if (profile.role === 'staff') query = query.eq('staff_profile_id', profile.id);
    const { data, error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true, jobs: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


