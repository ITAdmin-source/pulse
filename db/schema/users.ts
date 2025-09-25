import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").unique(),        // NULL if anonymous
  sessionId: text("session_id").unique(),             // NULL if authenticated
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  upgradedAt: timestamp("upgraded_at", { withTimezone: true }),
  metadata: jsonb("metadata"),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;