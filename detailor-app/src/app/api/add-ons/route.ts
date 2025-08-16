import { NextRequest } from 'next/server';
import { getSupabaseAdmin as getSbAdmin } from '@/lib/supabaseAdmin';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const serviceId = req.nextUrl.searchParams.get('service_id') || '';
    const tenantId = req.nextUrl.searchParams.get('tenant_id') || '';
    if (!tenantId) {
      return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'tenant_id is required', undefined, 400);
    }
    const supabase = getSbAdmin();
    if (!serviceId) {
      // Return all add-ons for tenant
      const { data, error } = await supabase
        .from('add_ons')
        .select('id,name,description,price_delta,duration_delta_min,compatibility,category')
        .eq('tenant_id', tenantId)
        .order('name');
      if (error) throw error;
      return createSuccessResponse({ add_ons: data || [] });
    }
    // Join service_addons
    const { data, error } = await supabase
      .from('service_addons')
      .select('addon:add_ons(id,name,description,price_delta,duration_delta_min,compatibility,category)')
      .eq('service_id', serviceId);
    if (error) throw error;
    const addOns = (data || []).map((row: any) => row.addon).filter(Boolean);
    return createSuccessResponse({ add_ons: addOns });
  } catch (e) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/add-ons' }, 500);
  }
}


