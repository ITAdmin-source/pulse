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
   * Generate deterministic seed from user + poll context
   * Optional override seed for testing specific orderings
   * Note: batchNumber removed to enable parallelization
   */
  private generateSeed(context: OrderingContext): number {
    const { userId, pollId, pollConfig } = context;

    // Use override seed if provided (for testing)
    if (pollConfig?.randomSeed) {
      const seedInput = `${userId}-${pollConfig.randomSeed}`;
      return stringToSeed(seedInput);
    }

    // Default seed: userId + pollId (batchNumber removed)
    const seedInput = `${userId}-${pollId}`;
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
   * Algorithm (Optimized O(n log n)):
   * 1. Build initial cumulative weight array once: O(n)
   * 2. For each selection: O(log n) binary search + O(1) removal
   * 3. Total: O(n log n) vs previous O(n²)
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

    // Build initial cumulative weights array: O(n)
    const items: Array<{ stmt: Statement; weight: number }> = statements.map(s => ({
      stmt: s,
      weight: weights.get(s.id) ?? 0.5
    }));

    const result: Statement[] = [];

    // Iteratively select statements using weighted random: O(n log n) total
    while (items.length > 0) {
      // Build cumulative weights: O(n)
      const cumulativeWeights = this.buildCumulativeWeights(items);
      const totalWeight = cumulativeWeights[cumulativeWeights.length - 1];

      // Select using binary search: O(log n)
      const rand = rng.next() * totalWeight;
      const selectedIdx = this.binarySearchCumulative(cumulativeWeights, rand);

      // Add to result and remove from items: O(1)
      result.push(items[selectedIdx].stmt);
      items.splice(selectedIdx, 1);
    }

    return result;
  }

  /**
   * Build cumulative weights array: O(n)
   * @param items - Items with weights
   * @returns Array of cumulative weights
   */
  private buildCumulativeWeights(
    items: Array<{ stmt: Statement; weight: number }>
  ): number[] {
    const cumulative: number[] = [];
    let sum = 0;
    for (const item of items) {
      sum += item.weight;
      cumulative.push(sum);
    }
    return cumulative;
  }

  /**
   * Binary search to find index where random value falls: O(log n)
   * @param cumulativeWeights - Cumulative weight array
   * @param target - Random target value
   * @returns Index of selected item
   */
  private binarySearchCumulative(
    cumulativeWeights: number[],
    target: number
  ): number {
    let left = 0;
    let right = cumulativeWeights.length - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (target <= cumulativeWeights[mid]) {
        right = mid;
      } else {
        left = mid + 1;
      }
    }

    return left;
  }

  /**
   * Generate deterministic seed from user + poll context
   * Optional override seed for testing specific orderings
   * Note: batchNumber removed to enable parallelization
   */
  private generateSeed(context: OrderingContext): number {
    const { userId, pollId, pollConfig } = context;

    // Use override seed if provided (for testing)
    if (pollConfig?.randomSeed) {
      const seedInput = `${userId}-${pollConfig.randomSeed}`;
      return stringToSeed(seedInput);
    }

    // Default seed: userId + pollId (batchNumber removed)
    const seedInput = `${userId}-${pollId}`;
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
