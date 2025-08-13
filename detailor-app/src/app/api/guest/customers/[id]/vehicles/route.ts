export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const createSchema = z.object({
  make: z.string().min(1),
  model: z.string().min(1),
  year: z.string().optional(),
  colour: z.string().optional(),
  size_tier: z.string().optional(),
});

// Guest vehicle creation endpoint
export async function POST(req: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = createSchema.parse(body);
    const params = await context.params;
    const customerId = params.id;

    // Verify the customer exists and get tenant context
    const { data: customer } = await admin
      .from('customers')
      .select('id, tenant_id')
      .eq('id', customerId)
      .single();
    
    if (!customer) {
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Customer not found', { customer_id: customerId }, 404);
    }

    // Create vehicle for the customer
    const { data, error } = await admin
      .from('vehicles')
      .insert({
        tenant_id: customer.tenant_id,
        customer_id: customerId,
        make: payload.make,
        model: payload.model,
        year: payload.year,
        colour: payload.colour,
        size_tier: payload.size_tier || 'M',
      })
      .select('*')
      .single();
    
    if (error) throw error;
    return createSuccessResponse({ vehicle: data });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'POST /api/guest/customers/[id]/vehicles' }, 400);
  }
}