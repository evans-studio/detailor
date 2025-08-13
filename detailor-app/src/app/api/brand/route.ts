import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Detailor Default Brand Palette
const DEFAULT_DETAILOR_PALETTE = {
  name: "Detailor",
  brand: {
    primary: "#3B82F6",
    "primary-foreground": "#FFFFFF",
    secondary: "#10B981",
    "secondary-foreground": "#FFFFFF"
  },
  neutrals: {
    bg: "#F9FAFB",
    surface: "#FFFFFF",
    border: "#E5E7EB",
    muted: "#F3F4F6",
    "muted-foreground": "#6B7280"
  },
  text: {
    text: "#1F2937",
    "text-muted": "#6B7280",
    "inverse-text": "#FFFFFF"
  },
  status: {
    success: "#10B981",
    "success-foreground": "#FFFFFF",
    warning: "#F59E0B",
    "warning-foreground": "#FFFFFF",
    error: "#EF4444",
    "error-foreground": "#FFFFFF",
    info: "#3B82F6",
    "info-foreground": "#FFFFFF"
  },
  states: {
    "focus-ring": "#3B82F6",
    selection: "#DBEAFE",
    "hover-surface": "#F9FAFB"
  }
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const tenantId = url.searchParams.get('tenant_id') || req.headers.get('x-tenant-id') || '';
    
    // Use default Detailor palette as base
    const base = DEFAULT_DETAILOR_PALETTE;

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


