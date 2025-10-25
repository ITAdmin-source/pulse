import { stringToSeed, seededShuffle, SeededRandom } from "@/lib/utils/seeded-random";
import { StatementWeightingService } from "./statement-weighting-service";

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
 * Weighted Strategy - Adaptive routing based on statement characteristics
 *
 * Two operating modes:
 * 1. Clustering Mode (20+ users): Uses 4 factors
 *    - Predictiveness (how well it differentiates groups)
 *    - Consensus potential (likelihood of agreement)
 *    - Recency (time-based boost for new statements)
 *    - Pass rate penalty (penalty for high "unsure" rates)
 *
 * 2. Cold Start Mode (<20 users): Uses 3 factors
 *    - Vote count boost (prioritize less-voted statements)
 *    - Recency (time-based boost for new statements)
 *    - Pass rate penalty (penalty for high "unsure" rates)
 *
 * Features:
 * - Uses cached weights (smart invalidation on clustering/approval)
 * - Weighted random selection (higher weight = more likely to appear first)
 * - Deterministic for same user (same order on page refresh)
 * - Graceful fallback to random on errors
 */
class WeightedStrategy implements OrderingStrategy {
  async orderStatements(
    statements: Statement[],
    context: OrderingContext
  ): Promise<Statement[]> {
    try {
      // Get weights for all statements
      const statementIds = statements.map(s => s.id);
      const statementWeights = await StatementWeightingService.getStatementWeights(
        context.pollId,
        statementIds
      );

      // Create weight map
      const weightMap = new Map(
        statementWeights.map(sw => [sw.statementId, sw.weight])
      );

      // Perform weighted random ordering
      return this.weightedRandomOrder(statements, weightMap, context);
    } catch (error) {
      console.error("[WeightedStrategy] Error, falling back to random:", error);
      // Graceful fallback
      const randomStrategy = new RandomStrategy();
      return await randomStrategy.orderStatements(statements, context);
    }
  }

  /**
   * Weighted random selection using cumulative distribution
   *
   * Algorithm:
   * 1. Calculate cumulative weights for all statements
   * 2. Generate seeded random number in [0, totalWeight]
   * 3. Binary search to find statement where random falls
   * 4. Repeat for remaining statements
   *
   * Deterministic: Same user + poll + batch = same order
   *
   * @param statements - Statements to order
   * @param weights - Map of statementId → weight
   * @param context - User, poll, batch context
   * @returns Statements ordered by weighted random selection
   */
  private weightedRandomOrder(
    statements: Statement[],
    weights: Map<string, number>,
    context: OrderingContext
  ): Statement[] {
    // Generate deterministic seed
    const seed = this.generateSeed(context);
    const rng = new SeededRandom(seed);

    // Create ordered list to shuffle
    const orderedStatements = [...statements];
    const result: Statement[] = [];
    const remaining = new Set(orderedStatements.map(s => s.id));

    // Iteratively select statements using weighted random
    while (remaining.size > 0) {
      // Build cumulative weight array for remaining statements
      const remainingStmts = orderedStatements.filter(s =>
        remaining.has(s.id)
      );
      const cumulativeWeights: number[] = [];
      let cumulative = 0;

      for (const stmt of remainingStmts) {
        const weight = weights.get(stmt.id) ?? 0.5; // Default weight if missing
        cumulative += weight;
        cumulativeWeights.push(cumulative);
      }

      const totalWeight = cumulative;

      // Select using weighted random
      const rand = rng.next() * totalWeight;
      let selectedIdx = 0;

      // Find first index where cumulative >= random
      for (let i = 0; i < cumulativeWeights.length; i++) {
        if (rand <= cumulativeWeights[i]) {
          selectedIdx = i;
          break;
        }
      }

      const selected = remainingStmts[selectedIdx];
      result.push(selected);
      remaining.delete(selected.id);
    }

    return result;
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
