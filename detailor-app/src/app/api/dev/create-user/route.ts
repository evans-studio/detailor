export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const bodySchema = z.object({ 
  email: z.string().email(), 
  password: z.string().min(6),
  role: z.enum(['admin', 'staff', 'customer']).default('admin'),
  fullName: z.string().optional()
});

export async function POST(req: Request) {
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ ok: false, error: 'Disabled in production' }, { status: 403 });
  }
  
  try {
    const body = await req.json();
    const { email, password, role, fullName } = bodySchema.parse(body);
    
    const admin = getSupabaseAdmin();
    
    // Check if user already exists
    const { data: existingUsers } = await admin.auth.admin.listUsers();
    const userExists = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (userExists) {
      return NextResponse.json({ 
        ok: false, 
        error: `User with email ${email} already exists` 
      }, { status: 400 });
    }
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await admin.auth.admin.createUser({
      email: email.toLowerCase().trim(),
      password,
      email_confirm: true, // Skip email verification in dev
      user_metadata: {
        role,
        full_name: fullName || email.split('@')[0]
      }
    });
    
    if (authError) throw authError;
    
    // Create profile
    const { error: profileError } = await admin
      .from('profiles')
      .insert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName || email.split('@')[0],
        role: role
      });
    
    if (profileError) {
      console.warn('Profile creation failed:', profileError);
      // Don't throw - user was created successfully in auth
    }
    
    // If admin role, create a basic tenant
    if (role === 'admin') {
      const { data: tenant, error: tenantError } = await admin
        .from('tenants')
        .insert({
          legal_name: `${fullName || email.split('@')[0]} Business`,
          contact_email: email,
          timezone: 'Europe/London',
          currency: 'GBP'
        })
        .select('id')
        .single();
      
      if (!tenantError && tenant) {
        // Update profile with tenant_id
        await admin
          .from('profiles')
          .update({ tenant_id: tenant.id })
          .eq('id', authData.user.id);
      }
    }
    
    return NextResponse.json({
      ok: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        role,
        created: true,
        message: 'User created successfully. You can now sign in with these credentials.'
      }
    });
    
  } catch (error: unknown) {
    return NextResponse.json({ 
      ok: false, 
      error: (error as Error).message 
    }, { status: 400 });
  }
}


