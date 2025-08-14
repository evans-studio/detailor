export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { createErrorResponse } from '@/lib/api-response';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { sendTenantEmail } from '@/lib/messaging';
import crypto from 'node:crypto';

function generateTempPassword(): string {
  const bytes = crypto.randomBytes(12).toString('hex');
  return `${bytes}Aa1!`;
}

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
  if (!secret || !webhookSecret) return NextResponse.json({ received: true }, { status: 200 });
  const stripe = new Stripe(secret);
  const body = await req.text();
  const sig = (await headers()).get('stripe-signature') as string | undefined;
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig || '', webhookSecret);
  } catch (err) {
    return createErrorResponse('PAYMENT_ERROR', (err as Error).message, { endpoint: 'POST /api/webhooks/stripe' }, 400);
  }

  try {
  const admin = getSupabaseAdmin();
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      const customerId = (session.customer as string) || null;
      const subscriptionId = (session.subscription as string) || null;
      const priceId = (session.line_items?.data?.[0]?.price?.id as string) || (session?.metadata?.price_id as string) || null;
      const email = session.customer_details?.email || session.customer_email || '';
      
      if (!email) {
        console.error('[webhook] No email found in checkout session', session.id);
        return NextResponse.json({ received: true, error: 'No email' }, { status: 200 });
      }

      // If this was a service booking payment (not subscription), record payment + create/update invoice
      if (session.metadata?.type === 'booking_payment') {
        try {
          const admin2 = getSupabaseAdmin();
          const bookingRef = (session.metadata?.booking_reference as string) || '';
          if (bookingRef && session.payment_status === 'paid') {
            const bookingRes = await admin2.from('bookings').select('id, tenant_id, price_breakdown, payment_status').eq('reference', bookingRef).maybeSingle();
            const booking = bookingRes.data as { id: string; tenant_id: string; price_breakdown?: { total?: number }; payment_status?: string } | null;
            if (booking) {
              // Upsert invoice (deposit or final payment)
              const total = Math.round(Number(booking.price_breakdown?.total || 0) * 100) / 100;
              // Create invoice if not exists for this booking
              const invExisting = await admin2.from('invoices').select('id, total, paid_amount, balance, number, tenant_id, booking_id').eq('booking_id', booking.id).eq('tenant_id', booking.tenant_id).maybeSingle();
              let invoiceId = invExisting.data?.id as string | undefined;
              let invoiceNumber = invExisting.data?.number as string | undefined;
              if (!invoiceId) {
                const numGen = await admin2.rpc('generate_invoice_number', { p_tenant_id: booking.tenant_id });
                invoiceNumber = String(numGen.data || '');
                const createInv = await admin2.from('invoices').insert({ tenant_id: booking.tenant_id, booking_id: booking.id, number: invoiceNumber, total, paid_amount: 0, balance: total }).select('id, number').single();
                invoiceId = createInv.data?.id as string | undefined;
              }
              // Record payment
              await admin2.from('payments').insert({
                tenant_id: booking.tenant_id,
                booking_id: booking.id,
                invoice_id: invoiceId || null,
                provider: 'stripe',
                amount: Number(session.amount_total || 0) / 100,
                currency: (session.currency || 'gbp').toUpperCase(),
                external_txn_id: String(session.payment_intent || ''),
                status: 'succeeded',
              });
              // Reconcile invoice
              if (invoiceId) {
                const invRes = await admin2.from('invoices').select('id, total, paid_amount, number, tenant_id, booking_id').eq('id', invoiceId).single();
                const inv = invRes.data as { id: string; total: number; paid_amount: number; number: string; tenant_id: string; booking_id?: string | null };
                const newPaid = Number(inv.paid_amount || 0) + Number(session.amount_total || 0) / 100;
                const newBalance = Math.max(0, Number(inv.total || 0) - newPaid);
                await admin2.from('invoices').update({ paid_amount: newPaid, balance: newBalance }).eq('id', inv.id);
                const newPaymentStatus = newBalance <= 0 ? 'paid' : 'deposit_paid';
                await admin2.from('bookings').update({ payment_status: newPaymentStatus }).eq('id', booking.id).eq('tenant_id', booking.tenant_id);

                // Send branded receipt email (best effort)
                try {
                  const { data: custJoin } = await admin2
                    .from('bookings')
                    .select('customer_id')
                    .eq('id', booking.id)
                    .single();
                  const { data: customer } = await admin2
                    .from('customers')
                    .select('email, name')
                    .eq('id', (custJoin as any)?.customer_id)
                    .single();
                  const { data: tenantRec } = await admin2
                    .from('tenants')
                    .select('trading_name')
                    .eq('id', booking.tenant_id)
                    .single();
                  if (customer?.email) {
                    const tenantName = tenantRec?.trading_name || 'Detailor';
                    const amountPaid = (Number(session.amount_total || 0)/100).toFixed(2);
                    const receiptLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://admin.detailor.co.uk'}/api/invoices/${inv.id}?format=pdf`;
                    await sendTenantEmail({
                      tenantId: booking.tenant_id,
                      to: customer.email,
                      subject: `Your Payment Receipt from ${tenantName} (Invoice ${inv.number})`,
                      html: `<p>Dear ${customer.name || 'Customer'},</p><p>Thank you for your payment of £${amountPaid} for Invoice ${inv.number}.</p><p>Your current balance is £${newBalance.toFixed(2)}.</p><p>You can view and download your invoice here: <a href="${receiptLink}">${receiptLink}</a></p><p>Best regards,<br>${tenantName}</p>`,
                      bookingId: booking.id,
                      customerId: (custJoin as any)?.customer_id,
                      idempotencyKey: `receipt-${session.id}`,
                    });
                  }
                } catch {}
              }
            }
          }
        } catch (err) {
          console.error('[webhook] Failed to reconcile booking payment:', (err as Error).message);
        }
        // Continue without subscription handling for booking payments
        return NextResponse.json({ received: true }, { status: 200 });
      }

      const plan = planFromPriceId(priceId) as Plan;
      const flags = featureFlagsForPlan(plan);

      console.log(`[webhook] Processing checkout completion for ${email}, plan: ${plan}`);

      // Create complete user setup atomically
      try {
        // First, check if user already exists using database lookup (faster than listUsers)
        const { data: existingProfile } = await admin.from('profiles').select('id, email').eq('email', email).maybeSingle();
        let userId = existingProfile?.id;
        let userCreated = false;
        let existingUser = null;

        if (userId) {
          // User exists, get their auth record for reference
          console.log(`[webhook] User profile exists for ${email}, ID: ${userId}`);
          existingUser = { id: userId };
        }

        if (!existingUser) {
          // Create user ready for password setting (no email confirmation needed)
          const tempPassword = generateTempPassword();
          console.log(`[webhook] Creating new user for ${email}`);
          
          const createResult = await admin.auth.admin.createUser({
            email,
            password: tempPassword,
            email_confirm: true, // Skip email confirmation since user paid
            user_metadata: {
              stripe_customer_id: customerId,
              stripe_session_id: session.id,
              plan,
              created_via: 'stripe_webhook',
              temp_password: true // Flag to indicate password needs to be set by user
            },
          });

          if (createResult.error) {
            console.error('[webhook] Failed to create user:', createResult.error);
            throw new Error(`Failed to create user: ${createResult.error.message}`);
          }

          userId = createResult.data.user.id;
          userCreated = true;
          console.log(`[webhook] User created successfully: ${userId}`);
        } else {
          console.log(`[webhook] User already exists: ${userId}`);
        }

        if (!userId) {
          throw new Error('No user ID available');
        }

        // Create or update tenant
        const { data: existingTenant } = await admin.from('tenants').select('id, contact_email').eq('contact_email', email).maybeSingle();
        const tenantPayload = { 
          legal_name: email.split('@')[0] || 'New Business',
          trading_name: null,
          contact_email: email,
          plan, 
          feature_flags: flags as Record<string, unknown>, 
          status: 'active', 
          brand_theme: {},
          business_prefs: {}
        };

        let tenantId = existingTenant?.id as string | undefined;
        if (tenantId) {
          console.log(`[webhook] Updating existing tenant: ${tenantId}`);
          await admin.from('tenants').update({ plan, feature_flags: flags, status: 'active' }).eq('id', tenantId);
        } else {
          console.log(`[webhook] Creating new tenant for ${email}`);
          const tenantResult = await admin.from('tenants').insert(tenantPayload).select('id').single();
          if (tenantResult.error) {
            console.error('[webhook] Failed to create tenant:', tenantResult.error);
            throw new Error(`Failed to create tenant: ${tenantResult.error.message}`);
          }
          tenantId = tenantResult.data?.id;
          console.log(`[webhook] Tenant created: ${tenantId}`);
        }

        if (!tenantId) {
          throw new Error('Failed to create or find tenant');
        }

        // Create or update profile with proper tenant link
        console.log(`[webhook] Creating/updating profile for user ${userId}`);
        const profileResult = await admin.from('profiles').upsert({ 
          id: userId, 
          email, 
          tenant_id: tenantId, 
          role: 'admin',
          full_name: null,
          phone: null
        }, { onConflict: 'id' });

        if (profileResult.error) {
          console.error('[webhook] Failed to create/update profile:', profileResult.error);
          throw new Error(`Failed to create profile: ${profileResult.error.message}`);
        }

        console.log(`[webhook] Profile created/updated successfully for ${email}`);

        // Create subscription record - ALWAYS create one for proper user setup
        console.log(`[webhook] Creating subscription record for tenant ${tenantId}`);
        console.log(`[webhook] Stripe subscription ID: ${subscriptionId || 'none'}, Customer ID: ${customerId}`);
        
        // Always create subscription record, even if Stripe subscription ID is not available yet
        const subPayload = {
          tenant_id: tenantId,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId, // Can be null initially
          price_id: priceId,
          status: subscriptionId ? 'active' : 'trialing', // Default to trial if no subscription ID
          current_period_end: null,
        };
        
        const conflictColumn = subscriptionId ? 'stripe_subscription_id' : 'tenant_id';
        const subResult = await admin.from('subscriptions').upsert(subPayload, { onConflict: conflictColumn });
        
        if (subResult.error) {
          console.error('[webhook] Failed to create subscription:', subResult.error);
          // Don't throw - log error but continue setup process
          console.error('[webhook] Subscription payload was:', subPayload);
        } else {
          console.log(`[webhook] Subscription record created successfully`);
        }

        // Seed default configurations (best-effort, don't fail if these error)
        try {
          console.log(`[webhook] Seeding default configurations for tenant ${tenantId}`);
          
          // Pricing config
          await admin.from('pricing_configs').upsert({ tenant_id: tenantId, currency: 'gbp' }, { onConflict: 'tenant_id' });
          
          // Default services
          const { data: existingServices } = await admin.from('services').select('id').eq('tenant_id', tenantId).limit(1);
          if (!existingServices || existingServices.length === 0) {
            await admin.from('services').insert([
              { tenant_id: tenantId, name: 'Exterior Wash', visible: true, duration_minutes: 60, base_price: 25 },
              { tenant_id: tenantId, name: 'Interior Clean', visible: true, duration_minutes: 45, base_price: 35 },
            ]);
          }
          
          // Default email template
          const { data: existingTemplate } = await admin.from('templates').select('id').eq('tenant_id', tenantId).eq('key', 'booking.confirmation').limit(1);
          if (!existingTemplate || existingTemplate.length === 0) {
            await admin.from('templates').insert([{ 
              tenant_id: tenantId, 
              key: 'booking.confirmation', 
              channel: 'email', 
              active: true,
              subject: 'Booking Confirmed',
              body: 'Your booking has been confirmed.'
            }]);
          }

          console.log(`[webhook] Default configurations seeded successfully`);
        } catch (seedError) {
          console.warn('[webhook] Failed to seed default configurations (non-critical):', (seedError as Error).message);
        }

        // If we created a new user, they can set their password directly
        if (userCreated && userId) {
          console.log(`[webhook] User created and confirmed, ready for password setting: ${email}`);
        }

        console.log(`[webhook] Checkout processing completed successfully for ${email}`);

      } catch (setupError) {
        console.error('[webhook] Failed to create complete user setup:', (setupError as Error).message);
        
        // Log detailed error information for debugging
        console.error('[webhook] Checkout session details:', {
          session_id: session.id,
          email,
          customer_id: customerId,
          subscription_id: subscriptionId,
          plan,
        });
        
        // Don't throw - return success to avoid Stripe retries for non-recoverable errors
        return NextResponse.json({ 
          received: true, 
          error: 'Setup failed', 
          details: (setupError as Error).message 
        }, { status: 200 });
      }

      // Handle invoice payments and add-on purchases
      const appInvoiceId = (session.metadata as Record<string, string> | null | undefined)?.['app_invoice_id'];
      const addonSku = (session.metadata as Record<string, string> | null | undefined)?.['addon_sku'];
      
      if (appInvoiceId && session.payment_status === 'paid') {
        // Apply payment to our invoice and ledger
        try {
          console.log(`[webhook] Processing invoice payment for ${appInvoiceId}`);
          const invRes = await admin.from('invoices').select('id, tenant_id, booking_id, total, paid_amount, balance, number').eq('id', appInvoiceId).maybeSingle();
          const inv = invRes.data as { id: string; tenant_id: string; booking_id?: string | null; total: number; paid_amount: number; balance: number; number: string } | null;
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
              // Send receipt email (best effort)
              try {
                const { data: customerJoin } = await admin
                  .from('bookings')
                  .select('customer_id, tenant_id')
                  .eq('id', inv.booking_id)
                  .single();
                const { data: customer } = await admin
                  .from('customers')
                  .select('email, name')
                  .eq('id', (customerJoin as any)?.customer_id)
                  .single();
                const { data: tenantRec } = await admin
                  .from('tenants')
                  .select('trading_name')
                  .eq('id', inv.tenant_id)
                  .single();
                if (customer?.email) {
                  const tenantName = tenantRec?.trading_name || 'Detailor';
                  const receiptLink = `${process.env.NEXT_PUBLIC_APP_URL || 'https://admin.detailor.co.uk'}/api/invoices/${inv.id}?format=pdf`;
                  await sendTenantEmail({
                    tenantId: inv.tenant_id,
                    to: customer.email,
                    subject: `Your Payment Receipt from ${tenantName} (Invoice ${inv.number})`,
                    html: `<p>Dear ${customer.name || 'Customer'},</p><p>Thank you for your payment of £${paidNow.toFixed(2)} for Invoice ${inv.number}.</p><p>Your current balance is £${newBalance.toFixed(2)}.</p><p>You can view and download your invoice here: <a href=\"${receiptLink}\">${receiptLink}</a></p><p>Best regards,<br>${tenantName}</p>`,
                    bookingId: inv.booking_id,
                    customerId: (customerJoin as any)?.customer_id,
                    idempotencyKey: `receipt-${session.id}`,
                  });
                }
              } catch {}
            }
            console.log(`[webhook] Invoice payment processed successfully`);
          }
        } catch (invoiceError) {
          console.error('[webhook] Failed to process invoice payment:', (invoiceError as Error).message);
        }
      }
      
      // Handle add-on one-time purchases (SMS packs, storage)
      if (addonSku && (session.payment_status === 'paid' || session.payment_status === 'no_payment_required')) {
        try {
          console.log(`[webhook] Processing addon purchase: ${addonSku}`);
          const { data: existingSub } = await admin.from('subscriptions').select('tenant_id').eq('stripe_customer_id', customerId).maybeSingle();
          const tenantId = existingSub?.tenant_id as string | undefined;
          if (tenantId) {
            const { data: tenantRec } = await admin.from('tenants').select('feature_flags').eq('id', tenantId).single();
            const ff = (tenantRec?.feature_flags as Record<string, unknown>) || {};
            if (addonSku.startsWith('sms')) {
              const amount = parseInt(addonSku.replace('sms', ''), 10) || 0;
              const current = Number(ff.sms_credits || 0);
              ff.sms_credits = current + amount;
            }
            if (addonSku === 'storage_5gb') {
              const current = Number(ff.storage_gb || 0);
              ff.storage_gb = current + 5;
            }
            await admin.from('tenants').update({ feature_flags: ff }).eq('id', tenantId);
            console.log(`[webhook] Addon processed successfully: ${addonSku}`);
          }
        } catch (addonError) {
          console.error('[webhook] Failed to process addon:', (addonError as Error).message);
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


