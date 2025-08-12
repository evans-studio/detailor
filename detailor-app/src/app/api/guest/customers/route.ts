export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sanitizeText, sanitizeEmail, sanitizePhone, checkRateLimit, isValidUuid } from '@/lib/security';

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  tenant_id: z.string().uuid(),
});

// Guest customer creation - requires tenant_id in body or header
export async function POST(req: Request) {
  try {
    // Rate limiting for guest requests (more restrictive)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(`guest-customer-${ip}`, 5, 60000)) {
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
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
      throw new Error('Invalid tenant ID format');
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
    };
    
    // Validate sanitized inputs
    if (!sanitizedPayload.name) {
      throw new Error('Invalid name provided');
    }
    
    if (!sanitizedPayload.email) {
      throw new Error('Invalid email format');
    }
    
    if (payload.phone && !sanitizedPayload.phone) {
      throw new Error('Invalid phone number format');
    }

    // Verify the tenant exists and is active
    const { data: tenant } = await admin
      .from('tenants')
      .select('id, status')
      .eq('id', sanitizedPayload.tenant_id)
      .single();
    
    if (!tenant || tenant.status !== 'active') {
      throw new Error('Invalid or inactive tenant');
    }

    // Create guest customer
    const { data, error } = await admin
      .from('customers')
      .insert(sanitizedPayload)
      .select('*')
      .single();
    
    if (error) throw error;
    return NextResponse.json({ ok: true, customer: data });
  } catch (error: unknown) {
    return NextResponse.json({ ok: false, error: (error as Error).message }, { status: 400 });
  }
}