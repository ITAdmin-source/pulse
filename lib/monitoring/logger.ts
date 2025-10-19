/**
 * Centralized logging utility for production monitoring
 * Integrates with Sentry for error tracking and performance monitoring
 */

import * as Sentry from "@sentry/nextjs";

interface LogContext {
  userId?: string;
  pollId?: string;
  sessionId?: string;
  action?: string;
  duration?: number;
  metadata?: Record<string, unknown>;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  /**
   * Log an informational message
   */
  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[INFO] ${message}`, context);
    }

    if (this.isProduction && context) {
      Sentry.addBreadcrumb({
        message,
        level: "info",
        data: context,
      });
    }
  }

  /**
   * Log a warning
   */
  warn(message: string, context?: LogContext) {
    console.warn(`[WARN] ${message}`, context);

    if (this.isProduction) {
      Sentry.addBreadcrumb({
        message,
        level: "warning",
        data: context,
      });
    }
  }

  /**
   * Log an error
   */
  error(message: string, error: Error, context?: LogContext) {
    console.error(`[ERROR] ${message}`, error, context);

    if (this.isProduction) {
      Sentry.withScope((scope) => {
        // Add custom context
        if (context?.userId) scope.setUser({ id: context.userId });
        if (context?.pollId) scope.setTag("poll_id", context.pollId);
        if (context?.sessionId) scope.setTag("session_id", context.sessionId);
        if (context?.action) scope.setTag("action", context.action);
        if (context?.metadata) scope.setContext("metadata", context.metadata);

        Sentry.captureException(error, {
          level: "error",
          extra: {
            errorMessage: message,
          },
        });
      });
    }
  }

  /**
   * Track a performance metric
   */
  performance(metricName: string, value: number, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[PERF] ${metricName}: ${value}ms`, context);
    }

    if (this.isProduction) {
      // Add as breadcrumb for Sentry
      Sentry.addBreadcrumb({
        category: "performance",
        message: `${metricName}: ${value}ms`,
        level: "info",
        data: context,
      });
    }
  }

  /**
   * Track a business metric (voting, statement submission, etc.)
   */
  metric(metricName: string, value: number = 1, context?: LogContext) {
    if (this.isDevelopment) {
      console.log(`[METRIC] ${metricName}: ${value}`, context);
    }

    if (this.isProduction) {
      // Add as breadcrumb for Sentry
      Sentry.addBreadcrumb({
        category: "metric",
        message: `${metricName}: ${value}`,
        level: "info",
        data: {
          ...context,
          metricValue: value,
        },
      });
    }
  }

  /**
   * Track user interaction
   */
  userAction(action: string, context?: LogContext) {
    this.info(`User action: ${action}`, { ...context, action });
    this.metric(`user.action.${action}`, 1, context);
  }
}

export const logger = new Logger();
