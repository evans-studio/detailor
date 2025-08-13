export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    const tenantId = profile.tenant_id as string;
    const { data: tenant } = await admin.from('tenants').select('plan, feature_flags').eq('id', tenantId).single();
    const bookingsLimit = (tenant?.feature_flags as Record<string, unknown> | null | undefined)?.['bookings_limit'] as number | null;
    const overageFee = (tenant?.feature_flags as Record<string, unknown> | null | undefined)?.['overage_fee'] as number | null;
    const buffer = 5; // free overage buffer

    // Current month window
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
    const { data: monthlyBookings } = await admin
      .from('bookings')
      .select('id')
      .eq('tenant_id', tenantId)
      .gte('created_at', monthStart)
      .lt('created_at', monthEnd);
    const used = monthlyBookings?.length || 0;

    const limit = bookingsLimit ?? null;
    const allowed = limit === null ? null : limit + buffer;
    const overUnits = limit === null ? 0 : Math.max(0, used - limit);
    const billableOverUnits = limit === null ? 0 : Math.max(0, used - (limit + buffer));
    const overageAmount = (overageFee ?? 0) * billableOverUnits;
    const warn = limit !== null && used >= Math.floor(limit * 0.8);

    return createSuccessResponse({ usage: { used, limit, allowed, buffer, overUnits, billableOverUnits, overageFee: overageFee ?? 0, overageAmount, warn } });
  } catch (e) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/billing/usage' }, 400);
  }
}


