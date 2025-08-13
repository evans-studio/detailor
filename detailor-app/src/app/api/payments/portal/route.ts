import { NextResponse } from 'next/server';
import { createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
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
    if (!customerId) throw new Error('No Stripe customer');
    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.detailor.co.uk';
    if (!secret) throw new Error('Server not configured');
    const stripe = new Stripe(secret);
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/customer/account`,
    });
    return NextResponse.redirect(session.url, { status: 303 });
  } catch (e: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/payments/portal' }, 400);
  }
}


