import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
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
    const page = Math.max(1, Number(url.searchParams.get('page') || '1'));
    const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get('pageSize') || '25')));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    if (!profile) throw new Error('No profile');
    let data;
    let error;
    if (['staff','admin'].includes(profile.role)) {
      let query = admin.from('invoices').select('*', { count: 'exact' }).eq('tenant_id', profile.tenant_id);
      if (bookingId) query = query.eq('booking_id', bookingId);
      const resp = await query.order('created_at', { ascending: false }).range(from, to);
      data = resp.data; error = resp.error as unknown as Error | null;
      const total = resp.count ?? (data?.length || 0);
      return createSuccessResponse({ invoices: data }, { pagination: { page, pageSize, total } });
    } else {
      // Customer self-scope: filter invoices by booking.customer_id
      const { data: selfCust } = await admin.from('customers').select('id').eq('auth_user_id', user.id).single();
    if (!selfCust) return createSuccessResponse({ invoices: [] });
      if (bookingId) {
        const resp = await admin
          .from('invoices')
          .select('*, bookings!inner(customer_id)', { count: 'exact' })
          .eq('bookings.customer_id', selfCust.id)
          .eq('booking_id', bookingId)
          .order('created_at', { ascending: false })
          .range(from, to);
        const rows = (resp.data || []).map((row: { bookings?: unknown } & Record<string, unknown>) => {
          const { bookings, ...rest } = row; return rest;
        }) as unknown[];
        error = resp.error as unknown as Error | null;
        const total = resp.count ?? rows.length;
        return createSuccessResponse({ invoices: rows }, { pagination: { page, pageSize, total } });
      } else {
        const resp = await admin
          .from('invoices')
          .select('*, bookings!inner(customer_id)', { count: 'exact' })
          .eq('bookings.customer_id', selfCust.id)
          .order('created_at', { ascending: false })
          .range(from, to);
        const rows = (resp.data || []).map((row: { bookings?: unknown } & Record<string, unknown>) => {
          const { bookings, ...rest } = row; return rest;
        }) as unknown[];
        error = resp.error as unknown as Error | null;
        const total = resp.count ?? rows.length;
        return createSuccessResponse({ invoices: rows }, { pagination: { page, pageSize, total } });
      }
    }
    if (error) throw error;
    return createSuccessResponse({ invoices: data }, { pagination: { page, pageSize, total: (data as unknown[]).length } });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/invoices' }, 400);
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = createSchema.parse(body);
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'No profile', undefined, 404);
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
    return createSuccessResponse({ invoice: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/invoices' }, 400);
  }
}


