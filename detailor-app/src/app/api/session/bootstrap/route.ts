export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
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
    if (!session_id) return NextResponse.json({ ok: false, error: 'Missing session_id' }, { status: 400 });

    const stripeKey = process.env.STRIPE_SECRET_KEY as string | undefined;
    if (!stripeKey) return NextResponse.json({ ok: false, error: 'Server not configured' }, { status: 500 });
    const stripe = new Stripe(stripeKey);
    const session = await stripe.checkout.sessions.retrieve(session_id, { expand: ['customer'] });
    const email = (session.customer_details?.email || session.customer_email) as string | undefined;
    if (!email) return NextResponse.json({ ok: false, error: 'No email on checkout session' }, { status: 400 });

    const admin = getSupabaseAdmin();
    // Attempt to create the user with a temporary password
    const tempPassword = generateTempPassword();
    const created = await admin.auth.admin.createUser({
      email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        stripe_customer_id: session.customer as string,
        plan: (session.metadata as Record<string, string> | null | undefined)?.plan || 'starter',
      },
    });

    if (!created.error) {
      // Successfully created; sign in with temp password to get access token
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
      const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
      const userClient = createClient(supabaseUrl, anon, { auth: { persistSession: false, autoRefreshToken: false } });
      const signIn = await userClient.auth.signInWithPassword({ email, password: tempPassword });
      if (signIn.error || !signIn.data.session) {
        return NextResponse.json({ ok: false, error: 'Sign-in failed' }, { status: 400 });
      }
      const accessToken = signIn.data.session.access_token;
      const refreshToken = signIn.data.session.refresh_token as string | null;
      // Configure cookies (domain, security)
      const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').trim();
      const cookieDomain = process.env.NODE_ENV === 'production' && rootDomain
        ? (rootDomain.startsWith('.') ? rootDomain : `.${rootDomain}`)
        : undefined;
      const secure = process.env.NODE_ENV === 'production';

      // Link profile with correct role (admin if email == tenant.contact_email)
      try {
        const { data: tenant } = await admin.from('tenants').select('id, contact_email').eq('contact_email', email).maybeSingle();
        const uid = signIn.data.user?.id as string | undefined;
        
        if (tenant?.id && uid) {
          // Tenant exists, link profile
          await admin.from('profiles').upsert({ id: uid, email, tenant_id: tenant.id, role: 'admin' }, { onConflict: 'id' });
          console.log('[bootstrap] linked profile to existing tenant', email, tenant.id);
        } else if (uid) {
          // No tenant found, create placeholder profile for onboarding
          await admin.from('profiles').upsert({ id: uid, email, tenant_id: null, role: 'admin' }, { onConflict: 'id' });
          console.log('[bootstrap] created orphaned profile for onboarding', email);
        }
      } catch (profileError) {
        console.warn('[bootstrap] profile linking failed', email, (profileError as Error).message);
        // Continue anyway - let onboarding handle tenant creation
      }

      // Build response and set cookies so subsequent API calls are authenticated
      const res = NextResponse.json({ ok: true, access_token: accessToken, refresh_token: refreshToken, email });
      // Access token cookie (short-lived)
      res.cookies.set('sb-access-token', accessToken, {
        httpOnly: true,
        secure,
        sameSite: 'lax',
        path: '/',
        domain: cookieDomain,
        maxAge: 60 * 60 * 8, // 8 hours
      });
      // Refresh token cookie (longer-lived) if present
      if (refreshToken) {
        res.cookies.set('sb-refresh-token', refreshToken, {
          httpOnly: true,
          secure,
          sameSite: 'lax',
          path: '/',
          domain: cookieDomain,
          maxAge: 60 * 60 * 24 * 14, // 14 days
        });
      }
      // Log for debugging
      console.log('[bootstrap] session established for', email, 'cookieDomain=', cookieDomain);
      return res;
    }

    // If creation failed, assume user exists already; cannot auto-sign-in without known password
    return NextResponse.json({ ok: true, exists: true, email });
  } catch (e) {
    console.error('[bootstrap] error', (e as Error).message);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


