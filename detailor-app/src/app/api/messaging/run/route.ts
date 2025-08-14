export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendTenantEmail } from '@/lib/messaging';

type MessagingRules = {
  booking_reminder_hours_before?: number;
  invoice_payment_reminder_days_after?: number;
  post_service_followup_days_after?: number;
  enabled?: boolean;
};

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['admin','staff','super_admin'].includes(profile.role)) {
      return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Insufficient permissions', undefined, 403);
    }
    const now = new Date();
    const { data: tenantRow } = await admin.from('tenants').select('id, trading_name, business_prefs').eq('id', profile.tenant_id).single();
    if (!tenantRow) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Tenant not found', undefined, 404);
    const rules = ((tenantRow.business_prefs as Record<string, unknown>)?.['messaging_rules'] || {}) as MessagingRules;
    if (rules.enabled === false) return createSuccessResponse({ processed: 0, skipped: 'disabled' });

    const tenantId = tenantRow.id as string;
    const tenantName = (tenantRow.trading_name as string) || 'Detailor';
    let processed = 0;

    // 1) Booking reminders (e.g., 24h before)
    const hoursBefore = Math.max(0, Number(rules.booking_reminder_hours_before ?? 24));
    if (hoursBefore > 0) {
      const windowStart = new Date(now.getTime() + (hoursBefore * 60 - 5) * 60 * 1000).toISOString();
      const windowEnd = new Date(now.getTime() + (hoursBefore * 60 + 5) * 60 * 1000).toISOString();
      const { data: dueBookings } = await admin
        .from('bookings')
        .select('id, customer_id, start_at, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'confirmed')
        .gte('start_at', windowStart)
        .lte('start_at', windowEnd);
      for (const b of dueBookings || []) {
        const idem = `booking-reminder-${b.id}`;
        const { data: existing } = await admin.from('messages').select('id').eq('tenant_id', tenantId).eq('idempotency_key', idem).maybeSingle();
        if (existing?.id) continue;
        const { data: cust } = await admin.from('customers').select('email,name').eq('id', b.customer_id).maybeSingle();
        if (!cust?.email) continue;
        try {
          await sendTenantEmail({
            tenantId,
            to: cust.email,
            subject: `${tenantName}: Upcoming booking reminder`,
            html: `<p>Hi ${cust.name || 'there'},</p><p>This is a reminder for your booking on ${new Date(b.start_at as string).toLocaleString()}.</p><p>We look forward to seeing you!</p><p>${tenantName}</p>`,
            bookingId: b.id,
            customerId: b.customer_id as string,
            idempotencyKey: idem,
          });
          processed++;
        } catch {}
      }
    }

    // 2) Invoice payment reminders (e.g., 3 days after issue if unpaid)
    const daysAfter = Math.max(0, Number(rules.invoice_payment_reminder_days_after ?? 3));
    if (daysAfter > 0) {
      const olderThan = new Date(now.getTime() - daysAfter * 24 * 60 * 60 * 1000).toISOString();
      const { data: invs } = await admin
        .from('invoices')
        .select('id, booking_id, total, paid_amount, created_at')
        .eq('tenant_id', tenantId)
        .gt('total', 0)
        .lt('paid_amount', 'total')
        .lte('created_at', olderThan);
      for (const inv of invs || []) {
        const idem = `invoice-reminder-${inv.id}-${daysAfter}`;
        const { data: existing } = await admin.from('messages').select('id').eq('tenant_id', tenantId).eq('idempotency_key', idem).maybeSingle();
        if (existing?.id) continue;
        if (!inv.booking_id) continue;
        const { data: booking } = await admin.from('bookings').select('customer_id').eq('id', inv.booking_id).maybeSingle();
        const { data: cust } = await admin.from('customers').select('email,name').eq('id', booking?.customer_id).maybeSingle();
        if (!cust?.email) continue;
        const balance = Math.max(0, Number(inv.total || 0) - Number(inv.paid_amount || 0)).toFixed(2);
        try {
          await sendTenantEmail({
            tenantId,
            to: cust.email,
            subject: `${tenantName}: Invoice reminder`,
            html: `<p>Hi ${cust.name || 'there'},</p><p>This is a friendly reminder that £${balance} remains outstanding on your invoice.</p><p>Thank you,<br>${tenantName}</p>`,
            bookingId: inv.booking_id as string,
            customerId: booking?.customer_id as string,
            idempotencyKey: idem,
          });
          processed++;
        } catch {}
      }
    }

    // 3) Post-service follow-up (e.g., 2 days after completion)
    const followDays = Math.max(0, Number(rules.post_service_followup_days_after ?? 2));
    if (followDays > 0) {
      const olderThan = new Date(now.getTime() - followDays * 24 * 60 * 60 * 1000).toISOString();
      const { data: doneBookings } = await admin
        .from('bookings')
        .select('id, customer_id, end_at, status')
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .lte('end_at', olderThan);
      for (const b of doneBookings || []) {
        const idem = `post-service-${b.id}-${followDays}`;
        const { data: existing } = await admin.from('messages').select('id').eq('tenant_id', tenantId).eq('idempotency_key', idem).maybeSingle();
        if (existing?.id) continue;
        const { data: cust } = await admin.from('customers').select('email,name').eq('id', b.customer_id).maybeSingle();
        if (!cust?.email) continue;
        try {
          await sendTenantEmail({
            tenantId,
            to: cust.email,
            subject: `${tenantName}: Thanks for your business`,
            html: `<p>Hi ${cust.name || 'there'},</p><p>Thanks for choosing ${tenantName}. We hope you loved your service. If you have a moment, we'd appreciate a review.</p>`,
            bookingId: b.id,
            customerId: b.customer_id as string,
            idempotencyKey: idem,
          });
          processed++;
        } catch {}
      }
    }

    return createSuccessResponse({ processed });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/messaging/run' }, 400);
  }
}


