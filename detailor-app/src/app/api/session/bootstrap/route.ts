export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import Stripe from 'stripe';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

function generateTempPassword(): string {
  const bytes = crypto.randomBytes(12).toString('hex');
  return `${bytes}Aa1!`;
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { session_id } = body as { session_id?: string };
    if (!session_id) return createErrorResponse(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 'Missing session_id', { field: 'session_id' }, 400);

    const stripeKey = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!stripeKey) return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Server not configured', undefined, 500);
    
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['customer'] });
    const email = (session.customer_details?.email || session.customer_email) as string | undefined;
    if (!email) return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'No email on checkout session', undefined, 400);

    const admin = getSupabaseAdmin();
    
    console.log(`[bootstrap] Processing session for ${email}`);
    
    // Fast lookup using profile table (much faster than listUsers)
    const { data: profile } = await admin.from('profiles').select('id, tenant_id, role, email').eq('email', email).maybeSingle();
    const { data: tenant } = await admin.from('tenants').select('id, contact_email').eq('contact_email', email).maybeSingle();
    
    console.log(`[bootstrap] Profile found: ${!!profile}, Tenant found: ${!!tenant}`);
    
    if (profile && tenant && profile.tenant_id) {
      // User has complete setup - they should be able to login normally
      console.log(`[bootstrap] User ${email} has complete setup - redirecting to normal login`);
      return createSuccessResponse({ exists: true, complete: true, email, message: 'Account is fully set up. Please use normal login or password reset if needed.' });
    }
    
    if (profile && !tenant) {
      // User exists but no tenant - unusual state, webhook should have created tenant
      console.warn(`[bootstrap] User ${email} has profile but no tenant - broken state`);
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Account setup incomplete: missing business tenant. Please contact support.', { code: 'MISSING_TENANT' }, 400);
    }
    
    if (!profile && tenant) {
      // Tenant exists but no profile - can happen during webhook processing
      console.log(`[bootstrap] Tenant exists for ${email} but no profile - webhook may be processing`);
      return createSuccessResponse({ exists: true, needsSetup: true, email, message: 'Business account found. Setup is in progress.' });
    }
    
    if (!profile && !tenant) {
      // Neither exists - webhook should have created both after Stripe checkout
      console.warn(`[bootstrap] No profile or tenant found for ${email} after checkout`);
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'Account not found after payment. Please wait a moment for setup to complete, or contact support if this persists.', { code: 'SETUP_PENDING' }, 404);
    }

    // This line should never be reached due to the exhaustive checks above
    console.error('[bootstrap] Unexpected code path reached', email);
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Unexpected error during account verification. Please contact support.', { code: 'UNEXPECTED_STATE' }, 500);

  } catch (e) {
    console.error('[bootstrap] error', (e as Error).message);
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/session/bootstrap' }, 400);
  }
}


