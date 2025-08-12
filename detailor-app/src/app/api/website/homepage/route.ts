import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const payloadSchema = z.object({
  homepage_template: z.enum(['professional-clean','service-focused','local-expert']).optional(),
  homepage_published: z.boolean().optional(),
  homepage_content: z.record(z.string(), z.unknown()).optional(),
  brand_settings: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') throw new Error('Forbidden');
    const { data, error } = await admin
      .from('tenants')
      .select('id, legal_name, trading_name, homepage_template, homepage_published, homepage_content, brand_settings, plan_id, feature_flags')
      .eq('id', profile.tenant_id)
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, tenant: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = payloadSchema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') throw new Error('Forbidden');
    const { data, error } = await admin
      .from('tenants')
      .update(payload)
      .eq('id', profile.tenant_id)
      .select('id, legal_name, trading_name, homepage_template, homepage_published, homepage_content, brand_settings')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, tenant: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


