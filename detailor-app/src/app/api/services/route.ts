import { NextRequest } from 'next/server';
import { getSupabaseAdmin as getSbAdmin } from '@/lib/supabaseAdmin';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenant_id') || '';
    if (!tenantId) {
      return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'tenant_id is required', undefined, 400);
    }
    const supabase = getSbAdmin();
    const { data, error } = await supabase
      .from('services')
      .select('id,name,description,base_price,base_duration_min,category,visible')
      .eq('tenant_id', tenantId)
      .eq('visible', true)
      .order('name');
    if (error) throw error;
    return createSuccessResponse({ services: data || [] });
  } catch (e) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/services' }, 500);
  }
}

import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    // Try derive tenant via profile first
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    let tenantId = profile?.tenant_id as string | undefined;
    if (!tenantId) {
      // Fallback: derive via customers table
      const { data: cust } = await admin.from('customers').select('tenant_id').eq('auth_user_id', user.id).single();
      tenantId = cust?.tenant_id as string | undefined;
    }
    
    if (!tenantId) {
      return createErrorResponse(
        API_ERROR_CODES.FORBIDDEN,
        'No tenant context found',
        { hint: 'User must be associated with a tenant via profile or customer record' },
        403
      );
    }
    
    const { data, error } = await admin.from('services').select('*').eq('tenant_id', tenantId).order('name');
    
    if (error) {
      return createErrorResponse(
        API_ERROR_CODES.DATABASE_ERROR,
        'Failed to fetch services',
        { db_error: error.message },
        500
      );
    }
    
    return createSuccessResponse(data);
  } catch (e: unknown) {
    return createErrorResponse(
      API_ERROR_CODES.INTERNAL_ERROR,
      (e as Error).message,
      { endpoint: 'GET /api/services' },
      400
    );
  }
}


