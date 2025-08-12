export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

type Plan = 'starter' | 'pro' | 'business' | 'enterprise';

// Hard map the new Stripe price IDs → plan (monthly intro/standard + annual launch/standard)
const PRICE_TO_PLAN: Record<string, Plan> = {
  // STARTER
  'price_1RvFduQJVipO0E7Taws14yS5': 'starter', // intro monthly
  'price_1RvFgcQJVipO0E7Tmh8Gqp87': 'starter', // standard monthly
  'price_1RvFiyQJVipO0E7TBKzDOW3q': 'starter', // annual launch
  'price_1RvFmQQJVipO0E7TnTOnYBhG': 'starter', // annual standard
  // PRO
  'price_1RvFpnQJVipO0E7TWLul7XZw': 'pro',
  'price_1RvFrTQJVipO0E7Tc6kr6cez': 'pro',
  'price_1RvFwZQJVipO0E7TDQfLTL80': 'pro',
  'price_1RvFyWQJVipO0E7Ttmxm4xq2': 'pro',
  // BUSINESS
  'price_1RvGATQJVipO0E7T6jtE1rUO': 'business',
  'price_1RvGCLQJVipO0E7T7JKuSQZL': 'business',
  'price_1RvGEdQJVipO0E7Ty5kiGmCf': 'business',
  'price_1RvGIPQJVipO0E7Td22lY1VK': 'business',
  // ENTERPRISE
  'price_1RvG0rQJVipO0E7TyTQtfzKB': 'enterprise',
  'price_1RvG2YQJVipO0E7TiK5rfozV': 'enterprise',
  'price_1RvG5hQJVipO0E7TVBKVARvf': 'enterprise',
  'price_1RvG80QJVipO0E7TYVAdP2WG': 'enterprise',
};

function planFromPriceId(priceId: string | null | undefined): Plan {
  if (priceId && PRICE_TO_PLAN[priceId]) return PRICE_TO_PLAN[priceId];
  return 'starter';
}

