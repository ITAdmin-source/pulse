import { pgTable, pgEnum, serial, uuid, timestamp, integer, text, index } from "drizzle-orm/pg-core";
import { polls } from "./polls";

// Define clustering job status enum
export const clusteringJobStatusEnum = pgEnum("clustering_job_status", [
  "pending",
  "processing",
  "completed",
  "failed",
]);

export const clusteringQueue = pgTable("clustering_queue", {
  id: serial("id").primaryKey(),
  pollId: uuid("poll_id")
    .references(() => polls.id, { onDelete: "cascade" })
    .notNull(),
  status: clusteringJobStatusEnum("status").notNull().default("pending"),
  attemptCount: integer("attempt_count").notNull().default(0),
  maxAttempts: integer("max_attempts").notNull().default(3),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
}, (table) => ({
  pollIdIdx: index("clustering_queue_poll_id_idx").on(table.pollId),
  statusIdx: index("clustering_queue_status_idx").on(table.status),
  createdAtIdx: index("clustering_queue_created_at_idx").on(table.createdAt),
}));

export type ClusteringJob = typeof clusteringQueue.$inferSelect;
export type NewClusteringJob = typeof clusteringQueue.$inferInsert;
