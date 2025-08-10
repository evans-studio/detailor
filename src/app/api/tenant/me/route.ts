import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    const { data: tenant } = await admin
      .from('tenants')
      .select('id, trading_name, is_demo, stripe_public_key, stripe_secret_key')
      .eq('id', profile.tenant_id)
      .single();
    return NextResponse.json({ ok: true, tenant: tenant ?? { id: profile.tenant_id, is_demo: true } });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


