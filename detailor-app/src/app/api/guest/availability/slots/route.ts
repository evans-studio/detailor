export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

// Guest availability slots endpoint
export async function GET(req: Request) {
  try {
    const admin = getSupabaseAdmin();
    const url = new URL(req.url);
    
    // Get tenant_id from URL param or header
    const tenantId = url.searchParams.get('tenant_id') || req.headers.get('x-tenant-id');
    const days = parseInt(url.searchParams.get('days') || '14', 10);
    
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

    // Get available slots - simplified version for now
    // This would normally check work patterns, existing bookings, etc.
    const slots = [];
    const startDate = new Date();
    
    for (let i = 1; i <= days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Skip weekends for now (simplified)
      if (date.getDay() === 0 || date.getDay() === 6) continue;
      
      // Generate morning and afternoon slots
      const morningStart = new Date(date);
      morningStart.setHours(9, 0, 0, 0);
      const morningEnd = new Date(date);
      morningEnd.setHours(11, 0, 0, 0);
      
      const afternoonStart = new Date(date);
      afternoonStart.setHours(14, 0, 0, 0);
      const afternoonEnd = new Date(date);
      afternoonEnd.setHours(16, 0, 0, 0);
      
      slots.push(
        {
          start: morningStart.toISOString(),
          end: morningEnd.toISOString(),
          capacity: 1
        },
        {
          start: afternoonStart.toISOString(),
          end: afternoonEnd.toISOString(),
          capacity: 1
        }
      );
    }
    
    return createSuccessResponse({ slots });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'GET /api/guest/availability/slots' }, 400);
  }
}