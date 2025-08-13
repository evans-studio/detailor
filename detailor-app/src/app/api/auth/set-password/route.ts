export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
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
            return createErrorResponse(
              API_ERROR_CODES.FORBIDDEN,
              'Session email mismatch',
              { expected: sessionEmail, actual: email },
              403
            );
          }
          
          if (session.payment_status !== 'paid') {
            return createErrorResponse(
              API_ERROR_CODES.PAYMENT_ERROR,
              'Payment not completed',
              { status: session.payment_status },
              403
            );
          }
        } catch (stripeError) {
          console.error('[set-password] Stripe verification failed:', stripeError);
          return createErrorResponse(API_ERROR_CODES.PAYMENT_ERROR, 'Unable to verify payment session', undefined, 403);
        }
      }
    }
    
    // Find the existing user by email
    const { data: users, error: listError } = await admin.auth.admin.listUsers();
    if (listError) {
      console.error('[set-password] Failed to list users:', listError);
      return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Unable to verify user', undefined, 500);
    }
    
    const existingUser = users.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    if (!existingUser) {
      return createErrorResponse(API_ERROR_CODES.RECORD_NOT_FOUND, 'User not found. Please contact support.', { email }, 404);
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
      return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'Failed to update password', undefined, 500);
    }
    
    console.log(`[set-password] Password updated successfully for ${email}`);
    
    return createSuccessResponse({ message: 'Password set successfully' });
    
  } catch (error) {
    console.error('[set-password] Unexpected error:', error);
    
    if (error instanceof z.ZodError) {
      return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'Invalid request data', error.issues, 400);
    }
    
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, 'An unexpected error occurred', undefined, 500);
  }
}