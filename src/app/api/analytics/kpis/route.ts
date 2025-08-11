import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');

    // Check if analytics is enabled for this tenant's tier
    const { data: tenant } = await admin.from('tenants').select('feature_flags').eq('id', profile.tenant_id).single();
    const analyticsEnabled = tenant?.feature_flags?.analytics;
    
    if (!analyticsEnabled) {
      return NextResponse.json({ 
        ok: false, 
        error: 'Analytics requires Pro plan or higher. Upgrade to access detailed insights.' 
      }, { status: 403 });
    }

    const { data, error } = await admin.from('v_tenant_kpis').select('*').eq('tenant_id', profile.tenant_id).single();
    if (error) throw error;
    return NextResponse.json({ ok: true, kpis: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


