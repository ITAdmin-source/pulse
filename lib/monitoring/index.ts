/**
 * Monitoring & Analytics Utilities
 *
 * Centralized exports for all monitoring functionality
 */

export { logger } from "./logger";
export {
  measureAsync,
  PerformanceTracker,
  FlowMonitors
} from "./performance";
export {
  monitorQuery,
  ConnectionPoolMonitor,
  DatabaseMetrics
} from "./database";

/**
 * Initialize monitoring in production
 * Call this from your root layout or app initialization
 */
export function initializeMonitoring() {
  if (typeof window !== "undefined" && process.env.NODE_ENV === "production") {
    // Import logger dynamically for client-side
    import("./logger").then(({ logger: clientLogger }) => {
      // Track initial page load performance
      if (window.performance && window.performance.timing) {
        const perfData = window.performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;

        if (pageLoadTime > 0) {
          clientLogger.performance("page.initial_load", pageLoadTime);
        }
      }

      // Track unhandled errors
      window.addEventListener("error", (event) => {
        clientLogger.error(
          "Unhandled error",
          event.error || new Error(event.message),
          {
            metadata: {
              filename: event.filename,
              lineno: event.lineno,
              colno: event.colno,
            },
          }
        );
      });

      // Track unhandled promise rejections
      window.addEventListener("unhandledrejection", (event) => {
        clientLogger.error(
          "Unhandled promise rejection",
          new Error(event.reason),
          {
            metadata: {
              reason: event.reason,
            },
          }
        );
      });
    });
  }
}
