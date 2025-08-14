import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';

export async function GET(req: Request) {
  try {
    const admin = getSupabaseAdmin();
    // Try authenticated path first
    try {
      const { user } = await getUserFromRequest(req);
      const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
      if (profile?.tenant_id) {
        const { data: tenant, error } = await admin
          .from('tenants')
          .select('id, trading_name, is_demo, stripe_public_key')
          .eq('id', profile.tenant_id)
          .single();
        if (error) {
          return createErrorResponse(API_ERROR_CODES.DATABASE_ERROR, 'Failed to fetch tenant information', { db_error: error.message }, 500);
        }
        return createSuccessResponse({ id: tenant?.id, trading_name: tenant?.trading_name, is_demo: tenant?.is_demo, stripe_public_key: tenant?.stripe_public_key });
      }
    } catch {}

    // Fallback: derive tenant from header or cookie for realtime bootstrap
    const url = new URL(req.url);
    const headerTenant = req.headers.get('x-tenant-id') || url.searchParams.get('tenant_id') || '';
    let cookieTenant = '';
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.split('; ').find((c) => c.startsWith('df-tenant='));
    if (match) cookieTenant = decodeURIComponent(match.split('=')[1] || '');
    const tenantId = headerTenant || cookieTenant;
    if (!tenantId) {
      return createErrorResponse(API_ERROR_CODES.UNAUTHORIZED, 'Unauthorized', { hint: 'Missing session; supply x-tenant-id header for bootstrap' }, 401);
    }
    const { data: tenant, error } = await admin
      .from('tenants')
      .select('id, trading_name, is_demo, stripe_public_key')
      .eq('id', tenantId)
      .single();
    if (error || !tenant) {
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Tenant not found', { tenant_id: tenantId }, 404);
    }
    return createSuccessResponse({ id: tenant.id, trading_name: tenant.trading_name, is_demo: tenant.is_demo, stripe_public_key: tenant.stripe_public_key });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/tenant/me' }, 500);
  }
}


