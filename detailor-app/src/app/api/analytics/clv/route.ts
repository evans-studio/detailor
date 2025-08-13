import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    const { data: customers } = await admin.from('customers').select('id, name, ltv').eq('tenant_id', profile.tenant_id);
    // Fallback compute CLV if missing using payments aggregate
    const missing = (customers || []).filter((c: any) => !c.ltv || Number(c.ltv) === 0).map((c: any) => c.id);
    let idToLtv = new Map<string, number>();
    if (missing.length > 0) {
      const { data: bookings } = await admin.from('bookings').select('customer_id, price_breakdown').eq('tenant_id', profile.tenant_id);
      const acc = new Map<string, number>();
      for (const b of bookings || []) {
        const cid = (b as any).customer_id as string;
        const total = Number(((b as any).price_breakdown?.total) ?? 0) || 0;
        acc.set(cid, (acc.get(cid) || 0) + total);
      }
      idToLtv = acc;
    }
    const result = (customers || []).map((c: any) => ({ id: c.id, name: c.name, ltv: Number(c.ltv) || idToLtv.get(c.id) || 0 })).sort((a, b) => b.ltv - a.ltv);
    return createSuccessResponse({ customers: result });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/analytics/clv' }, 400);
  }
}


