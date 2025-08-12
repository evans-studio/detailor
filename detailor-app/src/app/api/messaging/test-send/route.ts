import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({ to: z.string().email(), template_id: z.string().uuid().optional() });

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { to } = schema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') throw new Error('Forbidden');
    const { data: tenant } = await admin.from('tenants').select('is_demo').eq('id', profile.tenant_id).single();
    if (tenant?.is_demo) {
      return NextResponse.json({ ok: false, error: 'Test send disabled in demo.' }, { status: 400 });
    }
    // In non-demo, this would call provider via existing messaging service
    return NextResponse.json({ ok: true, message: `Test send accepted to ${to}` });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


