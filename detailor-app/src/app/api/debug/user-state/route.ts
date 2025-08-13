export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return createErrorResponse(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 'Email parameter required', { field: 'email' }, 400);
    }

    const admin = getSupabaseAdmin();
    
    console.log(`[debug] Checking user state for ${email}`);
    
    // Check profile
    const { data: profile, error: profileError } = await admin.from('profiles').select('*').eq('email', email).maybeSingle();
    
    // Check tenant
    const { data: tenant, error: tenantError } = await admin.from('tenants').select('*').eq('contact_email', email).maybeSingle();
    
    // Check subscription
    const { data: subscription, error: subError } = await admin.from('subscriptions').select('*').eq('tenant_id', tenant?.id || 'none').maybeSingle();
    
    // Check if user exists in auth
    let authUser = null;
    try {
      if (profile?.id) {
        const { data: authData } = await admin.auth.admin.getUserById(profile.id);
        authUser = authData?.user ? {
          id: authData.user.id,
          email: authData.user.email,
          email_confirmed_at: authData.user.email_confirmed_at,
          created_at: authData.user.created_at
        } : null;
      }
    } catch (authError) {
      console.warn('[debug] Could not fetch auth user:', (authError as Error).message);
    }

    const state = {
      email,
      profile: profile || null,
      tenant: tenant || null,
      subscription: subscription || null,
      authUser,
      errors: {
        profile: profileError?.message || null,
        tenant: tenantError?.message || null,
        subscription: subError?.message || null,
      },
      analysis: {
        isComplete: !!(profile && tenant && profile.tenant_id && subscription),
        hasProfile: !!profile,
        hasTenant: !!tenant,
        hasSubscription: !!subscription,
        hasAuthUser: !!authUser,
        profileTenantMatch: profile?.tenant_id === tenant?.id,
        issues: [] as string[]
      }
    };

    // Identify issues
    if (!state.analysis.hasProfile) {
      state.analysis.issues.push('No profile found');
    }
    
    if (!state.analysis.hasTenant) {
      state.analysis.issues.push('No tenant found');
    }
    
    if (!state.analysis.hasSubscription) {
      state.analysis.issues.push('No subscription found');
    }
    
    if (!state.analysis.hasAuthUser) {
      state.analysis.issues.push('No auth user found');
    }
    
    if (profile && tenant && !state.analysis.profileTenantMatch) {
      state.analysis.issues.push('Profile and tenant IDs do not match');
    }

    console.log(`[debug] User state analysis for ${email}:`, {
      complete: state.analysis.isComplete,
      issues: state.analysis.issues
    });

    return createSuccessResponse({ state });

  } catch (e) {
    console.error('[debug] Error checking user state:', (e as Error).message);
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'GET /api/debug/user-state' }, 500);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, action } = body;
    
    if (!email) {
      return createErrorResponse(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 'Email required', { field: 'email' }, 400);
    }

    const admin = getSupabaseAdmin();
    
    if (action === 'fix') {
      console.log(`[debug] Attempting to fix user state for ${email}`);
      
      // Get current state
      const { data: profile } = await admin.from('profiles').select('*').eq('email', email).maybeSingle();
      const { data: tenant } = await admin.from('tenants').select('*').eq('contact_email', email).maybeSingle();
      
      if (profile && tenant && profile.tenant_id !== tenant.id) {
        // Fix profile tenant ID mismatch
        await admin.from('profiles').update({ tenant_id: tenant.id }).eq('id', profile.id);
        console.log(`[debug] Fixed profile tenant ID for ${email}`);
      }
      
      if (tenant && !profile) {
        return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'Cannot create profile without user ID. User must be created first.', undefined, 400);
      }
      
      return createSuccessResponse({ message: 'Fixed available issues' });
    }
    
    return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'Invalid action', undefined, 400);

  } catch (e) {
    console.error('[debug] Error fixing user state:', (e as Error).message);
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (e as Error).message, { endpoint: 'POST /api/debug/user-state' }, 500);
  }
}