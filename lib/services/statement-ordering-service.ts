import { stringToSeed, seededShuffle } from "@/lib/utils/seeded-random";

/**
 * Statement type for ordering
 */
export interface Statement {
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
 * Ordering context passed to strategies
 */
export interface OrderingContext {
  userId: string;
  pollId: string;
  batchNumber: number;
  pollConfig?: {
    orderMode: "sequential" | "random" | "weighted";
    randomSeed?: string | null;
  };
}

/**
 * Strategy interface for different ordering algorithms
 */
export interface OrderingStrategy {
  orderStatements(
    statements: Statement[],
    context: OrderingContext
  ): Promise<Statement[]>;
}

/**
 * Sequential Strategy - Maintains createdAt order (default database ordering)
 */
class SequentialStrategy implements OrderingStrategy {
  async orderStatements(statements: Statement[]): Promise<Statement[]> {
    // Statements already ordered by createdAt from database query
    return statements;
  }
}

/**
 * Random Strategy - Deterministic seeded shuffle
 *
 * Key features:
 * - Same user + poll + batch = same order (deterministic)
 * - Different users = different orders
 * - Different batches = different orders
 * - No database writes (pure computation)
 */
class RandomStrategy implements OrderingStrategy {
  async orderStatements(
    statements: Statement[],
    context: OrderingContext
  ): Promise<Statement[]> {
    // Generate deterministic seed from context
    const seed = this.generateSeed(context);

    // Shuffle using seeded random
    return seededShuffle(statements, seed);
  }

  /**
   * Generate deterministic seed from user + poll + batch context
   * Optional override seed for testing specific orderings
   */
  private generateSeed(context: OrderingContext): number {
    const { userId, pollId, batchNumber, pollConfig } = context;

    // Use override seed if provided (for testing)
    if (pollConfig?.randomSeed) {
      const seedInput = `${userId}-${pollConfig.randomSeed}-${batchNumber}`;
      return stringToSeed(seedInput);
    }

    // Default seed: userId + pollId + batchNumber
    const seedInput = `${userId}-${pollId}-${batchNumber}`;
    return stringToSeed(seedInput);
  }
}

/**
 * Weighted Strategy - Sophisticated routing based on statement characteristics
 *
 * Phase 2 Implementation (Future):
 * - Calculates weights based on 4 factors:
 *   1. Predictiveness (how well it differentiates groups)
 *   2. Consensus potential (likelihood of agreement)
 *   3. Recency (time-based boost for new statements)
 *   4. Pass rate penalty (penalty for high "unsure" rates)
 * - Uses cached weights (5-minute TTL)
 * - Weighted random selection (higher weight = more likely to appear first)
 *
 * Current: Falls back to random strategy
 */
class WeightedStrategy implements OrderingStrategy {
  async orderStatements(
    statements: Statement[],
    context: OrderingContext
  ): Promise<Statement[]> {
    try {
      // TODO Phase 2: Implement weight calculation and weighted random selection
      // const weights = await this.calculateWeights(statements, context.pollId);
      // return this.weightedRandomOrder(statements, weights, context);

      // Fallback to random strategy for now
      console.log("[WeightedStrategy] Not yet implemented, falling back to random");
      const randomStrategy = new RandomStrategy();
      return await randomStrategy.orderStatements(statements, context);
    } catch (error) {
      console.error("[WeightedStrategy] Error, falling back to random:", error);
      // Graceful fallback
      const randomStrategy = new RandomStrategy();
      return await randomStrategy.orderStatements(statements, context);
    }
  }
}

/**
 * Main Statement Ordering Service
 *
 * Selects appropriate strategy based on poll configuration and applies ordering.
 */
export class StatementOrderingService {
  /**
   * Order statements using configured strategy
   *
   * @param statements - Statements to order (should be ALL approved statements, not filtered)
   * @param context - User, poll, and batch context
   * @returns Ordered statements
   */
  static async orderStatements(
    statements: Statement[],
    context: OrderingContext
  ): Promise<Statement[]> {
    // Select strategy based on poll configuration
    const orderMode = context.pollConfig?.orderMode || "sequential";
    const strategy = this.getStrategy(orderMode);

    // Apply ordering
    return await strategy.orderStatements(statements, context);
  }

  /**
   * Get strategy instance based on order mode
   */
  private static getStrategy(
    orderMode: "sequential" | "random" | "weighted"
  ): OrderingStrategy {
    switch (orderMode) {
      case "sequential":
        return new SequentialStrategy();
      case "random":
        return new RandomStrategy();
      case "weighted":
        return new WeightedStrategy();
      default:
        console.warn(`[StatementOrderingService] Unknown order mode: ${orderMode}, defaulting to sequential`);
        return new SequentialStrategy();
    }
  }
}
