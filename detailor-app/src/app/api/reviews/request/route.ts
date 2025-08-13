import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import { sendTestEmail } from '@/lib/email';
import { sendTenantSMS } from '@/lib/messaging-sms';

const schema = z.object({ booking_id: z.string().uuid(), channel: z.enum(['email','sms']).default('email') });

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const body = schema.parse(await req.json());
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    const { data: booking } = await admin.from('bookings').select('id, tenant_id, customer_id').eq('id', body.booking_id).eq('tenant_id', profile.tenant_id).single();
    if (!booking) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Booking not found', undefined, 404);
    const { data: customer } = await admin.from('customers').select('email, phone, name').eq('id', booking.customer_id).single();
    const { data: tenant } = await admin.from('tenants').select('trading_name, homepage_content').eq('id', profile.tenant_id).single();
    const googleUrl = (tenant?.homepage_content as any)?.google_reviews_url || '';
    const leaveUrl = googleUrl || 'https://g.page/r';
    const msg = `Hi ${customer?.name || ''}, thanks for your booking! Would you mind leaving us a quick review? ${leaveUrl}`.trim();
    if (body.channel === 'sms') {
      if (!customer?.phone) return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'No phone on file', undefined, 400);
      await sendTenantSMS({ tenantId: profile.tenant_id, to: customer.phone, body: msg, templateKey: 'review_request', customerId: booking.customer_id as string, bookingId: booking.id as string }).catch(() => {});
    } else {
      if (!customer?.email) return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'No email on file', undefined, 400);
      await sendTestEmail(customer.email).catch(() => {});
    }
    await admin.from('messages').insert({ tenant_id: profile.tenant_id, booking_id: booking.id, customer_id: booking.customer_id, channel: body.channel, direction: 'outbound', status: 'sent', template_key: 'review_request', body: msg });
    return createSuccessResponse({ sent: true });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/reviews/request' }, 400);
  }
}


