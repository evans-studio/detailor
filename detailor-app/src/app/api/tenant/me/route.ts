import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    
    if (!profile) {
      return createErrorResponse(
        API_ERROR_CODES.RECORD_NOT_FOUND,
        'No profile found for user',
        { user_id: user.id },
        404
      );
    }
    
    const { data: tenant, error } = await admin
      .from('tenants')
      .select('id, trading_name, is_demo, stripe_public_key')
      .eq('id', profile.tenant_id)
      .single();
      
    if (error) {
      return createErrorResponse(
        API_ERROR_CODES.DATABASE_ERROR,
        'Failed to fetch tenant information',
        { db_error: error.message },
        500
      );
    }
    
    return createSuccessResponse(tenant ?? null);
  } catch (e: unknown) {
    return createErrorResponse(
      API_ERROR_CODES.INTERNAL_ERROR,
      (e as Error).message,
      { endpoint: 'GET /api/tenant/me' },
      400
    );
  }
}