function featureFlagsForPlan(plan: Plan) {
  if (plan === 'starter') {
    return {
      bookings_limit: 25,
      services_limit: 3,
      staff_limit: 1,
      locations_limit: 1,
      storage_gb: 1,
      overage_fee: 2.0,
      customer_portal: false,
      online_payments: false,
      analytics: false,
      custom_branding: false,
      sms_notifications: false,
      messaging: false
    };
  }
  if (plan === 'pro') {
    return {
      bookings_limit: 80,
      services_limit: null,
      staff_limit: 3,
      locations_limit: 1,
      storage_gb: 5,
      overage_fee: 1.5,
      customer_portal: true,
      online_payments: true,
      analytics: true,
      custom_branding: true,
      sms_notifications: 'addon',
      messaging: true
    };
  }
  if (plan === 'business') {
    return {
      bookings_limit: 200,
      services_limit: null,
      staff_limit: 8,
      locations_limit: 3,
      storage_gb: 15,
      overage_fee: 1.0,
      customer_portal: true,
      online_payments: true,
      analytics: true,
      custom_branding: true,
      sms_notifications: 'addon',
      messaging: true,
      custom_domain: true,
      advanced_reporting: true,
    };
  }
  // enterprise
  return {
    bookings_limit: null,
    services_limit: null,
    staff_limit: null,
    locations_limit: null,
    storage_gb: 100,
    overage_fee: 0,
    customer_portal: true,
    online_payments: true,
    analytics: true,
    custom_branding: true,
    white_label: true,
    api_access: true,
    sms_notifications: true,
    messaging: true
  };
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string | undefined;
  if (!secret || !webhookSecret) return NextResponse.json({ ok: false }, { status: 200 });
  const stripe = new Stripe(secret);
  const body = await req.text();
  const sig = (await headers()).get('stripe-signature') as string | undefined;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig || '', webhookSecret);
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 400 });
  }

  try {
  const admin = getSupabaseAdmin();
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = (session.customer as string) || null;
      const subscriptionId = (session.subscription as string) || null;
      const priceId = (session.line_items?.data?.[0]?.price?.id as string) || (session?.metadata?.price_id as string) || null;
      const email = session.customer_details?.email || session.customer_email || '';
      const plan = planFromPriceId(priceId) as Plan;
      const flags = featureFlagsForPlan(plan);
      // Upsert tenant
      const { data: existingTenant } = await admin.from('tenants').select('id').eq('contact_email', email).maybeSingle();
      const tenantPayload: { plan: Plan; feature_flags: Record<string, unknown>; status: string; is_demo: boolean; contact_email: string } = { plan, feature_flags: flags as Record<string, unknown>, status: 'active', is_demo: false, contact_email: email };
      let tenantId = existingTenant?.id as string | undefined;
      if (tenantId) {
        await admin.from('tenants').update(tenantPayload).eq('id', tenantId);
      } else {
        const ins = await admin.from('tenants').upsert(tenantPayload, { onConflict: 'contact_email' }).select('id').single();
        tenantId = ins.data?.id as string | undefined;
      }
      // Upsert subscription
      if (tenantId && subscriptionId) {
        const subPayload: {
          tenant_id: string;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          price_id: string | null;
          status: string;
          current_period_end: string | null;
        } = {
          tenant_id: tenantId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          price_id: priceId,
          status: 'active',
          current_period_end: null,
        };
        await admin.from('subscriptions').upsert(subPayload, { onConflict: 'stripe_subscription_id' });
      }
      // Link or invite profile (assign admin to tenant owner)
      if (tenantId && email) {
        const { data: prof } = await admin.from('profiles').select('id').eq('email', email).maybeSingle();
        if (prof?.id) {
          await admin.from('profiles').update({ tenant_id: tenantId, role: 'admin' }).eq('id', prof.id);
        } else {
          await admin.from('tenant_invites').insert({ email, tenant_id: tenantId, role: 'admin' });
        }
      }
      // Seed default configs (best-effort)
      if (tenantId) {
        await admin.from('pricing_configs').upsert({ tenant_id: tenantId, currency: 'gbp' });
        await admin.from('services').insert([
          { tenant_id: tenantId, name: 'Exterior Wash', visible: true },
          { tenant_id: tenantId, name: 'Interior Clean', visible: true },
        ]);
        await admin.from('templates').insert([{ tenant_id: tenantId, key: 'booking.confirmation', channel: 'email', active: true }]);
      }
    }
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const appInvoiceId = (session.metadata as Record<string, string> | null | undefined)?.['app_invoice_id'];
      if (appInvoiceId && session.payment_status === 'paid') {
        // Apply payment to our invoice and ledger
        const invRes = await admin.from('invoices').select('id, tenant_id, booking_id, total, paid_amount, balance').eq('id', appInvoiceId).maybeSingle();
        const inv = invRes.data as { id: string; tenant_id: string; booking_id?: string | null; total: number; paid_amount: number; balance: number } | null;
        if (inv) {
          const paidNow = Number(session.amount_total ? session.amount_total / 100 : inv.balance);
          const newPaid = Number(inv.paid_amount || 0) + paidNow;
          const newBalance = Math.max(0, Number(inv.total || 0) - newPaid);
          await admin
            .from('invoices')
            .update({ paid_amount: newPaid, balance: newBalance })
            .eq('id', inv.id)
            .eq('tenant_id', inv.tenant_id);
          await admin.from('payments').insert({
            tenant_id: inv.tenant_id,
            booking_id: inv.booking_id ?? null,
            invoice_id: inv.id,
            provider: 'stripe',
            amount: paidNow,
            currency: 'GBP',
            external_txn_id: session.payment_intent as string,
            status: 'succeeded',
          });
          if (inv.booking_id) {
            await admin.from('bookings').update({ payment_status: 'paid' }).eq('id', inv.booking_id).eq('tenant_id', inv.tenant_id);
          }
        }
      }
    }
    if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = (sub.items.data[0]?.price?.id as string) || null;
      const plan = planFromPriceId(priceId);
      const flags = featureFlagsForPlan(plan);
      // Find subscription row and tenant
      const admin = getSupabaseAdmin();
      const { data: existingSub } = await admin.from('subscriptions').select('tenant_id').eq('stripe_subscription_id', sub.id).maybeSingle();
      const tenantId = existingSub?.tenant_id as string | undefined;
      if (tenantId) {
        await admin.from('tenants').update({ plan, feature_flags: flags, status: sub.status === 'active' ? 'active' : 'past_due' }).eq('id', tenantId);
        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
        await admin.from('subscriptions').upsert({
          tenant_id: tenantId,
          stripe_customer_id: sub.customer as string,
          stripe_subscription_id: sub.id,
          price_id: priceId,
          status: sub.status,
          current_period_end: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
        }, { onConflict: 'stripe_subscription_id' });
      }
    }
    if (event.type === 'invoice.payment_failed') {
      const inv = event.data.object as Stripe.Invoice;
      const admin = getSupabaseAdmin();
      const { data: existingSub } = await admin.from('subscriptions').select('tenant_id').eq('stripe_customer_id', inv.customer as string).maybeSingle();
      const tenantId = existingSub?.tenant_id as string | undefined;
      if (tenantId) {
        await admin.from('tenants').update({ status: 'suspended' }).eq('id', tenantId);
      }
    }
  } catch {
    // swallow to avoid retries storm; logs later
  }
  return NextResponse.json({ received: true }, { status: 200 });
}


