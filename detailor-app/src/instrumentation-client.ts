import * as Sentry from '@sentry/nextjs';

export function register(): void {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN || '';
  if (!dsn) return;

  Sentry.init({
    dsn,
    environment: process.env.SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || 'production',
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || 0.1),
    replaysOnErrorSampleRate: Number(process.env.SENTRY_REPLAYS_ONERROR_SAMPLE_RATE || 0),
    replaysSessionSampleRate: Number(process.env.SENTRY_REPLAYS_SESSION_SAMPLE_RATE || 0),
    enabled: process.env.NODE_ENV === 'production' || process.env.ENABLE_SENTRY === 'true',
    integrations: [Sentry.replayIntegration?.()].filter(Boolean) as unknown as never[],
  });
}


