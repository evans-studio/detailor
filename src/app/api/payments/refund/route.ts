import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({
  payment_id: z.string().uuid(),
  amount: z.number().positive().optional(),
});

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const payload = schema.parse(await req.json());
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff','admin'].includes(profile.role)) throw new Error('Forbidden');

    const { data: payment } = await admin
      .from('payments')
      .select('*')
      .eq('id', payload.payment_id)
      .eq('tenant_id', profile.tenant_id)
      .single();
    if (!payment) throw new Error('Payment not found');

    // Stub provider refund; mark as refunded and update amount if partial
    const refundedAmount = payload.amount ?? payment.amount;
    const { data, error } = await admin
      .from('payments')
      .update({ status: 'refunded', refunded_amount: refundedAmount })
      .eq('id', payment.id)
      .eq('tenant_id', profile.tenant_id)
      .select('*')
      .single();
    if (error) throw error;

    // Best-effort booking payment status
    if (payment.booking_id) {
      await admin.from('bookings').update({ payment_status: 'refunded' }).eq('id', payment.booking_id).eq('tenant_id', profile.tenant_id);
    }

    return NextResponse.json({ ok: true, payment: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


