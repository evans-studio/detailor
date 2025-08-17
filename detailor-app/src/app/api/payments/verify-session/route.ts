export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { session_id } = body as { session_id?: string };
    
    if (!session_id) {
      return createErrorResponse(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 'Missing session_id', { field: 'session_id' }, 400);
    }

    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secret) {
      return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Server not configured', undefined, 500);
    }

    const stripe = new Stripe(secret);

    // Retrieve the session from Stripe (expand subscription for schedule checks)
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['subscription'] });

    // For one-off payments require 'paid'; for subscriptions allow 'paid' or 'no_payment_required'
    const allowedSubStatuses = new Set(['paid', 'no_payment_required']);
    const isPaid = (session.payment_status || '') === 'paid';
    if ((session.mode === 'payment' && !isPaid) || (session.mode === 'subscription' && !allowedSubStatuses.has(session.payment_status || ''))) {
      return createErrorResponse(API_ERROR_CODES.PAYMENT_ERROR, 'Checkout not completed', { payment_status: session.payment_status, mode: session.mode }, 400);
    }

    // Auto-create a Subscription Schedule to transition from intro -> standard for monthly intros
    // Mapping of intro monthly price -> standard monthly price
    const INTRO_TO_STANDARD: Record<string, string> = {
      // starter monthly
      'price_1RvFduQJVipO0E7Taws14yS5': 'price_1RvFgcQJVipO0E7Tmh8Gqp87',
      // pro monthly
      'price_1RvFpnQJVipO0E7TWLul7XZw': 'price_1RvFrTQJVipO0E7Tc6kr6cez',
      // business monthly
      'price_1RvGATQJVipO0E7T6jtE1rUO': 'price_1RvGCLQJVipO0E7T7JKuSQZL',
    };

    let scheduleCreated: string | null = null;
    if (session.mode === 'subscription' && session.subscription) {
      // Identify purchased price
      const lineItems = await stripe.checkout.sessions.listLineItems(session_id, { limit: 1 });
      const priceId = lineItems.data[0]?.price?.id;
      const standardPriceId = priceId ? INTRO_TO_STANDARD[priceId] : undefined;

      // If intro price was used and there is no schedule yet, create one transitioning to standard
      const subscriptionObj = typeof session.subscription === 'string'
        ? await stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;

      if (standardPriceId && !subscriptionObj.schedule) {
        const schedule = await stripe.subscriptionSchedules.create({
          from_subscription: subscriptionObj.id,
          phases: [
            {
              items: [
                { price: standardPriceId, quantity: 1 },
              ],
            },
          ],
        });
        scheduleCreated = schedule.id;

        // Persist schedule id on our subscription row
        try {
          const admin = getSupabaseAdmin();
          await admin
            .from('subscriptions')
            .update({ schedule_id: schedule.id })
            .eq('stripe_subscription_id', subscriptionObj.id);
        } catch {
          // best-effort
        }
      }
    }

    return createSuccessResponse({ 
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_details?.email,
        metadata: session.metadata,
      },
      schedule_created: scheduleCreated,
    });

  } catch (e) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/payments/verify-session' }, 400);
  }
}