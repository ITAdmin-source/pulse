import { getStatementBatchAction } from "@/actions/votes-actions";
import { getMinimumVotingThreshold } from "@/lib/utils/voting";

interface Statement {
  id: string;
  text: string;
  pollId: string | null;
  createdAt?: Date | null;
  submittedBy?: string | null;
  approved?: boolean | null;
  approvedBy?: string | null;
  approvedAt?: Date | null;
}

/**
 * StatementManager - Centralized statement navigation and progress tracking
 *
 * Manages:
 * - Current batch of statements (10 max for memory efficiency)
 * - User votes lookup object for THIS poll only
 * - Statement navigation and selection
 * - Progress calculations from votes object
 * - Batch loading logic
 *
 * Inspired by Pol.is architecture with batching adaptation
 */
export class StatementManager {
  private statements: Statement[];
  private userVotes: Record<string, -1 | 0 | 1>;
  private pollId: string;
  public userId: string; // Public to allow updating for anonymous users
  private currentIndex: number;
  private totalStatementsInPoll: number;
  private currentBatchNumber: number; // Track which batch we're currently viewing
  private currentStatementIndex: number; // Visual position in current batch (0-9), independent of vote count

  constructor(
    initialStatements: Statement[],
    userVotes: Record<string, -1 | 0 | 1>,
    pollId: string,
    userId: string,
    totalStatementsInPoll: number
  ) {
    this.statements = initialStatements;
    this.userVotes = userVotes;
    this.pollId = pollId;
    this.userId = userId;
    this.currentIndex = 0;
    this.totalStatementsInPoll = totalStatementsInPoll;
    this.currentStatementIndex = 0; // Start at first position

    // Calculate which batch we should be on based on votes
    const totalVoted = Object.keys(userVotes).length;
    this.currentBatchNumber = Math.floor(totalVoted / 10) + 1;

    // Initialize currentStatementIndex based on position within current batch
    // This represents which statement we're viewing, not how many we've voted on
    this.currentStatementIndex = totalVoted % 10;
  }

  /**
   * Get total number of votes cast by user in this poll
   */
  getTotalVoted(): number {
    return Object.keys(this.userVotes).length;
  }

  /**
   * Get current batch number (1-indexed)
   * This is the batch we're currently viewing, not necessarily calculated from votes
   */
  getCurrentBatch(): number {
    return this.currentBatchNumber;
  }

  /**
   * Get position within current batch (0-9)
   * Used for progress bar - represents the statement being viewed/voted on
   * This is independent of vote count and doesn't wrap when batch completes
   */
  getPositionInBatch(): number {
    return this.currentStatementIndex;
  }

  /**
   * Get next unvoted statement in current batch
   * Skips any statements already voted on
   * Returns null if batch is complete
   */
  getNextStatement(): Statement | null {
    while (this.currentIndex < this.statements.length) {
      const stmt = this.statements[this.currentIndex];
      if (!this.userVotes[stmt.id]) {
        return stmt;
      }
      this.currentIndex++;
    }
    return null; // Batch complete
  }

  /**
   * Get current statement without advancing index
   * Used to peek at current statement
   */
  getCurrentStatement(): Statement | null {
    if (this.currentIndex < this.statements.length) {
      const stmt = this.statements[this.currentIndex];
      if (!this.userVotes[stmt.id]) {
        return stmt;
      }
    }
    return null;
  }

  /**
   * Record a vote (updates local state only)
   * Database save happens separately in voting flow
   */
  recordVote(statementId: string, value: -1 | 0 | 1): void {
    this.userVotes[statementId] = value;
  }

  /**
   * Advance to next statement (increments index and position)
   * Call after showing results overlay
   */
  advanceIndex(): void {
    this.currentIndex++;
    this.currentStatementIndex++;
  }

  /**
   * Check if current batch is complete
   * Returns true when no more unvoted statements in current batch
   */
  isBatchComplete(): boolean {
    return this.getNextStatement() === null;
  }

  /**
   * Check if current statement is the last one in the batch
   * Used to determine if we should show continuation page after voting
   */
  isLastStatementInBatch(): boolean {
    // Check if the next statement would be null
    const tempIndex = this.currentIndex;
    this.currentIndex++;
    const nextStmt = this.getNextStatement();
    this.currentIndex = tempIndex; // Restore index
    return nextStmt === null;
  }

  /**
   * Load next batch of statements from server
   * Returns true if batch loaded successfully, false if no more statements
   */
  async loadNextBatch(): Promise<boolean> {
    const nextBatchNumber = this.currentBatchNumber + 1;

    const result = await getStatementBatchAction(
      this.pollId,
      this.userId,
      nextBatchNumber
    );

    if (result.success && result.data && result.data.length > 0) {
      this.statements = result.data;
      this.currentIndex = 0;
      this.currentBatchNumber = nextBatchNumber; // Update to new batch
      this.currentStatementIndex = 0; // Reset position for new batch
      return true;
    }
    return false;
  }

  /**
   * Get comprehensive progress information for UI
   * Calculates all values needed for progress bar, counter, and finish button
   */
  getProgress() {
    const totalVoted = this.getTotalVoted();
    const currentBatch = this.getCurrentBatch();
    const positionInBatch = this.getPositionInBatch();

    // Calculate segments for progress bar (resets visually each batch)
    const batchStart = (currentBatch - 1) * 10;
    const remainingTotal = this.totalStatementsInPoll - batchStart;
    const statementsInCurrentBatch = Math.min(10, remainingTotal);

    const threshold = getMinimumVotingThreshold(this.totalStatementsInPoll);
    const canFinish = totalVoted >= threshold;

    return {
      totalVoted,
      currentBatch,
      positionInBatch,
      statementsInCurrentBatch,
      threshold,
      canFinish,
      totalStatementsInPoll: this.totalStatementsInPoll,
    };
  }

  /**
   * Get vote distribution for continuation page
   * Returns counts of agree/disagree/unsure votes
   */
  getVoteDistribution() {
    const votes = Object.values(this.userVotes);
    return {
      agreeCount: votes.filter((v) => v === 1).length,
      disagreeCount: votes.filter((v) => v === -1).length,
      unsureCount: votes.filter((v) => v === 0).length,
    };
  }

  /**
   * Check if user has voted on all statements in poll
   */
  hasVotedOnAll(): boolean {
    return this.getTotalVoted() >= this.totalStatementsInPoll;
  }

  /**
   * Get user's vote for a specific statement
   * Returns undefined if not voted
   */
  getUserVote(statementId: string): -1 | 0 | 1 | undefined {
    return this.userVotes[statementId];
  }

  /**
   * Check if user has voted on a specific statement
   */
  hasVotedOn(statementId: string): boolean {
    return statementId in this.userVotes;
  }

  /**
   * Get all votes as lookup object (for external use)
   */
  getAllVotes(): Record<string, -1 | 0 | 1> {
    return { ...this.userVotes };
  }
}
