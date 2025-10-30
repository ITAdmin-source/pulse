/**
 * Clustering Queue Service
 * Manages the database-backed queue for background clustering jobs
 *
 * Design:
 * - Jobs are enqueued when users complete vote batches or hit milestones
 * - A Vercel Cron job processes the queue every minute
 * - Deduplication: Only one pending/processing job per poll at a time
 * - Retry logic: Up to 3 attempts per job before marking as failed
 */

import { db } from "@/db/db";
import { eq, and, or, lt, sql } from "drizzle-orm";
import { clusteringQueue } from "@/db/schema";
import { ClusteringService } from "./clustering-service";

export class ClusteringQueueService {
  /**
   * Enqueue a clustering job for a poll
   * Deduplicates: Skips if there's already a pending or processing job for the same poll
   *
   * @param pollId - Poll ID to queue clustering for
   * @returns true if job was enqueued, false if skipped (already exists)
   */
  static async enqueueJob(pollId: string): Promise<boolean> {
    try {
      // Check if there's already a pending or processing job for this poll
      const existingJobs = await db
        .select()
        .from(clusteringQueue)
        .where(
          and(
            eq(clusteringQueue.pollId, pollId),
            or(
              eq(clusteringQueue.status, "pending"),
              eq(clusteringQueue.status, "processing")
            )
          )
        )
        .limit(1);

      if (existingJobs.length > 0) {
        console.log(
          `[ClusteringQueueService] Skipping enqueue for poll ${pollId} - job already exists (status: ${existingJobs[0].status})`
        );
        return false;
      }

      // Enqueue new job
      await db.insert(clusteringQueue).values({
        pollId,
        status: "pending",
        attemptCount: 0,
        maxAttempts: 3,
      });

      console.log(
        `[ClusteringQueueService] ✅ Enqueued clustering job for poll ${pollId}`
      );
      return true;
    } catch (error) {
      console.error(
        `[ClusteringQueueService] ❌ Failed to enqueue job for poll ${pollId}:`,
        error
      );
      throw error;
    }
  }

  /**
   * Process the next pending job in the queue
   *
   * @returns Object with success status, job ID, and poll ID
   */
  static async processNextJob(): Promise<{
    success: boolean;
    jobId?: number;
    pollId?: string;
    error?: string;
  }> {
    try {
      // Fetch oldest pending job
      const pendingJobs = await db
        .select()
        .from(clusteringQueue)
        .where(eq(clusteringQueue.status, "pending"))
        .orderBy(clusteringQueue.createdAt)
        .limit(1);

      if (pendingJobs.length === 0) {
        return { success: true }; // No jobs to process
      }

      const job = pendingJobs[0];
      console.log(
        `[ClusteringQueueService] Processing job ${job.id} for poll ${job.pollId} (attempt ${job.attemptCount + 1}/${job.maxAttempts})`
      );

      // Mark as processing
      await db
        .update(clusteringQueue)
        .set({
          status: "processing",
          attemptCount: job.attemptCount + 1,
        })
        .where(eq(clusteringQueue.id, job.id));

      // Check eligibility first (fast check)
      const eligibility = await ClusteringService.isEligibleForClustering(
        job.pollId
      );

      if (!eligibility.eligible) {
        console.log(
          `[ClusteringQueueService] Poll ${job.pollId} not eligible for clustering: ${eligibility.reason}`
        );

        // Mark as completed (not an error - poll just doesn't have enough data yet)
        await db
          .update(clusteringQueue)
          .set({
            status: "completed",
            processedAt: new Date(),
            errorMessage: `Not eligible: ${eligibility.reason}`,
          })
          .where(eq(clusteringQueue.id, job.id));

        return {
          success: true,
          jobId: job.id,
          pollId: job.pollId,
        };
      }

      // Run clustering computation
      const startTime = Date.now();
      await ClusteringService.computeOpinionLandscape(job.pollId);
      const duration = Date.now() - startTime;

      console.log(
        `[ClusteringQueueService] ✅ Clustering completed for poll ${job.pollId} in ${duration}ms`
      );

      // Mark as completed
      await db
        .update(clusteringQueue)
        .set({
          status: "completed",
          processedAt: new Date(),
          errorMessage: null,
        })
        .where(eq(clusteringQueue.id, job.id));

      return {
        success: true,
        jobId: job.id,
        pollId: job.pollId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error(
        `[ClusteringQueueService] ❌ Job processing failed:`,
        error
      );

      // Try to update job status (might fail if job doesn't exist)
      try {
        const failedJobs = await db
          .select()
          .from(clusteringQueue)
          .where(eq(clusteringQueue.status, "processing"))
          .limit(1);

        if (failedJobs.length > 0) {
          const job = failedJobs[0];
          const shouldRetry = job.attemptCount < job.maxAttempts;

          await db
            .update(clusteringQueue)
            .set({
              status: shouldRetry ? "pending" : "failed",
              errorMessage,
              processedAt: shouldRetry ? null : new Date(),
            })
            .where(eq(clusteringQueue.id, job.id));

          console.log(
            `[ClusteringQueueService] Job ${job.id} marked as ${shouldRetry ? "pending (will retry)" : "failed"}`
          );
        }
      } catch (updateError) {
        console.error(
          `[ClusteringQueueService] Failed to update job status:`,
          updateError
        );
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Process up to N jobs from the queue
   * Rate-limited to avoid timeouts in Vercel Cron
   *
   * @param maxJobs - Maximum number of jobs to process (default: 5)
   * @returns Summary of processing results
   */
  static async processQueue(maxJobs: number = 5): Promise<{
    processed: number;
    successful: number;
    failed: number;
    errors: string[];
  }> {
    console.log(
      `[ClusteringQueueService] Starting queue processing (max ${maxJobs} jobs)...`
    );

    const results = {
      processed: 0,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < maxJobs; i++) {
      const result = await this.processNextJob();

      if (!result.jobId) {
        // No more jobs in queue
        break;
      }

      results.processed++;

      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        if (result.error) {
          results.errors.push(
            `Poll ${result.pollId}: ${result.error}`
          );
        }
      }
    }

    console.log(
      `[ClusteringQueueService] ✅ Queue processing complete:`,
      results
    );

    return results;
  }

  /**
   * Get queue statistics
   * Useful for monitoring and debugging
   */
  static async getQueueStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  }> {
    const stats = await db
      .select({
        status: clusteringQueue.status,
        count: sql<number>`count(*)`,
      })
      .from(clusteringQueue)
      .groupBy(clusteringQueue.status);

    const result = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0,
    };

    stats.forEach((stat) => {
      const count = Number(stat.count);
      if (stat.status === "pending") result.pending = count;
      if (stat.status === "processing") result.processing = count;
      if (stat.status === "completed") result.completed = count;
      if (stat.status === "failed") result.failed = count;
    });

    return result;
  }

  /**
   * Clean up old completed/failed jobs (older than 7 days)
   * Run periodically to prevent table bloat
   */
  static async cleanupOldJobs(daysToKeep: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await db
      .delete(clusteringQueue)
      .where(
        and(
          or(
            eq(clusteringQueue.status, "completed"),
            eq(clusteringQueue.status, "failed")
          ),
          lt(clusteringQueue.createdAt, cutoffDate)
        )
      );

    console.log(
      `[ClusteringQueueService] Cleaned up old jobs (older than ${daysToKeep} days)`
    );

    return 0; // Drizzle doesn't return affected rows count in all cases
  }
}
