import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const payloadSchema = z.object({
  homepage_template: z.enum(['professional-clean','service-focused','local-expert']).optional(),
  homepage_published: z.boolean().optional(),
  homepage_content: z.record(z.string(), z.unknown()).optional(),
  brand_settings: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Only admin can fetch homepage settings', undefined, 403);
    }
    const { data, error } = await admin
      .from('tenants')
      .select('id, legal_name, trading_name, homepage_template, homepage_published, homepage_content, brand_settings, plan_id, feature_flags')
      .eq('id', profile.tenant_id)
      .single();
    if (error) throw error;
    return createSuccessResponse({ tenant: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/website/homepage' }, 400);
  }
}

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = payloadSchema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Only admin can update homepage settings', undefined, 403);
    }
    const { data, error } = await admin
      .from('tenants')
      .update(payload)
      .eq('id', profile.tenant_id)
      .select('id, legal_name, trading_name, homepage_template, homepage_published, homepage_content, brand_settings')
      .single();
    if (error) throw error;
    return createSuccessResponse({ tenant: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'PATCH /api/website/homepage' }, 400);
  }
}


