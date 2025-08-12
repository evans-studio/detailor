// This file configures the initialization of Sentry on the browser/client side
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  integrations: [
    Sentry.replayIntegration(),
  ],
  // Performance Monitoring
  tracesSampleRate: 1.0,
  // Capture Replay for 10% of all sessions,
  // plus for 100% of sessions with an error
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // Debug mode in development
  debug: process.env.NODE_ENV === "development",
  environment: process.env.NODE_ENV,
  beforeSend(event) {
    // Filter out non-production errors in development
    if (process.env.NODE_ENV === "development") {
      return null;
    }
    return event;
  },
});