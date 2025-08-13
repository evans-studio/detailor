import * as Sentry from '@sentry/nextjs';

// Server/Edge instrumentation for Next.js 15
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('../sentry.server.config');
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

// Capture framework-level request errors (middleware/route handlers)
export function onRequestError(this: void, err: unknown, request: Request, context?: any): void {
  try {
    Sentry.captureException(err);
  } catch {}
}