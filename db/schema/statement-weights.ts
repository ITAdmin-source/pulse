import { pgTable, uuid, real, timestamp, integer, text, index, unique } from "drizzle-orm/pg-core";
import { polls } from "./polls";
import { statements } from "./statements";

/**
 * Statement Weights
 * Caches calculated weights for weighted statement ordering
 *
 * Invalidation triggers:
 * - When clustering is recomputed (new data available)
 * - When new statement is approved (affects recency distribution)
 *
 * Two modes:
 * - Clustering Mode (20+ users): Uses predictiveness, consensus, recency, pass rate
 * - Cold Start Mode (<20 users): Uses vote count, recency, pass rate
 */
export const statementWeights = pgTable(
  "statement_weights",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id")
      .references(() => polls.id, { onDelete: "cascade" })
      .notNull(),
    statementId: uuid("statement_id")
      .references(() => statements.id, { onDelete: "cascade" })
      .notNull(),

    // Four weight components (0.0 - 2.0 range)
    predictiveness: real("predictiveness").notNull(), // 0.0 - 1.0 (clustering mode only, 0 in cold start)
    consensusPotential: real("consensus_potential").notNull(), // 0.0 - 1.0 (clustering mode only, 0 in cold start)
    recencyBoost: real("recency_boost").notNull(), // 0.1 - 2.0 (both modes)
    passRatePenalty: real("pass_rate_penalty").notNull(), // 0.1 - 1.0 (both modes)

    // Cold start specific (null in clustering mode)
    voteCountBoost: real("vote_count_boost"), // 0.5 - 1.5 (cold start only)

    // Combined weight (product of all factors)
    combinedWeight: real("combined_weight").notNull(),

    // Metadata
    mode: text("mode").notNull(), // "cold_start" | "clustering"
    calculatedAt: timestamp("calculated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    // Vote statistics at time of calculation (for debugging)
    agreeCount: integer("agree_count").notNull().default(0),
    disagreeCount: integer("disagree_count").notNull().default(0),
    passCount: integer("pass_count").notNull().default(0),
  },
  (table) => ({
    // Unique constraint: one weight per statement per poll
    uniqueStatementPoll: unique("statement_weights_unique_idx").on(table.statementId, table.pollId),

    // Index for efficient lookups
    pollIdIdx: index("statement_weights_poll_id_idx").on(table.pollId),
  })
);

export type StatementWeight = typeof statementWeights.$inferSelect;
export type NewStatementWeight = typeof statementWeights.$inferInsert;
