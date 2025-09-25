import { pgTable, timestamp, uuid, smallint, unique } from "drizzle-orm/pg-core";
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
}));

export type Vote = typeof votes.$inferSelect;
export type NewVote = typeof votes.$inferInsert;