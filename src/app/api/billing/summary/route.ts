export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import Stripe from 'stripe';

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
    if (!sub) return NextResponse.json({ ok: true, current: null, next: null });

    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secret) return NextResponse.json({ ok: true, current: null, next: null });
    const stripe = new Stripe(secret);

    let current: string | undefined;
    let next: string | undefined;
    let nextDate: string | undefined;

    const s = await stripe.subscriptions.retrieve(sub.stripe_subscription_id as string, { expand: ['schedule', 'items.data.price'] });
    const currentPrice = s.items.data[0]?.price;
    if (currentPrice) current = `${new Intl.NumberFormat('en-GB', { style: 'currency', currency: currentPrice.currency.toUpperCase() }).format((currentPrice.unit_amount || 0) / 100)} / ${currentPrice.recurring?.interval}`;

    // If there is a schedule, derive next phase price
    if ((s as unknown as { schedule?: string }).schedule) {
      const scheduleId = (s as unknown as { schedule?: string }).schedule as string;
      const schedule = await stripe.subscriptionSchedules.retrieve(scheduleId, { expand: ['phases.items.price'] });
      const phase = schedule.phases?.[0];
      const rawNextPrice = phase?.items?.[0]?.price as unknown as (Stripe.Price | string | null | undefined);
      const nextPrice = (rawNextPrice && typeof rawNextPrice !== 'string' && !(rawNextPrice as any).deleted) ? (rawNextPrice as Stripe.Price) : undefined;
      if (nextPrice) next = `${new Intl.NumberFormat('en-GB', { style: 'currency', currency: (nextPrice.currency || 'gbp').toUpperCase() }).format(((nextPrice.unit_amount ?? 0) as number) / 100)} / ${nextPrice.recurring?.interval}`;
      nextDate = s.current_period_end ? new Date((s.current_period_end as number) * 1000).toISOString() : undefined;
    }

    return NextResponse.json({ ok: true, current, next, nextDate });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


