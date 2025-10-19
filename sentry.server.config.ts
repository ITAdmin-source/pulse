import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  // Performance Monitoring (lower sampling for server to reduce noise)
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 1.0, // 5% in prod

  // Enable database query tracing
  integrations: [
    Sentry.postgresIntegration(),
  ],

  // Filter out known noise
  ignoreErrors: [
    // Database connection pool exhaustion (monitor separately)
    "Connection terminated unexpectedly",
    // Clerk webhook verification (not our issue)
    "Webhook verification failed",
  ],

  // Add custom context for server errors
  beforeSend(event, hint) {
    // Add server-specific context
    if (event.contexts) {
      event.contexts.runtime = {
        name: "vercel",
        type: "serverless",
      };
    }

    // Enhance database errors with query info
    if (hint.originalException && typeof hint.originalException === "object") {
      const error = hint.originalException as any;
      if (error.code && error.code.startsWith("PG")) {
        event.tags = {
          ...event.tags,
          database_error: error.code,
        };
      }
    }

    // Filter out development errors
    if (process.env.NODE_ENV === "development") {
      console.error("[Sentry Server Dev]", event);
      return null;
    }

    return event;
  },
});
