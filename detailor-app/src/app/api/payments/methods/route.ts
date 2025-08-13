import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import Stripe from 'stripe';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile) throw new Error('No profile');
    const { data: sub } = await admin.from('subscriptions').select('stripe_customer_id').eq('tenant_id', profile.tenant_id).maybeSingle();
    const customerId = sub?.stripe_customer_id as string | undefined;
    if (!customerId) return createSuccessResponse({ methods: [] });
    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secret) return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Server not configured', undefined, 500);
    const stripe = new Stripe(secret);
    const pms = await stripe.paymentMethods.list({ customer: customerId, type: 'card' });
    const methods = pms.data.map((pm) => ({ id: pm.id, brand: pm.card?.brand, last4: pm.card?.last4, exp_month: pm.card?.exp_month, exp_year: pm.card?.exp_year, default: false }));
    return createSuccessResponse({ methods });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/payments/methods' }, 400);
  }
}


