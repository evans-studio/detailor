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
    
    // First, check if user already exists and is properly set up
    const { data: existingUser } = await admin.auth.admin.listUsers();
    const userWithEmail = existingUser.users.find(u => u.email === email);
    
    if (userWithEmail) {
      // User exists, check if they have complete records
      const { data: profile } = await admin.from('profiles').select('id, tenant_id, role').eq('id', userWithEmail.id).maybeSingle();
      const { data: tenant } = await admin.from('tenants').select('id, contact_email').eq('contact_email', email).maybeSingle();
      
      if (profile && tenant && profile.tenant_id) {
        // User is properly set up, try to sign them in
        try {
          // Generate a new temporary password for existing user
          const tempPassword = generateTempPassword();
          await admin.auth.admin.updateUserById(userWithEmail.id, { password: tempPassword });
          
          // Sign in with the new temporary password
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
          const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;
          const userClient = createClient(supabaseUrl, anon, { auth: { persistSession: false, autoRefreshToken: false } });
          const signIn = await userClient.auth.signInWithPassword({ email, password: tempPassword });
          
          if (signIn.data.session) {
            const accessToken = signIn.data.session.access_token;
            const refreshToken = signIn.data.session.refresh_token as string | null;
            
            // Configure cookies
            const rootDomain = (process.env.NEXT_PUBLIC_ROOT_DOMAIN || '').trim();
            const cookieDomain = process.env.NODE_ENV === 'production' && rootDomain
              ? (rootDomain.startsWith('.') ? rootDomain : `.${rootDomain}`)
              : undefined;
            const secure = process.env.NODE_ENV === 'production';

            const res = NextResponse.json({ ok: true, access_token: accessToken, refresh_token: refreshToken, email });
            res.cookies.set('sb-access-token', accessToken, {
              httpOnly: true,
              secure,
              sameSite: 'lax',
              path: '/',
              domain: cookieDomain,
              maxAge: 60 * 60 * 8, // 8 hours
            });
            
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
            
            console.log('[bootstrap] existing user signed in', email);
            return res;
          }
        } catch (signInError) {
          console.error('[bootstrap] sign-in failed for existing user', email, (signInError as Error).message);
        }
      } else {
        // User exists but incomplete setup - fix their records
        console.log('[bootstrap] fixing incomplete user records', email);
        try {
          if (tenant && !profile) {
            // Create missing profile
            await admin.from('profiles').upsert({ 
              id: userWithEmail.id, 
              email, 
              tenant_id: tenant.id, 
              role: 'admin' 
            }, { onConflict: 'id' });
            console.log('[bootstrap] created missing profile for existing user', email);
          } else if (!tenant && userWithEmail.id) {
            // This will be handled by the webhook when it processes the Stripe session
            console.log('[bootstrap] user exists but no tenant - webhook should handle', email);
          }
        } catch (fixError) {
          console.error('[bootstrap] failed to fix incomplete records', email, (fixError as Error).message);
        }
      }
    }

    // For new users or users that couldn't be signed in, return exists flag
    // This tells the client that they should either use normal signup flow or wait for webhook processing
    if (userWithEmail) {
      return NextResponse.json({ ok: true, exists: true, email, needsSetup: true });
    }

    // User doesn't exist yet - this is unusual since they completed Stripe checkout
    // The webhook should have created them. Return error for investigation.
    console.warn('[bootstrap] user not found after Stripe checkout', email);
    return NextResponse.json({ 
      ok: false, 
      error: 'Account not found. Please wait a moment and try again, or contact support if the issue persists.',
      code: 'USER_NOT_FOUND_AFTER_CHECKOUT'
    }, { status: 400 });

  } catch (e) {
    console.error('[bootstrap] error', (e as Error).message);
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}


