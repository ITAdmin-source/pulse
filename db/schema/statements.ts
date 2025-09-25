import { pgTable, text, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { polls } from "./polls";
import { users } from "./users";

export const statements = pgTable("statements", {
  id: uuid("id").defaultRandom().primaryKey(),
  pollId: uuid("poll_id").references(() => polls.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  isUserSuggested: boolean("is_user_suggested").default(false).notNull(),
  isApproved: boolean("is_approved").default(false).notNull(),
});

export type Statement = typeof statements.$inferSelect;
export type NewStatement = typeof statements.$inferInsert;