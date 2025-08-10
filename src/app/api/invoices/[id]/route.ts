import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop() as string;
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    // Staff/Admin by tenant
    if (['staff','admin'].includes(profile.role)) {
      const { data, error } = await admin.from('invoices').select('*').eq('id', id).eq('tenant_id', profile.tenant_id).single();
      if (error) throw error;
      return NextResponse.json({ ok: true, invoice: data });
    }
    // Customer self scope via booking join
    const { data: selfCust } = await admin.from('customers').select('id').eq('auth_user_id', user.id).single();
    if (!selfCust) return NextResponse.json({ ok: false, error: 'Forbidden' }, { status: 403 });
    const { data, error } = await admin
      .from('invoices')
      .select('*, bookings!inner(customer_id)')
      .eq('id', id)
      .eq('bookings.customer_id', selfCust.id)
      .single();
    if (error) throw error;
    // Strip join
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { bookings, ...rest } = data as unknown as { bookings?: unknown } & Record<string, unknown>;
    return NextResponse.json({ ok: true, invoice: rest });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


