import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "./users";

export const userFeedback = pgTable("user_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  feedbackText: text("feedback_text").notNull(),
  pageUrl: text("page_url"),
  userAgent: text("user_agent"),
  status: text("status").notNull().default("new"), // 'new', 'reviewed', 'resolved', 'dismissed'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  adminNotes: text("admin_notes"),
});

export type UserFeedback = typeof userFeedback.$inferSelect;
export type NewUserFeedback = typeof userFeedback.$inferInsert;
