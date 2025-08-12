export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function startOfMonth(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)); }

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const url = new URL(req.url);
    const from = url.searchParams.get('from') || undefined;
    const to = url.searchParams.get('to') || undefined;
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff','admin'].includes(profile.role)) throw new Error('Forbidden');
    const { data: tenant } = await admin.from('tenants').select('feature_flags, plan').eq('id', profile.tenant_id).single();
    const plan = String((tenant as { plan?: string } | null)?.plan || 'starter');
    if (plan === 'starter') return NextResponse.json({ ok: false, error: 'Exports not available on Starter plan.' }, { status: 403 });

    const now = new Date();
    const month = startOfMonth(now).toISOString().slice(0, 10);
    const { data: usage } = await admin
      .from('export_usage')
      .select('exports_count, last_export_at')
      .eq('tenant_id', profile.tenant_id)
      .eq('period_month', month)
      .maybeSingle();
    const lastAt = usage?.last_export_at ? new Date(usage.last_export_at) : null;
    if (plan === 'pro' && lastAt && (now.getTime() - lastAt.getTime()) < 7 * 24 * 3600 * 1000) {
      return NextResponse.json({ ok: false, error: 'Pro exports available weekly. Please try later or upgrade.' }, { status: 429 });
    }
    if (plan === 'business' && lastAt && (now.getTime() - lastAt.getTime()) < 24 * 3600 * 1000) {
      return NextResponse.json({ ok: false, error: 'Business exports available daily. Please try later.' }, { status: 429 });
    }

    let query = admin
      .from('bookings')
      .select('id, reference, start_at, end_at, price_breakdown, customers(name,email), services(name)')
      .eq('tenant_id', profile.tenant_id)
      .order('start_at');
    if (from) query = query.gte('start_at', from);
    if (to) query = query.lte('start_at', to);
    const { data: rows, error } = await query;
    if (error) throw error;

    await admin.rpc('record_export_usage', { tenant_id_input: profile.tenant_id });

    type BookingRow = {
      id: string;
      reference: string;
      start_at: string;
      end_at: string;
      price_breakdown?: { total?: number } | null;
      customers?: { name?: string; email?: string } | null;
      services?: { name?: string } | null;
    };
    const header = 'id,reference,start_at,end_at,service,customer_name,customer_email,total';
    const lines = ((rows || []) as BookingRow[]).map((r) => {
      const total = Number(r.price_breakdown?.total ?? 0);
      const svc = r.services?.name ?? '';
      const cust = r.customers?.name ?? '';
      const email = r.customers?.email ?? '';
      return [r.id, r.reference, r.start_at, r.end_at, svc, cust, email, total]
        .map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',');
    });
    const csv = [header, ...lines].join('\n');
    return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="bookings.csv"' } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


