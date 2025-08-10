import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    // Try derive tenant via profile first
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    let tenantId = profile?.tenant_id as string | undefined;
    if (!tenantId) {
      // Fallback: derive via customers table
      const { data: cust } = await admin.from('customers').select('tenant_id').eq('auth_user_id', user.id).single();
      tenantId = cust?.tenant_id as string | undefined;
    }
    if (!tenantId) throw new Error('No tenant context');
    const { data, error } = await admin.from('services').select('*').eq('tenant_id', tenantId).order('name');
    if (error) throw error;
    return NextResponse.json({ ok: true, services: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


