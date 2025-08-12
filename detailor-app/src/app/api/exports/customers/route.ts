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
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff','admin'].includes(profile.role)) throw new Error('Forbidden');
    const { data: tenant } = await admin.from('tenants').select('feature_flags, plan').eq('id', profile.tenant_id).single();
    const ff = (tenant?.feature_flags as Record<string, unknown>) || {};
    const plan = String((tenant as { plan?: string } | null)?.plan || 'starter');

    // Gating by tier
    if (plan === 'starter') {
      return NextResponse.json({ ok: false, error: 'Exports not available on Starter plan.' }, { status: 403 });
    }

    // Frequency limits: Pro weekly, Business daily, Enterprise unlimited
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

    // Fetch data
    const { data: customers, error } = await admin
      .from('customers')
      .select('id, name, email, phone, created_at')
      .eq('tenant_id', profile.tenant_id)
      .order('created_at');
    if (error) throw error;

    // Record export usage
    await admin.rpc('record_export_usage', { tenant_id_input: profile.tenant_id });

    // Build CSV
    const header = 'id,name,email,phone,created_at';
    const lines = (customers || []).map((c) => [c.id, c.name, c.email, c.phone, c.created_at].map((v) => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
    const csv = [header, ...lines].join('\n');
    return new NextResponse(csv, { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="customers.csv"' } });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


