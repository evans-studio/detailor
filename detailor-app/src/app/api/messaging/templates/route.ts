import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const createSchema = z.object({
  key: z.string().min(1),
  channel: z.enum(['email','sms','whatsapp']).default('email'),
  subject: z.string().optional(),
  body_html: z.string().optional(),
  body_text: z.string().optional(),
  active: z.boolean().optional(),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['admin','staff'].includes(profile.role)) {
      return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Insufficient permissions', { required_roles: ['admin','staff'] }, 403);
    }
    const { data, error } = await admin.from('message_templates').select('*').eq('tenant_id', profile.tenant_id).order('updated_at', { ascending: false });
    if (error) throw error;
    return createSuccessResponse({ templates: data || [] });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/messaging/templates' }, 400);
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = createSchema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Only admin can create message templates', undefined, 403);
    }
    const { data, error } = await admin.from('message_templates').insert({ tenant_id: profile.tenant_id, ...payload }).select('*').single();
    if (error) throw error;
    return createSuccessResponse({ template: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/messaging/templates' }, 400);
  }
}


