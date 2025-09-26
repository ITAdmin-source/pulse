import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { polls } from "./polls";
import { users } from "./users";

export const statements = pgTable("statements", {
  id: uuid("id").defaultRandom().primaryKey(),
  pollId: uuid("poll_id").references(() => polls.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  submittedBy: uuid("submitted_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  // Approval system: null = pending, true = approved, false = rejected (then deleted)
  approved: boolean("approved"),
  approvedBy: uuid("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
});

export type Statement = typeof statements.$inferSelect;
export type NewStatement = typeof statements.$inferInsert;