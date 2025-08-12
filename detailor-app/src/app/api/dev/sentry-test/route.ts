export const runtime = 'nodejs';
import { NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

export async function GET(req: Request) {
  try {
    // Test different types of errors
    const url = new URL(req.url);
    const errorType = url.searchParams.get('type') || 'generic';

    switch (errorType) {
      case 'generic':
        throw new Error('This is a test error for Sentry monitoring');
      
      case 'api':
        // Simulate an API error
        const response = await fetch('https://httpstat.us/500');
        if (!response.ok) {
          throw new Error(`API call failed: ${response.status}`);
        }
        break;
      
      case 'database':
        // Simulate a database error
        throw new Error('Database connection failed - test error');
      
      case 'validation':
        // Simulate validation error with context
        Sentry.setContext('validation', {
          field: 'email',
          value: 'invalid-email',
          rule: 'email format',
        });
        throw new Error('Validation failed: invalid email format');
      
      case 'user':
        // Simulate error with user context
        Sentry.setUser({
          id: 'test-user-123',
          email: 'test@example.com',
          username: 'testuser',
        });
        throw new Error('User action failed - test error');
      
      default:
        throw new Error('Unknown error type');
    }

    return NextResponse.json({ 
      ok: true, 
      message: 'No error triggered',
      type: errorType
    });
  } catch (error) {
    // Capture the error in Sentry
    Sentry.captureException(error);
    
    return NextResponse.json({
      ok: false,
      error: (error as Error).message,
      message: 'Error captured by Sentry'
    }, { status: 500 });
  }
}