import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendTenantEmail } from '@/lib/messaging';
import { sendTenantSMS } from '@/lib/messaging-sms';
import { checkRateLimit, sanitizeEmail } from '@/lib/security';

const channelSchema = z.enum(['email','sms']);

const schema = z.object({
  to: z.string().email(),
  subject: z.string().min(1),
  html: z.string().optional(),
  text: z.string().optional(),
  template_key: z.string().optional(),
  booking_id: z.string().uuid().optional(),
  customer_id: z.string().uuid().optional(),
  idempotency_key: z.string().optional(),
  channel: channelSchema.default('email'),
});

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`msg-${user.id}-${ip}`, 60, 60000)) {
      return createErrorResponse(API_ERROR_CODES.RATE_LIMITED, 'Too many requests', { window: '1m', limit: 60 }, 429);
    }
    const payload = schema.parse(await req.json());
    const safeTo = sanitizeEmail(payload.to);
    if (!safeTo) {
      return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'Invalid recipient', { field: 'to' }, 400);
    }
    const { data: profile } = await admin.from('profiles').select('tenant_id, role, email').eq('id', user.id).single();
    if (!profile || !['staff','admin'].includes(profile.role)) {
      return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Insufficient permissions', { required_roles: ['staff','admin'] }, 403);
    }
    // Enforce SMS/email messaging limits: if using email only, bypass; if SMS enabled, check credits
    const { data: tenant } = await admin.from('tenants').select('feature_flags').eq('id', profile.tenant_id).single();
    const ff = (tenant?.feature_flags as Record<string, unknown>) || {};
    // SMS credit enforcement
    if (payload.channel === 'sms' && (ff.sms_notifications === true || ff.sms_notifications === 'addon')) {
      const credits = Number(ff.sms_credits || 0);
      if (credits <= 0) {
        return createErrorResponse(API_ERROR_CODES.LIMIT_EXCEEDED, 'Insufficient SMS credits. Please purchase a pack to continue.', { credits }, 402);
      }
      // Deduct 1 credit up-front to prevent negative balances
      await admin.rpc('increment_tenant_counter', { tenant_id_input: profile.tenant_id, counter_key: 'sms_credits', increment_by: -1 });
    }
    // Demo tenants: route to sink (do not actually send)
    const { data: t } = await admin.from('tenants').select('is_demo').eq('id', profile.tenant_id).single();
    if (t?.is_demo) {
      return createSuccessResponse({ messageId: 'demo-sink' });
    }
    const res = payload.channel === 'sms'
      ? await sendTenantSMS({
          tenantId: profile.tenant_id,
          to: payload.to,
          body: payload.text || payload.html || '',
          templateKey: payload.template_key,
          bookingId: payload.booking_id,
          customerId: payload.customer_id,
          idempotencyKey: payload.idempotency_key,
        })
      : await sendTenantEmail({
          tenantId: profile.tenant_id,
          to: safeTo,
          subject: payload.subject,
          html: payload.html,
          text: payload.text,
          templateKey: payload.template_key,
          bookingId: payload.booking_id,
          customerId: payload.customer_id,
          idempotencyKey: payload.idempotency_key,
        });

    // TODO: when SMS sending is implemented, if provider fails, refund the 1 credit by calling increment_tenant_counter with +1
    return NextResponse.json({ success: true, data: res, meta: { timestamp: new Date().toISOString() } });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/messages/send' }, 400);
  }
}


