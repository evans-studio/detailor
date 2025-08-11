export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { price_id, email } = body as { price_id?: string; email?: string };
    if (!price_id) return NextResponse.json({ ok: false, error: 'Missing price_id' }, { status: 400 });

    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secret) return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.detailflow.com';
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
        metadata: { app: 'detailflow' },
      },
      metadata: { app: 'detailflow' },
    });

    return NextResponse.json({ ok: true, url: session.url, id: session.id });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const price_id = searchParams.get('price_id') || undefined;
    const email = searchParams.get('email') || undefined;
    if (!price_id) return NextResponse.json({ ok: false, error: 'Missing price_id' }, { status: 400 });

    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secret) return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.detailflow.com';
    const stripe = new Stripe(secret);

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: `${appUrl}/welcome?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing`,
      customer_email: email,
      allow_promotion_codes: true,
      billing_address_collection: 'auto',
      subscription_data: { metadata: { app: 'detailflow' } },
      metadata: { app: 'detailflow' },
    });
    if (session.url) return NextResponse.redirect(session.url, { status: 303 });
    return NextResponse.json({ ok: false, error: 'No checkout URL' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


