export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import Stripe from 'stripe';
import { getUserFromRequest } from '@/lib/authServer';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { checkRateLimit, isValidUuid } from '@/lib/security';

const schema = z.object({
  payment_id: z.string().uuid(),
  amount: z.number().positive().optional(),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const { user } = await getUserFromRequest(req);
    
    // Rate limiting for refunds (sensitive operation)
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (!checkRateLimit(`refund-${user.id}-${ip}`, 5, 300000)) { // 5 refunds per 5 minutes
      return NextResponse.json({ ok: false, error: 'Rate limit exceeded' }, { status: 429 });
    }
    
    const admin = getSupabaseAdmin();
    const payload = schema.parse(await req.json());
    
    // Validate payment_id format
    if (!isValidUuid(payload.payment_id)) {
      throw new Error('Invalid payment ID format');
    }
    
    const { data: profile } = await admin.from('profiles').select('tenant_id, role').eq('id', user.id).single();
    if (!profile || !['staff','admin'].includes(profile.role)) throw new Error('Forbidden');

    // Get payment details with additional validation
    const { data: payment } = await admin
      .from('payments')
      .select('*')
      .eq('id', payload.payment_id)
      .eq('tenant_id', profile.tenant_id)
      .single();
    
    if (!payment) throw new Error('Payment not found');
    
    // Check if payment is eligible for refund
    if (payment.status === 'refunded') {
      throw new Error('Payment has already been refunded');
    }
    
    if (payment.status !== 'succeeded') {
      throw new Error('Only successful payments can be refunded');
    }
    
    // Calculate refund amount
    const refundAmount = payload.amount || Number(payment.amount);
    const alreadyRefunded = Number(payment.refunded_amount || 0);
    const maxRefundable = Number(payment.amount) - alreadyRefunded;
    
    if (refundAmount > maxRefundable) {
      throw new Error(`Maximum refundable amount is ${maxRefundable}`);
    }

    let stripeRefundId = null;
    let refundStatus = 'succeeded';

    // Check if this is a demo tenant
    const { data: tenant } = await admin.from('tenants').select('is_demo').eq('id', profile.tenant_id).single();
    const isDemoTenant = tenant?.is_demo;

    // Process Stripe refund for non-demo tenants
    if (!isDemoTenant && payment.provider === 'stripe' && payment.external_txn_id) {
      try {
        const secret = process.env.STRIPE_SECRET_KEY;
        if (!secret) {
          throw new Error('Stripe not configured');
        }

        const stripe = new Stripe(secret);
        
        // Create the refund in Stripe
        const stripeRefund = await stripe.refunds.create({
          payment_intent: payment.external_txn_id,
          amount: Math.round(refundAmount * 100), // Convert to cents
          reason: payload.reason === 'duplicate' ? 'duplicate' : 
                 payload.reason === 'fraudulent' ? 'fraudulent' : 'requested_by_customer',
          metadata: {
            app: 'detailor',
            tenant_id: profile.tenant_id,
            payment_id: payment.id,
            refund_reason: payload.reason || 'requested_by_customer'
          }
        });
        
        stripeRefundId = stripeRefund.id;
        refundStatus = stripeRefund.status === 'succeeded' ? 'succeeded' : 'pending';
        
      } catch (stripeError: unknown) {
        console.error('Stripe refund failed:', stripeError);
        throw new Error(`Refund processing failed: ${(stripeError as Error).message}`);
      }
    }

    // Update payment record
    const newRefundedAmount = alreadyRefunded + refundAmount;
    const newStatus = newRefundedAmount >= Number(payment.amount) ? 'refunded' : 'partially_refunded';
    
    const { data, error } = await admin
      .from('payments')
      .update({ 
        status: newStatus, 
        refunded_amount: newRefundedAmount,
        updated_at: new Date().toISOString()
      })
      .eq('id', payment.id)
      .eq('tenant_id', profile.tenant_id)
      .select('*')
      .single();
    
    if (error) throw error;

    // Create refund record for audit trail
    await admin.from('payments').insert({
      tenant_id: profile.tenant_id,
      booking_id: payment.booking_id,
      invoice_id: payment.invoice_id,
      provider: payment.provider,
      amount: -refundAmount, // Negative amount for refund
      currency: payment.currency,
      external_txn_id: stripeRefundId,
      status: refundStatus,
      idempotency_key: `refund-${payment.id}-${Date.now()}`,
    });

    // Update booking payment status if linked
    if (payment.booking_id) {
      const bookingStatus = newStatus === 'refunded' ? 'refunded' : 'partially_refunded';
      await admin.from('bookings')
        .update({ payment_status: bookingStatus })
        .eq('id', payment.booking_id)
        .eq('tenant_id', profile.tenant_id);
    }

    // Update invoice if linked
    if (payment.invoice_id) {
      const { data: invoice } = await admin
        .from('invoices')
        .select('paid_amount, total')
        .eq('id', payment.invoice_id)
        .single();
      
      if (invoice) {
        const newPaidAmount = Math.max(0, Number(invoice.paid_amount) - refundAmount);
        const newBalance = Number(invoice.total) - newPaidAmount;
        
        await admin.from('invoices')
          .update({ 
            paid_amount: newPaidAmount, 
            balance: newBalance 
          })
          .eq('id', payment.invoice_id)
          .eq('tenant_id', profile.tenant_id);
      }
    }

    return NextResponse.json({ 
      ok: true, 
      payment: data,
      refund: {
        amount: refundAmount,
        status: refundStatus,
        stripe_refund_id: stripeRefundId
      }
    });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


