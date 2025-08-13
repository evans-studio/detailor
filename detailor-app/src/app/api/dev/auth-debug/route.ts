export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const bodySchema = z.object({ email: z.string().email() });

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return createErrorResponse(API_ERROR_CODES.FORBIDDEN, 'Disabled in production', undefined, 403);
  }
  
  try {
    const body = await req.json();
    const { email } = bodySchema.parse(body);
    
    // Debug information about the user account
    const admin = getSupabaseAdmin();
    
    // Check if user exists in auth.users
    const { data: authUsers, error: authError } = await admin.auth.admin.listUsers();
    const userExists = authUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    // Check user profile if exists
    let profile = null;
    if (userExists) {
      const { data: profileData } = await admin
        .from('profiles')
        .select('*')
        .eq('id', userExists.id)
        .single();
      profile = profileData;
    }
    
    return createSuccessResponse({
      debug: {
        email: email.toLowerCase().trim(),
        userExists: !!userExists,
        userId: userExists?.id,
        emailConfirmed: userExists?.email_confirmed_at !== null,
        lastSignIn: userExists?.last_sign_in_at,
        createdAt: userExists?.created_at,
        profile: profile ? {
          role: profile.role,
          tenantId: profile.tenant_id,
          fullName: profile.full_name
        } : null,
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        totalUsers: authUsers?.users?.length || 0
      }
    });
    
  } catch (error: unknown) {
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }, 400);
  }
}