export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

export interface ActivityItem {
  id: string;
  type: 'booking_created' | 'booking_completed' | 'payment_received' | 'customer_registered' | 'service_updated';
  title: string;
  description: string;
  timestamp: string;
  metadata?: {
    customer_name?: string;
    service_name?: string;
    amount?: number;
    booking_reference?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const admin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Resolve tenant context via auth, header or cookie
    let profile: { role?: string; tenant_id?: string } | null = null;
    try {
      const { user } = await getUserFromRequest(request);
      const p = await admin.from('profiles').select('role, tenant_id').eq('id', user.id).single();
      profile = p.data as any;
    } catch {}
    let tenantId = profile?.tenant_id as string | undefined;
    if (!tenantId) {
      const headerTenant = request.headers.get('x-tenant-id') || new URL(request.url).searchParams.get('tenant_id') || '';
      let cookieTenant = '';
      const cookie = request.headers.get('cookie') || '';
      const match = cookie.split('; ').find((c) => c.startsWith('df-tenant='));
      if (match) cookieTenant = decodeURIComponent(match.split('=')[1] || '');
      tenantId = (headerTenant || cookieTenant) || undefined;
    }
    if (!tenantId) return createErrorResponse(API_ERROR_CODES.UNAUTHORIZED, 'Unauthorized', { hint: 'Missing tenant context' }, 401);

    const activities: ActivityItem[] = [];

    // Get recent bookings for activity feed
    const { data: bookings } = await admin
      .from('bookings')
      .select(`
        id,
        reference,
        status,
        created_at,
        updated_at,
        customers:customer_id (name),
        services:service_id (name),
        price_breakdown
      `)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(limit * 2); // Get more to filter and sort

    // Add booking activities
    if (bookings) {
      bookings.forEach((booking: any) => {
        // Booking created
        activities.push({
          id: `booking-created-${booking.id}`,
          type: 'booking_created',
          title: 'New Booking Created',
          description: `Booking ${booking.reference || 'New booking'} created`,
          timestamp: booking.created_at,
          metadata: {
            customer_name: booking.customers?.name || 'Unknown Customer',
            service_name: booking.services?.name || 'Unknown Service',
            booking_reference: booking.reference,
            amount: booking.price_breakdown?.total || 0
          }
        });

        // Booking completed (if status is completed)
        if (booking.status === 'completed' && booking.updated_at !== booking.created_at) {
          activities.push({
            id: `booking-completed-${booking.id}`,
            type: 'booking_completed',
            title: 'Booking Completed',
            description: `Booking ${booking.reference || 'booking'} completed`,
            timestamp: booking.updated_at,
            metadata: {
              customer_name: booking.customers?.name || 'Unknown Customer',
              service_name: booking.services?.name || 'Unknown Service',
              booking_reference: booking.reference,
              amount: booking.price_breakdown?.total || 0
            }
          });
        }
      });
    }

    // Get recent customers
    const { data: customers } = await admin
      .from('customers')
      .select('id, name, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(5);

    if (customers) {
      customers.forEach((customer: any) => {
        activities.push({
          id: `customer-registered-${customer.id}`,
          type: 'customer_registered',
          title: 'New Customer Registered',
          description: `${customer.name} joined`,
          timestamp: customer.created_at,
          metadata: {
            customer_name: customer.name
          }
        });
      });
    }

    // Get recent payments (if we have a payments table)
    const { data: payments } = await admin
      .from('bookings')
      .select(`
        id,
        reference,
        created_at,
        price_breakdown,
        customers:customer_id (name)
      `)
      .eq('tenant_id', tenantId)
      .eq('status', 'paid')
      .order('created_at', { ascending: false })
      .limit(5);

    if (payments) {
      payments.forEach((payment: any) => {
        activities.push({
          id: `payment-received-${payment.id}`,
          type: 'payment_received',
          title: 'Payment Received',
          description: `Payment received for booking ${payment.reference || 'booking'}`,
          timestamp: payment.created_at,
          metadata: {
            customer_name: payment.customers?.name || 'Unknown Customer',
            booking_reference: payment.reference,
            amount: payment.price_breakdown?.total || 0
          }
        });
      });
    }

    // Sort all activities by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return createSuccessResponse({ activities: sortedActivities, count: sortedActivities.length });

  } catch (error) {
    console.error('Error fetching activities:', error);
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Internal server error', undefined, 500);
  }
}