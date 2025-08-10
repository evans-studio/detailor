import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const createSchema = z.object({
  booking_id: z.string().uuid().optional(),
  invoice_id: z.string().uuid().optional(),
  provider: z.enum(['stripe','paypal','cash']),
  amount: z.number().positive(),
  currency: z.string().min(3).max(3).default('GBP'),
  status: z.enum(['requires_action','pending','succeeded','refunded','failed']).optional(),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    const { data, error } = await admin.from('payments').select('*').eq('tenant_id', profile.tenant_id).order('created_at', { ascending: false });
    if (error) throw error;
    return NextResponse.json({ ok: true, payments: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = createSchema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    // Demo guard: block emails/payments if is_demo=true (sink)
    const { data: tenantRow } = await admin.from('tenants').select('is_demo').eq('id', profile.tenant_id).single();
    if (tenantRow?.is_demo) {
      // Force pending or simulate success without provider
      const { data, error } = await admin
        .from('payments')
        .insert({ tenant_id: profile.tenant_id, ...payload, status: payload.status ?? 'pending' })
        .select('*')
        .single();
      if (error) throw error;
      return NextResponse.json({ ok: true, payment: data });
    }
    const { data, error } = await admin
      .from('payments')
      .insert({ tenant_id: profile.tenant_id, ...payload })
      .select('*')
      .single();
    if (error) throw error;
    // If linked to a booking, update its payment_status best-effort
    if (data?.booking_id) {
      const newStatus = payload.status === 'succeeded' ? 'paid' : payload.status === 'refunded' ? 'refunded' : undefined;
      if (newStatus) {
        await admin.from('bookings').update({ payment_status: newStatus }).eq('id', data.booking_id).eq('tenant_id', profile.tenant_id);
      }
    }
    return NextResponse.json({ ok: true, payment: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


