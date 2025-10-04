"use client";

interface QueuedVote {
  statementId: string;
  value: -1 | 0 | 1;
  timestamp: number;
  pollId: string;
}

const QUEUE_KEY = "pulse_offline_votes";

/**
 * OfflineVoteQueue - Handles vote persistence during connection loss
 *
 * When network is unavailable, votes are queued in localStorage
 * and synced when connection is restored.
 */
export class OfflineVoteQueue {
  /**
   * Add a vote to the offline queue
   */
  static add(vote: Omit<QueuedVote, "timestamp">): void {
    const queue = this.getAll();
    queue.push({
      ...vote,
      timestamp: Date.now(),
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Get all queued votes
   */
  static getAll(): QueuedVote[] {
    if (typeof window === "undefined") return [];
    const data = localStorage.getItem(QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  /**
   * Clear all queued votes
   */
  static clear(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(QUEUE_KEY);
  }

  /**
   * Remove a specific vote from the queue
   */
  static remove(statementId: string): void {
    const queue = this.getAll().filter(v => v.statementId !== statementId);
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Check if there are queued votes
   */
  static hasQueuedVotes(): boolean {
    return this.getAll().length > 0;
  }

  /**
   * Sync all queued votes to the server
   * Returns count of synced and failed votes
   */
  static async syncAll(userId: string): Promise<{
    synced: number;
    failed: number;
    errors: string[];
  }> {
    const queue = this.getAll();
    let synced = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const vote of queue) {
      try {
        const response = await fetch("/api/vote/cast", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            statementId: vote.statementId,
            value: vote.value,
          }),
        });

        if (response.ok) {
          synced++;
          this.remove(vote.statementId);
        } else {
          const error = await response.json();
          failed++;
          errors.push(error.error || "Unknown error");
        }
      } catch (error) {
        console.error("Failed to sync vote:", vote, error);
        failed++;
        errors.push(error instanceof Error ? error.message : "Network error");
      }
    }

    return { synced, failed, errors };
  }
}
