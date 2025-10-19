/**
 * Example: Enhanced Voting Service with Monitoring
 *
 * This is a reference implementation showing how to add monitoring to your existing voting service.
 * You can integrate these patterns into your actual voting-service.ts file.
 */

import { logger, FlowMonitors, DatabaseMetrics } from "@/lib/monitoring";
import { VotingService } from "./voting-service";
import type { Vote } from "@/db/schema";

export class MonitoredVotingService {
  /**
   * Cast vote with monitoring and performance tracking
   */
  static async castVoteWithMonitoring(
    statementId: string,
    value: -1 | 0 | 1,
    clerkUserId?: string,
    sessionId?: string
  ): Promise<Vote> {
    // Track vote attempt
    logger.userAction("vote_attempt", {
      userId: clerkUserId,
      sessionId,
      metadata: {
        statementId,
        value,
        userType: clerkUserId ? "authenticated" : "anonymous",
      },
    });

    try {
      // Use performance monitor for the entire voting flow
      const result = await FlowMonitors.trackVoteFlow(
        statementId,
        clerkUserId,
        async () => {
          const vote = await VotingService.castVoteWithUserCreation(
            statementId,
            value,
            clerkUserId,
            sessionId
          );

          // Track successful database insert
          DatabaseMetrics.trackVoteInsert(statementId, clerkUserId);

          return vote;
        }
      );

      // Track vote value distribution for analytics
      logger.metric(`vote.value.${value === 1 ? "agree" : value === -1 ? "disagree" : "pass"}`, 1, {
        userId: clerkUserId,
        metadata: { statementId },
      });

      logger.info("Vote cast successfully", {
        userId: clerkUserId,
        sessionId,
        action: "vote_success",
        metadata: { statementId, value },
      });

      return result;
    } catch (error) {
      // Track vote failure with context
      logger.error(
        "Vote casting failed",
        error as Error,
        {
          userId: clerkUserId,
          sessionId,
          action: "vote_failure",
          metadata: {
            statementId,
            value,
            errorMessage: (error as Error).message,
          },
        }
      );

      // Track failure metric
      logger.metric("vote.error", 1, {
        userId: clerkUserId,
        metadata: {
          errorType: (error as Error).message.includes("already voted")
            ? "duplicate_vote"
            : (error as Error).message.includes("not found")
            ? "not_found"
            : (error as Error).message.includes("not active")
            ? "poll_closed"
            : "unknown",
        },
      });

      throw error;
    }
  }

  /**
   * Get user voting progress with monitoring
   */
  static async getUserVotingProgressWithMonitoring(
    pollId: string,
    userId: string
  ) {
    try {
      logger.info("Fetching user voting progress", {
        userId,
        pollId,
        action: "get_voting_progress",
      });

      const result = await VotingService.getUserVotingProgress({
        pollId,
        userId,
      });

      // Track engagement metrics
      if (result.votedStatements > 0) {
        logger.metric("voting.engagement", result.votedStatements, {
          userId,
          pollId,
        });
      }

      return result;
    } catch (error) {
      logger.error(
        "Failed to fetch voting progress",
        error as Error,
        {
          userId,
          pollId,
          action: "get_voting_progress_failure",
        }
      );

      throw error;
    }
  }
}
