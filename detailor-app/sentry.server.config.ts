// This file configures the initialization of Sentry on the server side
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Performance Monitoring
  tracesSampleRate: 1.0,
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