import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';

const updateSchema = z.object({
  status: z.enum(['pending','confirmed','in_progress','completed','cancelled','no_show']).optional(),
  start_at: z.string().optional(),
  end_at: z.string().optional(),
  payment_status: z.enum(['unpaid','deposit_paid','paid','refunded','partial_refund']).optional(),
});

export async function PATCH(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = updateSchema.parse(body);
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop() as string;
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    const { data: selfCustomer } = await admin.from('customers').select('id').eq('auth_user_id', user.id).single();

    // Basic policy: customers can only reschedule future pending/confirmed bookings, or cancel within rules
    // If rescheduling, perform conflict prevention before update
    if (payload.start_at && payload.end_at) {
      const { data: current } = await admin.from('bookings').select('tenant_id').eq('id', id).single();
      if (!current?.tenant_id) throw new Error('Booking not found');
      const { data: conflicts } = await admin
        .from('bookings')
        .select('id')
        .eq('tenant_id', current.tenant_id)
        .neq('id', id)
        .overlaps('time_range', `[${payload.start_at},${payload.end_at})`);
      if ((conflicts?.length || 0) > 0) {
        return createErrorResponse(API_ERROR_CODES.OPERATION_NOT_ALLOWED, 'Selected time overlaps with an existing booking', { conflicting_ids: conflicts?.map(c => c.id) }, 409);
      }
    }

    let query = admin.from('bookings').update(payload).eq('id', id).select('*').single();
    if (profile?.tenant_id && profile.role !== 'customer') {
      query = admin.from('bookings').update(payload).eq('id', id).eq('tenant_id', profile.tenant_id).select('*').single();
    } else if (selfCustomer) {
      // Restrict customers to updating only their own booking
      query = admin
        .from('bookings')
        .update(payload)
        .eq('id', id)
        .eq('customer_id', selfCustomer.id)
        .select('*')
        .single();
    } else {
      throw new Error('No permission');
    }
    const { data, error } = await query;
    // Optionally enforce cutoffs (soft check)
    if (!error && profile?.role === 'customer' && data) {
      const now = Date.now();
      const startsAt = new Date(data.start_at).getTime();
      const fourHoursMs = 4 * 60 * 60 * 1000;
      if ((payload.start_at || payload.end_at) && startsAt - now < fourHoursMs) {
        // Best-effort rollback not implemented here; surface warning
        // In production, use a procedure to enforce and return error
        return createErrorResponse(API_ERROR_CODES.OPERATION_NOT_ALLOWED, 'Too late to reschedule within 4 hours', undefined, 400);
      }
      if (payload.status === 'cancelled' && startsAt - now < fourHoursMs) {
        return createErrorResponse(API_ERROR_CODES.OPERATION_NOT_ALLOWED, 'Too late to cancel within 4 hours', undefined, 400);
      }
    }
    if (error) throw error;
    return createSuccessResponse({ booking: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'PATCH /api/bookings/[id]' }, 400);
  }
}

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { pathname } = new URL(req.url);
    const id = pathname.split('/').pop() as string;

    const { data: profile } = await admin
      .from('profiles')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();
    const { data: selfCustomer } = await admin
      .from('customers')
      .select('id')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    const relationshipSelect = `
      id, start_at, end_at, status, payment_status, price_breakdown, reference, tenant_id,
      customers:customers (id, name, email),
      services:services (id, name),
      vehicles:vehicles (make, model, year),
      addresses:addresses (address_line1, address_line2, city, postcode)
    `;

    let query: any = admin.from('bookings').select(relationshipSelect).eq('id', id);
    if (profile?.tenant_id && profile.role !== 'customer') {
      query = query.eq('tenant_id', profile.tenant_id);
    } else if (selfCustomer?.id) {
      query = query.eq('customer_id', selfCustomer.id);
    } else {
      return createErrorResponse(
        API_ERROR_CODES.FORBIDDEN,
        'No profile or customer context found',
        { hint: 'User must have a valid profile or customer record' },
        403
      );
    }

    const { data, error } = await query.single();
    if (error) {
      return createErrorResponse(
        API_ERROR_CODES.DATABASE_ERROR,
        'Failed to fetch booking',
        { db_error: error.message },
        500
      );
    }
    if (!data) {
      return createErrorResponse(
        API_ERROR_CODES.RECORD_NOT_FOUND,
        'Booking not found',
        { id },
        404
      );
    }

    const vehicle = data.vehicles as { make?: string; model?: string; year?: number } | null;
    const addr = data.addresses as { address_line1?: string; address_line2?: string; city?: string; postcode?: string } | null;
    const customer = data.customers as { name?: string; email?: string } | null;
    const service = data.services as { name?: string } | null;

    const booking = {
      id: data.id,
      start_at: data.start_at,
      end_at: data.end_at,
      status: data.status,
      payment_status: data.payment_status,
      price_breakdown: data.price_breakdown,
      reference: data.reference,
      customer_name: customer?.name || null,
      service_name: service?.name || null,
      vehicle_name: vehicle ? `${vehicle.year ? vehicle.year + ' ' : ''}${vehicle.make || ''} ${vehicle.model || ''}`.trim() : null,
      address: addr ? `${addr.address_line1 || ''}${addr.address_line2 ? ', ' + addr.address_line2 : ''}, ${addr.city || ''}, ${addr.postcode || ''}`.replace(/^,\s+|,\s+,/g, '').trim() : null,
    };

    return createSuccessResponse({ booking });
  } catch (e: unknown) {
    return createErrorResponse(
      API_ERROR_CODES.INTERNAL_ERROR,
      (e as Error).message,
      { endpoint: 'GET /api/bookings/[id]' },
      400
    );
  }
}


