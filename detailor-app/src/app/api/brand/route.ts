import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenant_id') || req.headers.get('x-tenant-id') || '';
    // Default palette
    const res = await fetch('/src/styles/palettes/master.json');
    const base = await res.json();

    if (!tenantId) {
      return NextResponse.json({ ok: true, palette: base });
    }

    const admin = getSupabaseAdmin();
    const { data: tenant, error } = await admin
      .from('tenants')
      .select('brand_theme')
      .eq('id', tenantId)
      .single();
    if (error || !tenant) return NextResponse.json({ ok: true, palette: base });

    // Merge brand_theme over base palette (shallow)
    const merged: Record<string, unknown> = { ...base };
    if (tenant.brand_theme && typeof tenant.brand_theme === 'object') {
      for (const [k, v] of Object.entries(tenant.brand_theme as Record<string, unknown>)) {
        if (v && typeof v === 'object' && k in merged) {
          const existing = merged[k] as Record<string, unknown>;
          merged[k] = { ...existing, ...(v as Record<string, unknown>) };
        } else {
          merged[k] = v;
        }
      }
    }
    return NextResponse.json({ ok: true, palette: merged });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


