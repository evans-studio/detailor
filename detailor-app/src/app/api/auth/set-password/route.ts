export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  session_id: z.string().optional() // Stripe session ID for additional security
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password, session_id } = bodySchema.parse(body);
    
    const admin = getSupabaseAdmin();
    
    // Additional security: verify this is a legitimate password set request
    if (session_id) {
      // Verify the Stripe session to ensure this is a legitimate post-payment password set
      const stripeKey = process.env.STRIPE_SECRET_KEY;
      if (stripeKey) {
        try {
          const Stripe = (await import('stripe')).default;
          const stripe = new Stripe(stripeKey);
          const session = await stripe.checkout.sessions.retrieve(session_id);
          const sessionEmail = session.customer_details?.email || session.customer_email;
          
          if (sessionEmail?.toLowerCase() !== email.toLowerCase()) {
            return NextResponse.json({
              ok: false,
              error: 'Session email mismatch'
            }, { status: 403 });
          }
          
          if (session.payment_status !== 'paid') {
            return NextResponse.json({
              ok: false,
              error: 'Payment not completed'
            }, { status: 403 });
          }
        } catch (stripeError) {
          console.error('[set-password] Stripe verification failed:', stripeError);
          return NextResponse.json({
            ok: false,
            error: 'Unable to verify payment session'
          }, { status: 403 });
        }
      }
    }
    
    // Find the existing user by email
    const { data: users, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      console.error('[set-password] Failed to list users:', listError);
      return NextResponse.json({
        ok: false,
        error: 'Unable to verify user'
      }, { status: 500 });
    }
    
    const existingUser = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!existingUser) {
      return NextResponse.json({
        ok: false,
        error: 'User not found. Please contact support.'
      }, { status: 404 });
    }
    
    console.log(`[set-password] Updating password for user: ${existingUser.id} (${email})`);
    
    // Update the existing user's password and clear temp password flag
    const { error: updateError } = await admin.auth.admin.updateUserById(existingUser.id, {
      password: password,
      email_confirm: true, // Ensure user is confirmed after setting password
      user_metadata: {
        ...existingUser.user_metadata,
        temp_password: false, // Clear temp password flag
        password_set_at: new Date().toISOString()
      }
    });
    
    if (updateError) {
      console.error('[set-password] Failed to update password:', updateError);
      return NextResponse.json({
        ok: false,
        error: 'Failed to update password'
      }, { status: 500 });
    }
    
    console.log(`[set-password] Password updated successfully for ${email}`);
    
    return NextResponse.json({
      ok: true,
      message: 'Password set successfully'
    });
    
  } catch (error) {
    console.error('[set-password] Unexpected error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        ok: false,
        error: 'Invalid request data',
        details: error.issues
      }, { status: 400 });
    }
    
    return NextResponse.json({
      ok: false,
      error: 'An unexpected error occurred'
    }, { status: 500 });
  }
}