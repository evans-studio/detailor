import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const schema = z.object({
  quote_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  address_id: z.string().uuid(),
  start_at: z.string(),
  end_at: z.string(),
  reference: z.string().min(4),
});

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const payload = schema.parse(await req.json());
    // Authorize: user must be staff/admin in tenant OR the customer owning the quote
    const { data: quote } = await admin.from('quotes').select('*').eq('id', payload.quote_id).single();
    if (!quote) throw new Error('Quote not found');

    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    const { data: selfCustomer } = await admin.from('customers').select('id').eq('auth_user_id', user.id).single();
    const isStaff = !!profile && profile.tenant_id === quote.tenant_id && ['staff','admin'].includes(profile.role);
    const isCustomer = !!selfCustomer && selfCustomer.id === quote.customer_id;
    if (!isStaff && !isCustomer) throw new Error('Not authorized to convert this quote');

    // Call function
    const { data, error } = await admin.rpc('bookings_create_from_quote', {
      p_quote_id: payload.quote_id,
      p_vehicle_id: payload.vehicle_id,
      p_address_id: payload.address_id,
      p_start_at: payload.start_at,
      p_end_at: payload.end_at,
      p_reference: payload.reference,
    });
    if (error) throw error;
    return NextResponse.json({ ok: true, booking: data });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


