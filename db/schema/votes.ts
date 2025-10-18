import { pgTable, timestamp, uuid, smallint, unique, index } from "drizzle-orm/pg-core";
import { statements } from "./statements";
import { users } from "./users";
import { sql } from "drizzle-orm";

export const votes = pgTable("votes", {
  id: uuid("id").defaultRandom().primaryKey(),
  statementId: uuid("statement_id").references(() => statements.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  value: smallint("value").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  uniqueStatementUser: unique("unique_statement_user").on(table.statementId, table.userId),
  valueCheck: sql`CHECK (${table.value} IN (-1, 0, 1))`,
  // Performance indexes for common queries
  statementIdIdx: index("votes_statement_id_idx").on(table.statementId), // For vote distribution queries
  userIdIdx: index("votes_user_id_idx").on(table.userId), // For user vote history
  statementValueIdx: index("votes_statement_value_idx").on(table.statementId, table.value), // For aggregate vote counts
}));

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;