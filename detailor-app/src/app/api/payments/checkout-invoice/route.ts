export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: Request) {
  try {
    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secret) throw new Error('Server not configured');
    const stripe = new Stripe(secret);
    const { user } = await getUserFromRequest(req);
    const admin = getSupabaseAdmin();

    const body = await req.json();
    const invoiceId = (body?.invoice_id as string) || null;
    if (!invoiceId) throw new Error('Missing invoice_id');

    // Resolve tenant + stripe customer
    const { data: profile } = await admin
      .from('profiles')
      .select('tenant_id, email')
      .eq('id', user.id)
      .single();
    if (!profile) throw new Error('No profile');
    const { data: sub } = await admin
      .from('subscriptions')
      .select('stripe_customer_id')
      .eq('tenant_id', profile.tenant_id)
      .maybeSingle();
    const customerId = sub?.stripe_customer_id as string | undefined;

    // Fetch invoice row
    const { data: inv } = await admin
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .eq('tenant_id', profile.tenant_id)
      .single();
    if (!inv) throw new Error('Invoice not found');
    const balance = Number(inv.balance ?? Math.max(0, Number(inv.total || 0) - Number(inv.paid_amount || 0)));
    if (balance <= 0) return NextResponse.json({ ok: true, alreadyPaid: true });

    // Create Payment Link or Checkout Session for one-off payment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://admin.detailor.co.uk';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      success_url: `${appUrl}/customer/account?paid_invoice=${invoiceId}`,
      cancel_url: `${appUrl}/customer/account`,
      customer: customerId,
      customer_email: profile.email || undefined,
      line_items: [
        {
          price_data: {
            currency: 'gbp',
            product_data: { name: `Invoice ${inv.number}` },
            unit_amount: Math.round(balance * 100),
          },
          quantity: 1,
        },
      ],
      metadata: { app_invoice_id: invoiceId },
    });

    return NextResponse.json({ ok: true, url: session.url });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


