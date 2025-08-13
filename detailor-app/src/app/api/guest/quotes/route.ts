export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const quoteSchema = z.object({
  customer_id: z.string().uuid(),
  service_id: z.string().uuid(),
  addon_ids: z.array(z.string().uuid()).optional(),
  vehicle_size_tier: z.string().optional(),
});

// Guest quote endpoint
export async function POST(req: Request) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = quoteSchema.parse(body);
    const addonIds = payload.addon_ids ?? [];

    // Get tenant ID from customer
    const { data: customer } = await admin
      .from('customers')
      .select('tenant_id')
      .eq('id', payload.customer_id)
      .single();
    
    if (!customer) {
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Customer not found', { customer_id: payload.customer_id }, 404);
    }
    
    const tenantId = customer.tenant_id;

    // Get service details
    const { data: svc } = await admin
      .from('services')
      .select('*')
      .eq('id', payload.service_id)
      .eq('tenant_id', tenantId)
      .single();
    
    if (!svc) {
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Service not found', { service_id: payload.service_id }, 404);
    }

    // Get add-ons if any
    let addonsTotal = 0;
    if (addonIds.length) {
      const { data: addons } = await admin
        .from('add_ons')
        .select('*')
        .in('id', addonIds)
        .eq('tenant_id', tenantId);
      addonsTotal = (addons || []).reduce((sum, a) => sum + Number(a.price_delta || 0), 0);
    }

    // Get pricing config
    const { data: pricing } = await admin
      .from('pricing_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();
    
    const taxRate = Number(pricing?.tax?.rate ?? 0);
    const basePrice = Number(svc.base_price) + addonsTotal;
    const tax = Math.round(basePrice * taxRate * 100) / 100;
    const total = Math.round((basePrice + tax) * 100) / 100;
    
    const price_breakdown = {
      base: Number(svc.base_price),
      addons: addonsTotal,
      taxRate,
      tax,
      total
    };

    return createSuccessResponse({ quote: { price_breakdown } });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'POST /api/guest/quotes' }, 400);
  }
}