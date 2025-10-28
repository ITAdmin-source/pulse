import { pgTable, uuid, jsonb, real, timestamp, smallint, text, index } from "drizzle-orm/pg-core";
import { polls } from "./polls";
import { users } from "./users";

/**
 * Poll Clustering Metadata
 * Stores PCA components, cluster centroids, and quality metrics for each poll
 */
export const pollClusteringMetadata = pgTable("poll_clustering_metadata", {
  pollId: uuid("poll_id")
    .primaryKey()
    .references(() => polls.id, { onDelete: "cascade" }),

  // PCA Results
  pcaComponents: jsonb("pca_components")
    .$type<number[][]>()
    .notNull(), // Principal component vectors
  varianceExplained: jsonb("variance_explained")
    .$type<number[]>()
    .notNull(), // Variance explained by each PC
  meanVector: jsonb("mean_vector")
    .$type<number[]>()
    .notNull(), // Mean vector for centering

  // K-means Results
  clusterCentroids: jsonb("cluster_centroids")
    .$type<number[][]>()
    .notNull(), // Fine-grained cluster centroids in 2D space
  numFineClusters: smallint("num_fine_clusters").notNull(), // K value used (20/50/100)

  // Coarse Grouping
  coarseGroups: jsonb("coarse_groups")
    .$type<{
      id: number;
      label: string;
      centroid: number[];
      fineClusterIds: number[];
      userCount: number;
    }[]>()
    .notNull(),

  // Quality Metrics
  silhouetteScore: real("silhouette_score").notNull(), // Clustering quality (-1 to 1)
  totalVarianceExplained: real("total_variance_explained").notNull(), // Sum of PC1 + PC2

  // Metadata
  totalUsers: smallint("total_users").notNull(), // Number of users who voted
  totalStatements: smallint("total_statements").notNull(), // Number of statements
  computedAt: timestamp("computed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  version: smallint("version").notNull().default(1), // Schema version for migrations
});

/**
 * User Clustering Positions
 * Stores each user's position in the 2D opinion space
 */
export const userClusteringPositions = pgTable("user_clustering_positions", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id")
    .references(() => polls.id, { onDelete: "cascade" })
    .notNull(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),

  // 2D Coordinates (PCA space)
  pc1: real("pc1").notNull(), // First principal component
  pc2: real("pc2").notNull(), // Second principal component

  // Cluster Assignments
  fineClusterId: smallint("fine_cluster_id").notNull(), // Fine-grained cluster (0 to K-1)
  coarseGroupId: smallint("coarse_group_id").notNull(), // Coarse opinion group (0 to 4)

  // Vote Statistics (for hover tooltips)
  totalVotes: smallint("total_votes").notNull(), // Number of statements voted on
  agreeCount: smallint("agree_count").notNull(),
  disagreeCount: smallint("disagree_count").notNull(),
  passCount: smallint("pass_count").notNull(),

  computedAt: timestamp("computed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/**
 * Statement Classifications
 * Stores consensus/divisive/bridge classification for each statement
 */
export const statementClassifications = pgTable("statement_classifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id")
    .references(() => polls.id, { onDelete: "cascade" })
    .notNull(),
  statementId: uuid("statement_id").notNull(), // References statements.id

  // Classification
  classificationType: text("classification_type")
    .$type<"positive_consensus" | "negative_consensus" | "divisive" | "bridge" | "normal">()
    .notNull(),

  // Metrics
  groupAgreements: jsonb("group_agreements")
    .$type<Record<number, number>>() // groupId -> agreement percentage (0-1)
    .notNull(),
  averageAgreement: real("average_agreement").notNull(), // Mean agreement across groups
  standardDeviation: real("standard_deviation").notNull(), // StdDev of agreement (NOT variance!)

  // Bridge-specific metrics (only for bridge statements)
  bridgeScore: real("bridge_score"), // Higher = stronger bridge (0-1)
  connectsGroups: jsonb("connects_groups").$type<number[]>(), // Group IDs this statement bridges

  computedAt: timestamp("computed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
}, (table) => ({
  // Performance index for batch classification lookups in weighted ordering
  pollIdStatementIdIdx: index("statement_classifications_poll_statement_idx").on(table.pollId, table.statementId),
}));

// Type exports for TypeScript
export type PollClusteringMetadata = typeof pollClusteringMetadata.$inferSelect;
export type UserClusteringPosition = typeof userClusteringPositions.$inferSelect;
export type StatementClassification = typeof statementClassifications.$inferSelect;
