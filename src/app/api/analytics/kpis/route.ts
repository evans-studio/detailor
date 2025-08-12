export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    const { data: tenant } = await admin.from('tenants').select('feature_flags').eq('id', profile.tenant_id).single();
    const ff = (tenant?.feature_flags as Record<string, unknown>) || {};
    if (!ff.analytics) {
      return NextResponse.json({ ok: false, error: 'Analytics not available on your plan.' }, { status: 403 });
    }
    // Simple KPIs example (implement materialized views later)
    const { data: bookingsToday } = await admin.rpc('kpi_bookings_today', { tenant_id_input: profile.tenant_id });
    const { data: revenue7d } = await admin.rpc('kpi_revenue_7d', { tenant_id_input: profile.tenant_id });
    const { data: repeatRate } = await admin.rpc('kpi_repeat_rate', { tenant_id_input: profile.tenant_id });
    return NextResponse.json({ ok: true, kpis: { bookings_today: Number(bookingsToday || 0), revenue_7d: Number(revenue7d || 0), repeat_rate: Number(repeatRate || 0) } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


