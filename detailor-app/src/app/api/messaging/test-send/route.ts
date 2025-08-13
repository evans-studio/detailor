import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({ to: z.string(), template_id: z.string().uuid().optional(), channel: z.enum(['email','sms']).default('email') });

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { to, channel } = schema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || profile.role !== 'admin') {
      return createErrorResponse(API_ERROR_CODES.ADMIN_ONLY, 'Only admin can send test messages', undefined, 403);
    }
    const { data: tenant } = await admin.from('tenants').select('is_demo').eq('id', profile.tenant_id).single();
    if (tenant?.is_demo) {
      return createErrorResponse(API_ERROR_CODES.FEATURE_NOT_AVAILABLE, 'Test send disabled in demo.', undefined, 400);
    }
    // In non-demo, call providers
    if (channel === 'sms') {
      const { sendTenantSMS } = await import('@/lib/messaging-sms');
      const res = await sendTenantSMS({ tenantId: profile.tenant_id, to, body: 'Test SMS from Detailor' });
      return createSuccessResponse(res);
    }
    const { sendTestEmail } = await import('@/lib/email');
    const ok = await sendTestEmail(to);
    return createSuccessResponse({ ok });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/messaging/test-send' }, 400);
  }
}


