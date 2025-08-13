import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { z } from 'zod';
import Stripe from 'stripe';

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
    const url = new URL(req.url);
    const invoiceId = url.searchParams.get('invoice_id') || undefined;
    const bookingId = url.searchParams.get('booking_id') || undefined;
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    let query = admin.from('payments').select('*').eq('tenant_id', profile.tenant_id);
    if (invoiceId) query = query.eq('invoice_id', invoiceId);
    if (bookingId) query = query.eq('booking_id', bookingId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return createSuccessResponse({ payments: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/payments' }, 400);
  }
}

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const body = await req.json();
    const payload = createSchema.parse(body);
    // Handle SMS/top-up add-ons via provider 'stripe' and special metadata
    if (payload.provider === 'stripe' && (body?.addon_sku || body?.price_id)) {
      const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
      if (!secret) throw new Error('Server not configured');
      const stripe = new Stripe(secret);
      const url = new URL(req.url);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || `${url.origin}`;
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: [{ price: String(body.price_id), quantity: Number(body.quantity || 1) }],
        success_url: `${appUrl}/billing?success=1`,
        cancel_url: `${appUrl}/billing`,
         metadata: { app: 'detailor', addon_sku: String(body.addon_sku || ''), price_id: String(body.price_id || '') },
      });
      return createSuccessResponse({ url: session.url });
    }
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
      return createSuccessResponse({ payment: data });
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
    return createSuccessResponse({ payment: data });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/payments' }, 400);
  }
}


