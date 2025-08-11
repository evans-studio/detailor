export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Get tenant info for guest users
export async function GET(req: Request) {
  try {
    const admin = getSupabaseAdmin();
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain') || req.headers.get('host');
    
    if (!domain) {
      throw new Error('domain required in URL parameter or host header');
    }

    // For now, return the first active tenant (MVP approach)
    // In production, this would map domains to tenants
    const { data: tenant } = await admin
      .from('tenants')
      .select('id, legal_name, trading_name, status, brand_theme')
      .eq('status', 'active')
      .limit(1)
      .single();
    
    if (!tenant) {
      throw new Error('No active tenant found');
    }

    return NextResponse.json({ 
      ok: true, 
      tenant: {
        id: tenant.id,
        name: tenant.trading_name || tenant.legal_name,
        brand: tenant.brand_theme
      }
    });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}