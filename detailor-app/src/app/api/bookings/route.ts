export const runtime = 'nodejs';
import { z } from 'zod';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendBookingNotificationToAdmin } from '@/lib/email';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';

const createSchema = z.object({
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  address_id: z.string().uuid(),
  service_id: z.string().uuid(),
  addon_ids: z.array(z.string().uuid()).optional(),
  start_at: z.string(),
  end_at: z.string(),
  reference: z.string().min(4),
});

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    const { data: selfCustomer } = await admin.from('customers').select('id, tenant_id').eq('auth_user_id', user.id).single();
    const url = new URL(req.url);
    const status = url.searchParams.get('status') || undefined;
    const from = url.searchParams.get('from') || undefined;
    const to = url.searchParams.get('to') || undefined;
    const q = url.searchParams.get('q') || undefined;

    // Relationship-select to provide names instead of just IDs
    const relationshipSelect = `
      id, start_at, end_at, status, payment_status, price_breakdown, reference,
      customers:customers (id, name, email),
      services:services (id, name),
      vehicles:vehicles (make, model, year),
      addresses:addresses (address_line1, address_line2, city, postcode)
    `;

    let query: any;
    if (profile?.tenant_id) {
      // staff/admin path: tenant scoped
      query = admin.from('bookings').select(relationshipSelect).eq('tenant_id', profile.tenant_id);
      if (profile.role === 'customer' && selfCustomer) {
        // Guard: if role mislabeled, still self-scope
        query = admin.from('bookings').select(relationshipSelect).eq('customer_id', selfCustomer.id);
      }
    } else if (selfCustomer) {
      // customer path: self-scope
      query = admin.from('bookings').select(relationshipSelect).eq('customer_id', selfCustomer.id);
    } else {
      return createErrorResponse(
        API_ERROR_CODES.FORBIDDEN,
        'No profile or customer context found',
        { hint: 'User must have a valid profile or customer record' },
        403
      );
    }
    
    if (status) query = query.eq('status', status);
    if (from) query = query.gte('start_at', from);
    if (to) query = query.lte('start_at', to);
    if (q) {
      // Basic text search on reference; PostgREST cannot easily filter joined fields without rpc
      query = query.or(`reference.ilike.%${q}%,customers.name.ilike.%${q}%`);
    }
    const { data, error } = await query.order('start_at', { ascending: true });
    
    if (error) {
      return createErrorResponse(
        API_ERROR_CODES.DATABASE_ERROR,
        'Failed to fetch bookings',
        { db_error: error.message },
        500
      );
    }
    
    // Map nested relationships to flat display fields expected by UI
    const bookings = (data || []).map((b: any) => {
      const vehicle = b.vehicles as { make?: string; model?: string; year?: number } | null;
      const addr = b.addresses as { address_line1?: string; address_line2?: string; city?: string; postcode?: string } | null;
      const customer = b.customers as { name?: string; email?: string } | null;
      const service = b.services as { name?: string } | null;
      return {
        id: b.id,
        start_at: b.start_at,
        end_at: b.end_at,
        status: b.status,
        payment_status: b.payment_status,
        price_breakdown: b.price_breakdown,
        reference: b.reference,
        customer_name: customer?.name || null,
        service_name: service?.name || null,
        vehicle_name: vehicle ? `${vehicle.year ? vehicle.year + ' ' : ''}${vehicle.make || ''} ${vehicle.model || ''}`.trim() : null,
        address: addr ? `${addr.address_line1 || ''}${addr.address_line2 ? ', ' + addr.address_line2 : ''}, ${addr.city || ''}, ${addr.postcode || ''}`.replace(/^,\s+|,\s+,/g, '').trim() : null,
      };
    });

    return createSuccessResponse({ bookings });
  } catch (error: unknown) {
    return createErrorResponse(
      API_ERROR_CODES.INTERNAL_ERROR,
      (error as Error).message,
      { endpoint: 'GET /api/bookings' },
      400
    );
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = createSchema.parse(body);
    const addonIds = payload.addon_ids ?? [];

    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    let tenantId = profile?.tenant_id as string | undefined;
    if (!tenantId) {
      const { data: selfCustomer } = await admin.from('customers').select('tenant_id').eq('auth_user_id', user.id).single();
      tenantId = selfCustomer?.tenant_id as string | undefined;
    }
    if (!tenantId) throw new Error('No tenant context');

    // Check booking soft-cap limits with 5 overage buffer
    const { data: tenant } = await admin.from('tenants').select('feature_flags, plan').eq('id', tenantId).single();
    const bookingsLimit = tenant?.feature_flags?.bookings_limit as number | null;
    const buffer = 5;
    if (bookingsLimit !== null && bookingsLimit > 0) {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
      const { data: monthlyBookings } = await admin
        .from('bookings')
        .select('id')
        .eq('tenant_id', tenantId)
        .gte('created_at', monthStart)
        .lt('created_at', monthEnd);
      const currentCount = monthlyBookings?.length || 0;
      const hardLimit = bookingsLimit + buffer;
      if (currentCount >= hardLimit) {
        throw new Error(`Monthly booking limit reached (${bookingsLimit} + ${buffer} overages). Upgrade to increase your limit.`);
      }
    }

    // Compute price from quote-like method using service price and pricing config
    const { data: svc } = await admin.from('services').select('*').eq('id', payload.service_id).single();
    if (!svc) throw new Error('Service not found');

    let addonsTotal = 0;
    if (addonIds.length) {
      const { data: addons } = await admin.from('add_ons').select('*').in('id', addonIds);
      addonsTotal = (addons || []).reduce((sum, a) => sum + Number(a.price_delta || 0), 0);
    }

    const { data: pricing } = await admin
      .from('pricing_configs')
      .select('*')
      .eq('tenant_id', tenantId)
      .single();
    const taxRate = Number(pricing?.tax?.rate ?? 0);
    const basePrice = Number(svc.base_price) + addonsTotal;
    const tax = Math.round(basePrice * taxRate * 100) / 100;
    const total = Math.round((basePrice + tax) * 100) / 100;
    const price_breakdown = { base: Number(svc.base_price), addons: addonsTotal, taxRate, tax, total };

    // Conflict prevention: verify no overlapping bookings (tstzrange overlap)
    const { data: conflicts } = await admin
      .from('bookings')
      .select('id')
      .eq('tenant_id', tenantId)
      .overlaps('time_range', `[${payload.start_at},${payload.end_at})`);
    if ((conflicts?.length || 0) > 0) {
      return createErrorResponse(
        API_ERROR_CODES.OPERATION_NOT_ALLOWED,
        'Selected time overlaps with an existing booking',
        { conflicting_ids: conflicts?.map(c => c.id) },
        409
      );
    }

    const { data, error } = await admin
      .from('bookings')
      .insert({
        tenant_id: tenantId,
        customer_id: payload.customer_id,
        vehicle_id: payload.vehicle_id,
        address_id: payload.address_id,
        service_id: payload.service_id,
        addon_ids: addonIds,
        start_at: payload.start_at,
        end_at: payload.end_at,
        reference: payload.reference,
        price_breakdown,
        status: 'pending',
      })
      .select('*')
      .single();
    if (error) throw error;

    // Note: For authenticated bookings, emails will be sent when payment is confirmed
    // This is typically handled in the payment confirmation flow
    // For now, only send admin notification for new bookings
    try {
      const { data: bookingDetails } = await admin
        .from('bookings')
        .select(`
          *,
          customers (name, email, phone),
          vehicles (make, model, year, colour),
          addresses (address_line1, address_line2, city, postcode),
          services (name),
          tenants (name, settings)
        `)
        .eq('id', data.id)
        .single();

      if (bookingDetails) {
        const customer = bookingDetails.customers as { name: string; email: string; phone?: string };
        const tenant = bookingDetails.tenants as { name: string; settings?: Record<string, unknown> };
        const adminEmail = 'admin@example.com';

        const vehicle = bookingDetails.vehicles as { make: string; model: string; year?: number };
        const address = bookingDetails.addresses as { address_line1: string; address_line2?: string; city: string; postcode: string };
        const service = bookingDetails.services as { name: string };

        // Send notification to admin for new bookings
        await sendBookingNotificationToAdmin({
          booking_id: bookingDetails.id,
          reference: bookingDetails.reference,
          service_name: service.name,
          customer_name: customer.name,
          customer_email: customer.email,
          customer_phone: customer.phone,
          start_at: bookingDetails.start_at,
          address: `${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}, ${address.city}, ${address.postcode}`,
          vehicle_name: `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`.trim(),
          price_breakdown: bookingDetails.price_breakdown,
          admin_email: adminEmail,
          tenant_name: tenant.name,
        });
      }
    } catch (emailError) {
      // Log email errors but don't fail the booking
      console.error('Failed to send admin notification email:', emailError);
    }

    return createSuccessResponse({ booking: data });
  } catch (error: unknown) {
    return createErrorResponse(
      API_ERROR_CODES.INTERNAL_ERROR,
      (error as Error).message,
      { endpoint: 'POST /api/bookings' },
      400
    );
  }
}


