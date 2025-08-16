import { NextRequest } from 'next/server';
import { getSupabaseAdmin as getSbAdmin } from '@/lib/supabaseAdmin';
import { createSuccessResponse as success, createErrorResponse as failure, API_ERROR_CODES as CODES } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const tenantId = req.nextUrl.searchParams.get('tenant_id') || '';
    if (!tenantId) {
      return failure(CODES.INVALID_INPUT, 'tenant_id is required', undefined, 400);
    }
    const supabase = getSbAdmin();
    const { data, error } = await supabase
      .from('services')
      .select('id,name,description,base_price,base_duration_min,category,visible')
      .eq('tenant_id', tenantId)
      .eq('visible', true)
      .order('name');
    if (error) throw error;
    return success({ services: data || [] });
  } catch (e) {
    return failure(CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/services' }, 500);
  }
}

// Note: legacy GET handler removed to prevent duplicate export collisions with Sentry wrapping


