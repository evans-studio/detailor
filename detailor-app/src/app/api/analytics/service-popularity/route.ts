import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    const url = new URL(req.url);
    const from = url.searchParams.get('from');
    const to = url.searchParams.get('to');
    let q = admin.from('bookings').select('service_id, price_breakdown, created_at').eq('tenant_id', profile.tenant_id);
    if (from) q = q.gte('created_at', from);
    if (to) q = q.lte('created_at', to);
    const { data: bookings } = await q;
    const { data: services } = await admin.from('services').select('id, name').eq('tenant_id', profile.tenant_id);
    const idToName = new Map<string, string>((services || []).map((s: any) => [s.id as string, String(s.name)]));
    const map = new Map<string, { service_id: string; service: string; bookings: number; revenue: number }>();
    for (const b of bookings || []) {
      const sid = (b as any).service_id as string;
      const key = sid || 'unknown';
      if (!map.has(key)) map.set(key, { service_id: sid, service: idToName.get(sid) || 'Unknown', bookings: 0, revenue: 0 });
      const row = map.get(key)!;
      row.bookings += 1;
      const total = Number(((b as any).price_breakdown?.total) ?? 0);
      row.revenue += isFinite(total) ? total : 0;
    }
    const result = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue);
    return createSuccessResponse({ services: result });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/analytics/service-popularity' }, 400);
  }
}


