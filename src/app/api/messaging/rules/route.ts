import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({
  booking_reminder_hours_before: z.number().int().min(0).max(168).default(24),
  invoice_payment_reminder_days_after: z.number().int().min(0).max(60).default(3),
  post_service_followup_days_after: z.number().int().min(0).max(60).default(2),
  enabled: z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff','admin'].includes(profile.role)) throw new Error('Forbidden');
    const { data: tenant } = await admin
      .from('tenants')
      .select('business_prefs')
      .eq('id', profile.tenant_id)
      .single();
    const rules = (tenant?.business_prefs as Record<string, unknown> | null)?.['messaging_rules'] as Record<string, unknown> | undefined;
    return NextResponse.json({ ok: true, rules: rules || {} });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const incoming = await req.json();
    const payload = schema.partial().parse(incoming);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') throw new Error('Forbidden');
    const { data: tenant } = await admin.from('tenants').select('business_prefs').eq('id', profile.tenant_id).single();
    const prefs = (tenant?.business_prefs as Record<string, unknown>) || {};
    const merged = { ...(prefs['messaging_rules'] as Record<string, unknown> || {}), ...payload };
    const next = { ...prefs, messaging_rules: merged } as Record<string, unknown>;
    await admin.from('tenants').update({ business_prefs: next }).eq('id', profile.tenant_id);
    return NextResponse.json({ ok: true, rules: merged });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


