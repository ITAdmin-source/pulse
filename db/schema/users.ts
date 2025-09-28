import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").unique(),        // NULL if anonymous
  sessionId: text("session_id").unique(),             // NULL if authenticated
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }), // When we last fetched from Clerk
  cachedMetadata: jsonb("cached_metadata"),           // Cache of Clerk profile data
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;