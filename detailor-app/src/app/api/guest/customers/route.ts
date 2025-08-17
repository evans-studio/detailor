export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeText, sanitizeEmail, sanitizePhone, checkRateLimit, isValidUuid } from '@/lib/security';

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  tenant_id: z.string().uuid(),
  marketing_consent: z.boolean().optional(),
});

// Guest customer creation - requires tenant_id in body or header
export async function POST(req: Request) {
  try {
    // Rate limiting for guest requests (more restrictive)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`guest-customer-${ip}`, 5, 60000)) {
      return createErrorResponse(API_ERROR_CODES.RATE_LIMITED, 'Rate limit exceeded. Please try again later.', undefined, 429);
    }
    
    const admin = getSupabaseAdmin();
    const body = await req.json();
    
    // Get tenant_id from body, URL param, or header
    const url = new URL(req.url);
    const tenantIdFromParam = url.searchParams.get('tenant_id');
    const tenantIdFromHeader = req.headers.get('x-tenant-id');
    
    const rawTenantId = body.tenant_id || tenantIdFromParam || tenantIdFromHeader;
    
    // Validate tenant_id format
    if (!rawTenantId || !isValidUuid(rawTenantId)) {
      return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'Invalid tenant ID format', { field: 'tenant_id' }, 400);
    }
    
    const payload = createSchema.parse({
      ...body,
      tenant_id: rawTenantId
    });

    // Sanitize inputs
    const sanitizedPayload = {
      tenant_id: payload.tenant_id, // Already validated as UUID
      name: sanitizeText(payload.name),
      email: sanitizeEmail(payload.email),
      phone: payload.phone ? sanitizePhone(payload.phone) : undefined,
      consents: payload.marketing_consent ? { marketing: true } : undefined,
    };
    
    // Validate sanitized inputs
    if (!sanitizedPayload.name) {
      return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'Invalid name provided', { field: 'name' }, 400);
    }
    
    if (!sanitizedPayload.email) {
      return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'Invalid email format', { field: 'email' }, 400);
    }
    
    if (payload.phone && !sanitizedPayload.phone) {
      return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'Invalid phone number format', { field: 'phone' }, 400);
    }

    // Verify the tenant exists and is active
    const { data: tenant } = await admin
      .from('tenants')
      .select('id, status')
      .eq('id', sanitizedPayload.tenant_id)
      .single();
    
    if (!tenant || tenant.status !== 'active') {
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Invalid or inactive tenant', { tenant_id: sanitizedPayload.tenant_id }, 404);
    }

    // Create guest customer
    const { data, error } = await admin
      .from('customers')
      .insert(sanitizedPayload)
      .select('*')
      .single();
    
    if (error) throw error;
    return createSuccessResponse({ customer: data });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'POST /api/guest/customers' }, 400);
  }
}