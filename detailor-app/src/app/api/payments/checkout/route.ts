export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { price_id, email } = body as { price_id?: string; email?: string };
    if (!price_id) return createErrorResponse(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 'Missing price_id', { field: 'price_id' }, 400);

    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secret) return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Server not configured', undefined, 500);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.detailor.co.uk';
    const stripe = new Stripe(secret);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: `${appUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing`,
      customer_email: email,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: {
        trial_period_days: 7,
        metadata: { app: 'detailor', price_id },
      },
      metadata: { app: 'detailor', price_id },
    });

    return createSuccessResponse({ url: session.url, id: session.id });
  } catch (e) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/payments/checkout' }, 400);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const price_id = searchParams.get('price_id') || undefined;
    const email = searchParams.get('email') || undefined;
    if (!price_id) return createErrorResponse(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 'Missing price_id', { field: 'price_id' }, 400);

    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secret) return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Server not configured', undefined, 500);

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.detailor.co.uk';
    const stripe = new Stripe(secret);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: `${appUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing`,
      customer_email: email,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: { trial_period_days: 7, metadata: { app: 'detailor', price_id } },
      metadata: { app: 'detailor', price_id },
    });
    if (session.url) return NextResponse.redirect(session.url, { status: 303 });
    return createErrorResponse(API_ERROR_CODES.EXTERNAL_SERVICE_ERROR, 'No checkout URL', undefined, 400);
  } catch (e) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/payments/checkout' }, 400);
  }
}


