export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { amount, currency = 'gbp', customer_email, booking_reference, return_url } = body as { 
      amount?: number; 
      currency?: string; 
      customer_email?: string; 
      booking_reference?: string;
      return_url?: string;
    };
    
    if (!amount || amount < 50) {
      return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'Invalid amount', { min: 50 }, 400);
    }

    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secret) {
      return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Server not configured', undefined, 500);
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.detailor.co.uk';
    const stripe = new Stripe(secret);

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: `Booking Service - ${booking_reference}`,
            description: 'Professional vehicle detail service',
          },
          unit_amount: amount,
        },
        quantity: 1,
      }],
      success_url: return_url || `${appUrl}/bookings/confirmation?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/book/new`,
      customer_email,
      payment_intent_data: {
        metadata: {
          type: 'booking_payment',
          booking_reference: booking_reference || '',
           app: 'detailor'
        },
      },
      metadata: {
        type: 'booking_payment',
        booking_reference: booking_reference || '',
        app: 'detailor'
      },
    });

    return createSuccessResponse({ url: session.url, id: session.id });
  } catch (e) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/payments/checkout-booking' }, 400);
  }
}