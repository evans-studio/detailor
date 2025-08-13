export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { createSuccessResponse, createErrorResponse, API_ERROR_CODES } from '@/lib/api-response';
import { sendTestEmail, sendBookingConfirmation, sendWelcomeEmail, sendPasswordReset } from '@/lib/email';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { type, email } = body;

    if (!email) {
      return createErrorResponse(API_ERROR_CODES.MISSING_REQUIRED_FIELD, 'Email address required', { field: 'email' }, 400);
    }

    let result = false;

    switch (type) {
      case 'test':
        result = await sendTestEmail(email);
        break;
      
      case 'booking-confirmation':
        result = await sendBookingConfirmation({
          id: 'test-123',
          reference: 'DEMO-001',
          service_name: 'Full Detail Service',
          customer_name: 'Test Customer',
          customer_email: email,
          start_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          end_at: new Date(Date.now() + 90000000).toISOString(),
          address: '123 Test Street, Test City, TS1 2AB',
          vehicle_name: '2020 BMW X5',
          price_breakdown: { total: 85.99 },
          tenant_name: 'Demo Auto Detailing',
        });
        break;
      
      case 'welcome':
        result = await sendWelcomeEmail({
          tenant_name: 'Demo Auto Detailing',
          admin_email: email,
          admin_name: 'Test Admin',
        });
        break;
      
      case 'password-reset':
        result = await sendPasswordReset({
          email: email,
          reset_link: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=demo-token-123`,
          name: 'Test User',
        });
        break;
      
      default:
        return createErrorResponse(API_ERROR_CODES.INVALID_INPUT, 'Invalid email type', { type }, 400);
    }

    return createSuccessResponse({ message: result ? 'Email sent successfully' : 'Failed to send email', type, sent_to: email, ok: result });
  } catch (error: unknown) {
    console.error('Email test error:', error);
    return createErrorResponse(API_ERROR_CODES.INTERNAL_ERROR, (error as Error).message, undefined, 500);
  }
}