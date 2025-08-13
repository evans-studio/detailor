import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const schema = z.object({
  report: z.enum(['revenue','services','clv','staff','funnel']),
  cadence: z.enum(['daily','weekly','monthly']),
  to: z.string().email(),
});

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    if (profile.role !== 'admin') return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Admin only', undefined, 403);
    const body = schema.parse(await req.json());
    // Store schedule in tenant settings for cron to pick up (simple approach)
    const key = `report_${body.report}_${body.cadence}`;
    const { data: tenant } = await admin.from('tenants').select('business_prefs').eq('id', profile.tenant_id).single();
    const prefs = (tenant?.business_prefs as Record<string, unknown>) || {};
    prefs[key] = { to: body.to, enabled: true, updated_at: new Date().toISOString() };
    await admin.from('tenants').update({ business_prefs: prefs }).eq('id', profile.tenant_id);
    return createSuccessResponse({ saved: true });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/analytics/schedule-email' }, 400);
  }
}


