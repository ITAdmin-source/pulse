import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Environment configuration
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.NODE_ENV,

  // Performance Monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0, // 10% in prod, 100% in dev

  // Session Replay for debugging production issues
  replaysSessionSampleRate: 0.1, // 10% of sessions
  replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors

  integrations: [
    Sentry.replayIntegration({
      // Privacy settings for Hebrew content
      maskAllText: false, // Set to true if you want to mask Hebrew text
      blockAllMedia: true, // Don't capture images/videos
    }),
    Sentry.browserTracingIntegration(),
  ],

  // Configure trace propagation
  tracePropagationTargets: ["localhost", /^https:\/\/crowdsource\.co\.il/],

  // Filter out known noise
  ignoreErrors: [
    // Browser extensions
    "ResizeObserver loop limit exceeded",
    "Non-Error promise rejection captured",
    // Network errors that we can't control
    "NetworkError",
    "Failed to fetch",
  ],

  // Custom tags for better filtering
  beforeSend(event, hint) {
    // Add custom context
    if (event.contexts) {
      event.contexts.app = {
        language: "he",
        direction: "rtl",
        platform: "polling",
      };
    }

    // Filter out development errors
    if (process.env.NODE_ENV === "development") {
      console.log("[Sentry Dev]", event);
      return null; // Don't send to Sentry in dev
    }

    return event;
  },
});
