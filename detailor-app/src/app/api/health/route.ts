import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const timestamp = new Date().toISOString();
  let dbConnected = false;
  let emailConfigured = false;
  let stripeConfigured = false;
  let sentryConfigured = false;

  // Check environment variables
  const envLoaded = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Check database connection
  try {
    const admin = getSupabaseAdmin();
    const { data } = await admin.from('tenants').select('id').limit(1);
    dbConnected = Boolean(data);
  } catch (error) {
    console.error('Database health check failed:', error);
    dbConnected = false;
  }

  // Check email configuration
  emailConfigured = Boolean(process.env.RESEND_API_KEY);

  // Check Stripe configuration
  stripeConfigured = Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY
  );

  // Check Sentry configuration
  sentryConfigured = Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN);

  const healthy = envLoaded && dbConnected && emailConfigured && stripeConfigured;

  return NextResponse.json({
    success: healthy,
    data: {
      status: healthy ? 'healthy' : 'degraded',
      checks: {
        environment: envLoaded,
        database: dbConnected,
        email: emailConfigured,
        payments: stripeConfigured,
        monitoring: sentryConfigured,
      },
      version: process.env.npm_package_version || '1.0.0',
    },
    meta: {
      timestamp,
    }
  }, { 
    status: healthy ? 200 : 503 
  });
}


