import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  // Edge runtime has stricter limits, sample less
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.01 : 1.0, // 1% in prod

  // Edge runtime specific config
  beforeSend(event) {
    if (event.contexts) {
      event.contexts.runtime = {
        name: "vercel-edge",
        type: "edge",
      };
    }

    // Filter out development errors
    if (process.env.NODE_ENV === "development") {
      console.error("[Sentry Edge Dev]", event);
      return null;
    }

    return event;
  },
});
