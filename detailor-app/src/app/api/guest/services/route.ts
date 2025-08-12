export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Public services endpoint for guest booking flow
export async function GET(req: Request) {
  try {
    const admin = getSupabaseAdmin();
    const url = new URL(req.url);
    
    // Get tenant_id from URL param or header
    const tenantId = url.searchParams.get('tenant_id') || req.headers.get('x-tenant-id');
    
    if (!tenantId) {
      throw new Error('tenant_id required in URL parameter or x-tenant-id header');
    }

    // Verify the tenant exists and is active
    const { data: tenant } = await admin
      .from('tenants')
      .select('id, status')
      .eq('id', tenantId)
      .single();
    
    if (!tenant || tenant.status !== 'active') {
      throw new Error('Invalid or inactive tenant');
    }

    // Get active services for the tenant
    const { data, error } = await admin
      .from('services')
      .select('id, name, description, base_price, duration_minutes, visible')
      .eq('tenant_id', tenantId)
      .eq('visible', true)
      .order('name');
    
    if (error) throw error;
    return NextResponse.json({ ok: true, services: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}