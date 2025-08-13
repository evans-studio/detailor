import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({ invoice_id: z.string().uuid(), amount: z.number().positive().optional() });

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const { invoice_id, amount } = schema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['admin','staff'].includes(profile.role)) {
      return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Insufficient permissions', { required_roles: ['admin','staff'] }, 403);
    }
    const { data: tenant } = await admin.from('tenants').select('is_demo').eq('id', profile.tenant_id).single();
    if (!tenant?.is_demo) {
      return createErrorResponse(API_ERROR_CODES.FEATURE_NOT_AVAILABLE, 'Demo-only endpoint', undefined, 403);
    }
    const { data: invoice } = await admin.from('invoices').select('*').eq('id', invoice_id).eq('tenant_id', profile.tenant_id).single();
    if (!invoice) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Invoice not found', { invoice_id }, 404);
    const amt = amount ?? Number(invoice.balance ?? 0);
    const newPaid = Number(invoice.paid_amount ?? 0) + amt;
    const newBalance = Math.max(0, Number(invoice.total ?? 0) - newPaid);
    const { error } = await admin.from('invoices').update({ paid_amount: newPaid, balance: newBalance }).eq('id', invoice_id).eq('tenant_id', profile.tenant_id);
    if (error) throw error;
    // Create a payment ledger row for audit
    await admin.from('payments').insert({
      tenant_id: profile.tenant_id,
      booking_id: invoice.booking_id ?? null,
      invoice_id: invoice.id,
      provider: 'cash',
      amount: amt,
      currency: 'GBP',
      status: 'succeeded',
    });
    // If linked to a booking, mark paid for UX consistency
    if (invoice.booking_id) {
      await admin
        .from('bookings')
        .update({ payment_status: 'paid' })
        .eq('id', invoice.booking_id)
        .eq('tenant_id', profile.tenant_id);
    }
    return createSuccessResponse({});
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/payments/mark-paid' }, 400);
  }
}


