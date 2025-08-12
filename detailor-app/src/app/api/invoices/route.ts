import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const createSchema = z.object({
  booking_id: z.string().uuid().optional(),
  number: z.string().min(1).optional(),
  line_items: z.array(z.unknown()).default([]),
  tax_rows: z.array(z.unknown()).default([]),
  total: z.number().nonnegative(),
  paid_amount: z.number().nonnegative().default(0),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    const url = new URL(req.url);
    const bookingId = url.searchParams.get('booking_id') || undefined;
    if (!profile) throw new Error('No profile');
    let data;
    let error;
    if (['staff','admin'].includes(profile.role)) {
      let query = admin.from('invoices').select('*').eq('tenant_id', profile.tenant_id);
      if (bookingId) query = query.eq('booking_id', bookingId);
      const resp = await query.order('created_at', { ascending: false });
      data = resp.data; error = resp.error as unknown as Error | null;
    } else {
      // Customer self-scope: filter invoices by booking.customer_id
      const { data: selfCust } = await admin.from('customers').select('id').eq('auth_user_id', user.id).single();
      if (!selfCust) return NextResponse.json({ ok: true, invoices: [] });
      if (bookingId) {
        const resp = await admin
          .from('invoices')
          .select('*, bookings!inner(customer_id)')
          .eq('bookings.customer_id', selfCust.id)
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: false });
        data = (resp.data || []).map((row: { bookings?: unknown } & Record<string, unknown>) => {
          const { bookings, ...rest } = row; return rest;
        }) as unknown[];
        error = resp.error as unknown as Error | null;
      } else {
        const resp = await admin
          .from('invoices')
          .select('*, bookings!inner(customer_id)')
          .eq('bookings.customer_id', selfCust.id)
          .order('created_at', { ascending: false });
        data = (resp.data || []).map((row: { bookings?: unknown } & Record<string, unknown>) => {
          const { bookings, ...rest } = row; return rest;
        }) as unknown[];
        error = resp.error as unknown as Error | null;
      }
    }
    if (error) throw error;
    return NextResponse.json({ ok: true, invoices: data });
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
    const balance = Math.max(0, payload.total - (payload.paid_amount ?? 0));
    // Generate invoice number if not supplied
    let number = payload.number;
    if (!number) {
      const { data: gen } = await admin.rpc('generate_invoice_number', { p_tenant_id: profile.tenant_id });
      number = gen as unknown as string;
    }
    const { data, error } = await admin
      .from('invoices')
      .insert({ tenant_id: profile.tenant_id, number, booking_id: payload.booking_id, line_items: payload.line_items, tax_rows: payload.tax_rows, total: payload.total, paid_amount: payload.paid_amount, balance })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ ok: true, invoice: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


