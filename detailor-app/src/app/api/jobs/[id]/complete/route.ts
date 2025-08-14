import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({ notes: z.string().optional() });

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').slice(-2)[0];
    const body = await req.json();
    const { notes } = schema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role, id').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
    const { data: job } = await admin.from('jobs').select('*').eq('id', id).eq('tenant_id', profile.tenant_id).single();
    if (!job) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Job not found', { id }, 404);
    if (profile.role === 'staff' && job.staff_profile_id !== profile.id) return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Forbidden', undefined, 403);
    await admin.from('jobs').update({ status: 'completed', notes: notes ?? job.notes, completed_at: new Date().toISOString() }).eq('id', id).eq('tenant_id', profile.tenant_id);
    await admin.from('job_activity').insert({ tenant_id: profile.tenant_id, job_id: id, actor_profile_id: profile.id, event: 'completed', payload: {} });

    // Ensure invoice exists for balance collection
    const { data: linkedBooking } = await admin
      .from('bookings')
      .select('id, price_breakdown, reference, payment_status')
      .eq('id', job.booking_id)
      .eq('tenant_id', profile.tenant_id)
      .single();
    if (linkedBooking) {
      const total = Number((linkedBooking as any).price_breakdown?.total || 0);
      // Check for existing invoice
      const { data: existingInv } = await admin
        .from('invoices')
        .select('id, total, paid_amount, balance')
        .eq('tenant_id', profile.tenant_id)
        .eq('booking_id', job.booking_id)
        .maybeSingle();
      if (!existingInv) {
        const { data: gen } = await admin.rpc('generate_invoice_number', { p_tenant_id: profile.tenant_id });
        const number = (gen as unknown as string) || `INV-${Date.now()}`;
        const initialPaid = 0;
        const balance = Math.max(0, total - initialPaid);
        await admin.from('invoices').insert({
          tenant_id: profile.tenant_id,
          booking_id: job.booking_id,
          number,
          line_items: (job as any).checklist || [],
          tax_rows: [],
          total,
          paid_amount: initialPaid,
          balance,
        });
      }
    }
    return createSuccessResponse({ completed: true });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/jobs/[id]/complete' }, 400);
  }
}


