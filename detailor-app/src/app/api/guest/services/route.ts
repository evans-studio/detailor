export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Public services endpoint for guest booking flow
export async function GET(req: Request) {
  try {
    const admin = getSupabaseAdmin();
    const url = new URL(req.url);
    
    // Get tenant_id from URL param or header
    const tenantId = url.searchParams.get('tenant_id') || req.headers.get('x-tenant-id');
    
    if (!tenantId) {
      return createErrorResponse(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 'tenant_id required in URL parameter or x-tenant-id header', { field: 'tenant_id' }, 400);
    }

    // Verify the tenant exists and is active
    const { data: tenant } = await admin
      .from('tenants')
      .select('id, status')
      .eq('id', tenantId)
      .single();
    
    if (!tenant || tenant.status !== 'active') {
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Invalid or inactive tenant', { tenant_id: tenantId }, 404);
    }

    // Get active services for the tenant
    const { data, error } = await admin
      .from('services')
      .select('id, name, description, base_price, duration_minutes, visible')
      .eq('tenant_id', tenantId)
      .eq('visible', true)
      .order('name');
    
    if (error) throw error;
    return createSuccessResponse({ services: data });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'GET /api/guest/services' }, 400);
  }
}