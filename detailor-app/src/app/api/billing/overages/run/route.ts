export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

function previousMonthRange(): { start: string; end: string; label: string } {
  const now = new Date();
  const startDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const endDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const label = `${startDate.getUTCFullYear()}-${String(startDate.getUTCMonth() + 1).padStart(2, '0')}`;
  return { start: startDate.toISOString(), end: endDate.toISOString(), label };
}

export async function POST(req: Request) {
  try {
    // Optional: simple auth guard via header
    const secretHeader = req.headers.get('x-admin-secret');
    const allowed = process.env.BILLING_ADMIN_SECRET || '';
    if (allowed && secretHeader !== allowed) {
      return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Forbidden', undefined, 403);
    }

    const admin = getSupabaseAdmin();
    const secret = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!secret) throw new Error('Stripe not configured');
    const stripe = new Stripe(secret);

    // Pull all active subscriptions with stripe customer
    const { data: subs, error: subErr } = await admin
      .from('subscriptions')
      .select('tenant_id, stripe_customer_id')
      .neq('stripe_customer_id', null);
    if (subErr) throw subErr;

    const { start, end, label } = previousMonthRange();
    const results: Array<{ tenant_id: string; bookings_over: number; amount_gbp: number; invoice_id?: string }> = [];

    for (const s of subs || []) {
      const tenantId = s.tenant_id as string;
      // Load feature flags for rates/limits
      const { data: tenant } = await admin.from('tenants').select('feature_flags').eq('id', tenantId).single();
      const ff = (tenant?.feature_flags as Record<string, unknown>) || {};
      const limit = ff.bookings_limit as number | null;
      const buffer = 5;
      const rate = Number(ff.overage_fee ?? 0);

      // Count bookings last month
      let used = 0;
      if (limit !== null && limit > 0) {
        const { data: rows } = await admin
          .from('bookings')
          .select('id', { count: 'exact', head: true })
          .eq('tenant_id', tenantId)
          .gte('created_at', start)
          .lt('created_at', end);
        used = (rows as unknown as { length?: number } | null)?.length || 0; // count already computed in header, but SDK's head: true won't return data
        // Fallback precise count
        if (!used) {
          const { data: list } = await admin
            .from('bookings')
            .select('id')
            .eq('tenant_id', tenantId)
            .gte('created_at', start)
            .lt('created_at', end);
          used = list?.length || 0;
        }
      }

      const billable = limit === null ? 0 : Math.max(0, used - (limit + buffer));
      const amount = Math.max(0, billable * rate);

      if (amount > 0 && s.stripe_customer_id) {
        const desc = `Overage charges for ${label}: ${billable} bookings over cap`;
        await stripe.invoiceItems.create({
          customer: s.stripe_customer_id as string,
          currency: 'gbp',
          amount: Math.round(amount * 100),
          description: desc,
        });
        const invoice = await stripe.invoices.create({
          customer: s.stripe_customer_id as string,
          collection_method: 'charge_automatically',
          description: `Monthly overage charges (${label})`,
          auto_advance: true,
        });
        await stripe.invoices.finalizeInvoice(invoice.id as string);
        results.push({ tenant_id: tenantId, bookings_over: billable, amount_gbp: amount, invoice_id: invoice.id });
      } else {
        results.push({ tenant_id: tenantId, bookings_over: billable, amount_gbp: amount });
      }
    }

    return createSuccessResponse({ results });
  } catch (e) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/billing/overages/run' }, 400);
  }
}


