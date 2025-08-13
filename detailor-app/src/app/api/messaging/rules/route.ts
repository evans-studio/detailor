import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({
  booking_reminder_hours_before: z.number().int().min(0).max(168).default(24),
  invoice_payment_reminder_days_after: z.number().int().min(0).max(60).default(3),
  post_service_followup_days_after: z.number().int().min(0).max(60).default(2),
  enabled: z.boolean().default(true),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff','admin'].includes(profile.role)) {
      return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Insufficient permissions', { required_roles: ['staff','admin'] }, 403);
    }
    const { data: tenant } = await admin
      .from('tenants')
      .select('business_prefs')
      .eq('id', profile.tenant_id)
      .single();
    const rules = (tenant?.business_prefs as Record<string, unknown> | null)?.['messaging_rules'] as Record<string, unknown> | undefined;
    return createSuccessResponse({ rules: rules || {} });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/messaging/rules' }, 400);
  }
}

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const incoming = await req.json();
    const payload = schema.partial().parse(incoming);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Only admin can update messaging rules', undefined, 403);
    }
    const { data: tenant } = await admin.from('tenants').select('business_prefs').eq('id', profile.tenant_id).single();
    const prefs = (tenant?.business_prefs as Record<string, unknown>) || {};
    const merged = { ...(prefs['messaging_rules'] as Record<string, unknown> || {}), ...payload };
    const next = { ...prefs, messaging_rules: merged } as Record<string, unknown>;
    await admin.from('tenants').update({ business_prefs: next }).eq('id', profile.tenant_id);
    return createSuccessResponse({ rules: merged });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'PATCH /api/messaging/rules' }, 400);
  }
}


