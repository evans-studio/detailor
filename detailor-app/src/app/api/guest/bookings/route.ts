export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendBookingConfirmation, sendBookingNotificationToAdmin } from '@/lib/email';

const createSchema = z.object({
  customer_id: z.string().uuid(),
  vehicle_id: z.string().uuid(),
  address_id: z.string().uuid(),
  service_id: z.string().uuid(),
  addon_ids: z.array(z.string().uuid()).optional(),
  start_at: z.string(),
  end_at: z.string(),
  reference: z.string().min(4),
  payment_status: z.enum(['paid', 'pending']).optional(),
});

// Guest booking creation endpoint
export async function POST(req: Request) {
  try {
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = createSchema.parse(body);
    const addonIds = payload.addon_ids ?? [];

    // Get tenant ID from customer
    const { data: customer } = await admin
      .from('customers')
      .select('tenant_id')
      .eq('id', payload.customer_id)
      .single();
    
    if (!customer) {
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Customer not found', { customer_id: payload.customer_id }, 404);
    }
    
    const tenantId = customer.tenant_id;

    // Guard: prevent double-booking (overlapping time ranges)
    {
      const { data: overlapping } = await admin
        .from('bookings')
        .select('id')
        .eq('tenant_id', tenantId)
        .lt('start_at', payload.end_at)
        .gt('end_at', payload.start_at)
        .in('status', ['pending','confirmed','in_progress']);
      if ((overlapping?.length || 0) > 0) {
        return createErrorResponse(API_ERROR_CODES.OPERATION_NOT_ALLOWED, 'Selected time overlaps with an existing booking', { count: overlapping?.length }, 409);
      }
    }

    // Check booking limits for starter plans
    const { data: tenant } = await admin
      .from('tenants')
      .select('feature_flags, plan')
      .eq('id', tenantId)
      .single();
    
    const bookingsLimit = tenant?.feature_flags?.bookings_limit as number | null;
    
    if (bookingsLimit !== null && bookingsLimit > 0) {
      // Get current month's booking count
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
      
      if (currentCount >= bookingsLimit) {
        return createErrorResponse(API_ERROR_CODES.LIMIT_EXCEEDED, `Monthly booking limit reached (${bookingsLimit}). Upgrade to Pro for unlimited bookings.`, { limit: bookingsLimit, current: currentCount }, 403);
      }
    }

    // Compute price from service and add-ons
    const { data: svc } = await admin
      .from('services')
      .select('*')
      .eq('id', payload.service_id)
      .single();
    
    if (!svc) {
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Service not found', { service_id: payload.service_id }, 404);
    }

    let addonsTotal = 0;
    if (addonIds.length) {
      const { data: addons } = await admin
        .from('add_ons')
        .select('*')
        .in('id', addonIds);
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

    // Create the booking
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
        payment_status: payload.payment_status || 'pending',
      })
      .select('*')
      .single();
    
    if (error) throw error;

    // Send email notifications if booking is paid (successful payment)
    if (payload.payment_status === 'paid') {
      try {
        // Get detailed booking information for emails
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
          const vehicle = bookingDetails.vehicles as { make: string; model: string; year?: number };
          const address = bookingDetails.addresses as { address_line1: string; address_line2?: string; city: string; postcode: string };
          const service = bookingDetails.services as { name: string };
          const tenant = bookingDetails.tenants as { name: string };

          // Send confirmation email to customer
          await sendBookingConfirmation({
            id: bookingDetails.id,
            reference: bookingDetails.reference,
            service_name: service.name,
            customer_name: customer.name,
            customer_email: customer.email,
            start_at: bookingDetails.start_at,
            end_at: bookingDetails.end_at,
            address: `${address.address_line1}${address.address_line2 ? ', ' + address.address_line2 : ''}, ${address.city}, ${address.postcode}`,
            vehicle_name: `${vehicle.year || ''} ${vehicle.make} ${vehicle.model}`.trim(),
            price_breakdown: bookingDetails.price_breakdown,
            tenant_name: tenant.name,
          });

          // Send notification to admin
          const adminEmail = 'admin@example.com';
          
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
        console.error('Failed to send booking emails:', emailError);
      }
    }

    return createSuccessResponse({ booking: data });
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, { endpoint: 'POST /api/guest/bookings' }, 400);
  }
}