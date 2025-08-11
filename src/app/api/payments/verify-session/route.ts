export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { session_id } = body as { session_id?: string };
    
    if (!session_id) {
      return NextResponse.json({ ok: false, error: 'Missing session_id' }, { status: 400 });
    }

    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secret) {
      return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 });
    }

    const stripe = new Stripe(secret);

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (session.payment_status !== 'paid') {
      return NextResponse.json({ ok: false, error: 'Payment not completed' }, { status: 400 });
    }

    return NextResponse.json({ 
      ok: true, 
      session: {
        id: session.id,
        payment_status: session.payment_status,
        amount_total: session.amount_total,
        currency: session.currency,
        customer_email: session.customer_details?.email,
        metadata: session.metadata
      }
    });

  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}