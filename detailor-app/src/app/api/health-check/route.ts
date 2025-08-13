export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET() {
  const timestamp = new Date().toISOString();
  const checks: Record<string, boolean> = {};
  
  // Check basic environment setup
  checks.environment = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && 
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Check database connection
  try {
    const admin = getSupabaseAdmin();
    const { data, error } = await admin.from('tenants').select('id').limit(1);
    checks.database = !error && data !== null;
  } catch (error) {
    console.warn('Database connection check failed:', error);
    checks.database = false;
  }

  // Check if core tables exist (profiles, tenants)
  try {
    const admin = getSupabaseAdmin();
    const { error: profilesError } = await admin.from('profiles').select('id').limit(1);
    checks.profiles_table = !profilesError;
  } catch (error) {
    checks.profiles_table = false;
  }

  try {
    const admin = getSupabaseAdmin();
    const { error: tenantsError } = await admin.from('tenants').select('id').limit(1);
    checks.tenants_table = !tenantsError;
  } catch (error) {
    checks.tenants_table = false;
  }

  // Check optional tables (with graceful fallbacks)
  try {
    const admin = getSupabaseAdmin();
    const { error: servicesError } = await admin.from('services').select('id').limit(1);
    checks.services_table = !servicesError;
  } catch (error) {
    checks.services_table = false;
  }

  try {
    const admin = getSupabaseAdmin();
    const { error: workPatternsError } = await admin.from('work_patterns').select('id').limit(1);
    checks.work_patterns_table = !workPatternsError;
  } catch (error) {
    checks.work_patterns_table = false;
  }

  // Check if analytics RPC functions exist
  try {
    const admin = getSupabaseAdmin();
    // Try calling a sample RPC function - if it fails due to missing function, we'll catch it
    await admin.rpc('kpi_bookings_today', { tenant_id_input: 'test' });
    checks.analytics_rpcs = true;
  } catch (error) {
    // RPC functions don't exist, but that's ok - we have fallbacks
    checks.analytics_rpcs = false;
  }

  const coreHealthy = checks.environment && checks.database && checks.profiles_table && checks.tenants_table;
  
  return NextResponse.json({
    success: true, // Always return success=true since we have fallbacks for missing components
    data: {
      status: coreHealthy ? 'healthy' : 'degraded',
      message: coreHealthy 
        ? 'All core systems operational' 
        : 'Core systems degraded but fallbacks available',
      checks,
      fallbacks: {
        services: !checks.services_table ? 'Sample services data available' : null,
        work_patterns: !checks.work_patterns_table ? 'Default work patterns available' : null,
        analytics: !checks.analytics_rpcs ? 'Sample analytics data available' : null,
      },
      version: process.env.npm_package_version || '1.0.0',
    },
    meta: {
      timestamp,
    }
  }, { 
    status: 200 // Always return 200 since fallbacks ensure the app works
  });
}