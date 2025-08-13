import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const updateSchema = z.object({
  trading_name: z.string().optional(),
  legal_name: z.string().optional(),
  contact_email: z.string().email().optional(),
  brand_theme: z.record(z.string(), z.unknown()).optional(),
  feature_flags: z.record(z.string(), z.unknown()).optional(),
  business_prefs: z.record(z.string(), z.unknown()).optional(),
  plan_id: z.string().optional(),
  reply_to: z.string().email().optional(),
  sender_domain: z.string().optional(),
  stripe_public_key: z.string().optional(),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Only admin can view tenant settings', undefined, 403);
    }
    const { data, error } = await admin
      .from('tenants')
      .select('id, trading_name, legal_name, contact_email, brand_theme, feature_flags, business_prefs, plan_id, reply_to, sender_domain, stripe_public_key, is_demo')
      .eq('id', profile.tenant_id)
      .single();
    if (error) throw error;
    return createSuccessResponse({ tenant: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/settings/tenant' }, 400);
  }
}

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = updateSchema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Only admin can update tenant settings', undefined, 403);
    }
    const { data, error } = await admin
      .from('tenants')
      .update(payload)
      .eq('id', profile.tenant_id)
      .select('*')
      .single();
    if (error) throw error;
    return createSuccessResponse({ tenant: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'PATCH /api/settings/tenant' }, 400);
  }
}


