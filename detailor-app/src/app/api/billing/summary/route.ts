export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import Stripe from 'stripe';

function isStripePrice(p: Stripe.Price | string | Stripe.DeletedPrice | null | undefined): p is Stripe.Price {
  return !!p && typeof p !== 'string' && !(p as Stripe.DeletedPrice).deleted;
}

export async function GET(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();
    const { data: profile } = await admin.from('profiles').select('tenant_id').eq('id', user.id).single();
    if (!profile?.tenant_id) throw new Error('No tenant');
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_subscription_id, price_id, status, current_period_end')
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle();
    if (!sub) return createSuccessResponse({ current: null, next: null });

    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secret) return createSuccessResponse({ current: null, next: null });
    const stripe = new Stripe(secret);

    let current: string | undefined;
    let next: string | undefined;
    let nextDate: string | undefined;

    const s = await stripe.subscriptions.retrieve(sub.stripe_subscription_id as string, { expand: ['schedule', 'items.data.price'] }) as unknown as (Stripe.Subscription & { current_period_end?: number; schedule?: string });
    const currentPriceMaybe = s.items.data[0]?.price as Stripe.Price | string | Stripe.DeletedPrice | undefined;
    if (isStripePrice(currentPriceMaybe)) current = `${new Intl.NumberFormat('en-GB', { style: 'currency', currency: (currentPriceMaybe.currency || 'gbp').toUpperCase() }).format(((currentPriceMaybe.unit_amount ?? 0) as number) / 100)} / ${currentPriceMaybe.recurring?.interval}`;

    // If there is a schedule, derive next phase price
    if (s.schedule) {
      const scheduleId = s.schedule as string;
      const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId, { expand: ['phases.items.price'] });
      const phase = schedule.phases?.[0];
      const nextPriceMaybe = phase?.items?.[0]?.price as Stripe.Price | string | Stripe.DeletedPrice | undefined;
      if (isStripePrice(nextPriceMaybe)) next = `${new Intl.NumberFormat('en-GB', { style: 'currency', currency: (nextPriceMaybe.currency || 'gbp').toUpperCase() }).format(((nextPriceMaybe.unit_amount ?? 0) as number) / 100)} / ${nextPriceMaybe.recurring?.interval}`;
      nextDate = s.current_period_end ? new Date(s.current_period_end * 1000).toISOString() : undefined;
    }

    return createSuccessResponse({ current, next, nextDate });
  } catch (e) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/billing/summary' }, 400);
  }
}


