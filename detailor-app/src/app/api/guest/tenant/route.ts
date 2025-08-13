export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Get tenant info for guest users
export async function GET(req: Request) {
  try {
    const admin = getSupabaseAdmin();
    const url = new URL(req.url);
    const domain = url.searchParams.get('domain') || req.headers.get('host');
    
    if (!domain) {
      return createErrorResponse(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 'domain required in URL parameter or host header', { field: 'domain' }, 400);
    }

    // For now, return the first active tenant (MVP approach)
    // In production, this would map domains to tenants
    const { data: tenant } = await admin
      .from('tenants')
      .select('id, legal_name, trading_name, status, brand_theme')
      .eq('status', 'active')
      .limit(1)
      .single();
    
    if (!tenant) {
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No active tenant found', undefined, 404);
    }

    return createSuccessResponse({ 
      tenant: {
        id: tenant.id,
        name: tenant.trading_name || tenant.legal_name,
        brand: tenant.brand_theme
      }
    });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'GET /api/guest/tenant' }, 400);
  }
}