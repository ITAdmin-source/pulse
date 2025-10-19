/**
 * Database monitoring utilities
 * Tracks query performance and connection health
 */

import { logger } from "./logger";

/**
 * Monitor database query performance
 */
export async function monitorQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>,
  context?: { pollId?: string; userId?: string }
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await queryFn();
    const duration = performance.now() - startTime;

    // Log query performance
    logger.performance(`db.query.${queryName}`, duration, {
      ...context,
      action: `db_query_${queryName}`,
      duration,
    });

    // Alert on slow queries (potential N+1 or missing indexes)
    if (duration > 1000) {
      logger.warn(`Slow database query detected: ${queryName}`, {
        ...context,
        duration,
        metadata: {
          queryName,
          threshold: 1000,
        },
      });
    }

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error(
      `Database query failed: ${queryName}`,
      error as Error,
      {
        ...context,
        action: `db_query_${queryName}`,
        duration,
        metadata: {
          queryName,
          failed: true,
        },
      }
    );

    throw error;
  }
}

/**
 * Monitor connection pool health
 */
export class ConnectionPoolMonitor {
  private static lastCheckTime = 0;
  private static CHECK_INTERVAL = 60000; // Check every minute

  static async checkHealth() {
    const now = Date.now();

    // Throttle checks to avoid spam
    if (now - this.lastCheckTime < this.CHECK_INTERVAL) {
      return;
    }

    this.lastCheckTime = now;

    try {
      // This will be called by health check endpoint
      logger.info("Connection pool health check", {
        action: "db_health_check",
        metadata: {
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      logger.error(
        "Connection pool health check failed",
        error as Error,
        {
          action: "db_health_check",
          metadata: {
            timestamp: new Date().toISOString(),
            critical: true,
          },
        }
      );
    }
  }
}

/**
 * Track common database operations
 */
export const DatabaseMetrics = {
  trackVoteInsert(pollId: string, userId?: string) {
    logger.metric("db.vote.insert", 1, { pollId, userId });
  },

  trackStatementInsert(pollId: string, userId?: string) {
    logger.metric("db.statement.insert", 1, { pollId, userId });
  },

  trackPollQuery(pollId: string) {
    logger.metric("db.poll.query", 1, { pollId });
  },

  trackResultsQuery(pollId: string) {
    logger.metric("db.results.query", 1, { pollId });
  },

  trackUserQuery(userId: string) {
    logger.metric("db.user.query", 1, { userId });
  },
};
