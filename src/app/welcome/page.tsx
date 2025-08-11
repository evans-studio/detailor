export const runtime = 'nodejs';
import Stripe from 'stripe';

export default async function WelcomePage({ searchParams }: { searchParams: Promise<{ session_id?: string }> }) {
  const sp = await searchParams;
  const sessionId = sp?.session_id;
  let status: 'ok' | 'error' = 'ok';
  let message = 'Subscription confirmed. Your workspace is being prepared.';
  let customerEmail: string | null = null;
  try {
    if (!sessionId) throw new Error('Missing session id');
    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secret) throw new Error('Server not configured');
    const stripe = new Stripe(secret);
    const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['customer', 'subscription'] });
    customerEmail = (session.customer_details?.email || session.customer_email) ?? null;
    if (session.status !== 'complete') {
      status = 'error';
      message = 'Checkout not completed.';
    }
  } catch (e) {
    status = 'error';
    message = (e as Error).message;
  }
  return (
    <main className="min-h-screen grid place-items-center p-6">
      <div className="max-w-lg w-full rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center">
        <h1 className="text-[var(--font-size-2xl)] font-semibold mb-2">Welcome to DetailFlow</h1>
        <p className="text-[var(--color-text-muted)] mb-4">{message}</p>
        {customerEmail ? <div className="mb-4 text-sm">Signed up as: {customerEmail}</div> : null}
        <div className="flex justify-center gap-2">
          <a href="/onboarding" className="inline-block rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 py-2 text-[var(--color-primary-foreground)]">Start Onboarding</a>
          <a href="/dashboard" className="inline-block rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 py-2">Skip for now</a>
        </div>
      </div>
    </main>
  );
}


