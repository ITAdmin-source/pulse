/**
 * Performance monitoring utilities
 * Tracks critical user flows and API performance
 */

import { logger } from "./logger";

/**
 * Measure async function execution time
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  context?: { pollId?: string; userId?: string }
): Promise<T> {
  const startTime = performance.now();

  try {
    const result = await fn();
    const duration = performance.now() - startTime;

    logger.performance(name, duration, {
      ...context,
      action: name,
      duration,
    });

    return result;
  } catch (error) {
    const duration = performance.now() - startTime;

    logger.error(
      `Performance measurement failed: ${name}`,
      error as Error,
      {
        ...context,
        action: name,
        duration,
        metadata: { failed: true },
      }
    );

    throw error;
  }
}

/**
 * Create a performance tracker for measuring code execution
 */
export class PerformanceTracker {
  private startTime: number;
  private name: string;
  private context: { pollId?: string; userId?: string; action?: string };

  constructor(
    name: string,
    context?: { pollId?: string; userId?: string; action?: string }
  ) {
    this.name = name;
    this.context = context || {};
    this.startTime = performance.now();
  }

  /**
   * End tracking and log the duration
   */
  end(additionalContext?: Record<string, unknown>) {
    const duration = performance.now() - this.startTime;

    logger.performance(this.name, duration, {
      ...this.context,
      action: this.name,
      duration,
      metadata: additionalContext,
    });

    return duration;
  }

  /**
   * Add a checkpoint without ending the tracker
   */
  checkpoint(checkpointName: string) {
    const duration = performance.now() - this.startTime;

    logger.performance(
      `${this.name}.${checkpointName}`,
      duration,
      {
        ...this.context,
        action: `${this.name}.${checkpointName}`,
        duration,
      }
    );
  }
}

/**
 * Monitor critical user flows
 */
export const FlowMonitors = {
  /**
   * Track voting flow performance
   */
  async trackVoteFlow<T>(
    pollId: string,
    userId: string | undefined,
    voteAction: () => Promise<T>
  ): Promise<T> {
    const tracker = new PerformanceTracker("vote_flow", {
      pollId,
      userId,
      action: "cast_vote",
    });

    try {
      const result = await voteAction();
      const duration = tracker.end({ success: true });

      // Alert if voting takes too long (critical UX)
      if (duration > 2000) {
        logger.warn("Slow vote submission detected", {
          pollId,
          userId,
          duration,
          metadata: { threshold: 2000 },
        });
      }

      logger.metric("vote.success", 1, { pollId, userId });
      return result;
    } catch (error) {
      tracker.end({ success: false });
      logger.metric("vote.failure", 1, { pollId, userId });
      throw error;
    }
  },

  /**
   * Track statement submission flow
   */
  async trackStatementSubmission<T>(
    pollId: string,
    userId: string | undefined,
    submitAction: () => Promise<T>
  ): Promise<T> {
    const tracker = new PerformanceTracker("statement_submission", {
      pollId,
      userId,
      action: "submit_statement",
    });

    try {
      const result = await submitAction();
      tracker.end({ success: true });
      logger.metric("statement.submitted", 1, { pollId, userId });
      return result;
    } catch (error) {
      tracker.end({ success: false });
      logger.metric("statement.failed", 1, { pollId, userId });
      throw error;
    }
  },

  /**
   * Track results view loading
   */
  async trackResultsLoad<T>(
    pollId: string,
    userId: string | undefined,
    loadAction: () => Promise<T>
  ): Promise<T> {
    const tracker = new PerformanceTracker("results_load", {
      pollId,
      userId,
      action: "load_results",
    });

    try {
      const result = await loadAction();
      const duration = tracker.end({ success: true });

      // Results should load quickly (cached data)
      if (duration > 3000) {
        logger.warn("Slow results loading detected", {
          pollId,
          userId,
          duration,
          metadata: { threshold: 3000 },
        });
      }

      logger.metric("results.loaded", 1, { pollId, userId });
      return result;
    } catch (error) {
      tracker.end({ success: false });
      logger.metric("results.failed", 1, { pollId, userId });
      throw error;
    }
  },

  /**
   * Track demographics collection
   */
  trackDemographicsSubmission(
    pollId: string,
    userId: string | undefined,
  ) {
    logger.metric("demographics.submitted", 1, { pollId, userId });
    logger.userAction("submit_demographics", { pollId, userId });
  },
};
