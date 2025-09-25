import { pgTable, pgEnum, uuid, timestamp, unique } from "drizzle-orm/pg-core";
import { users } from "./users";
import { polls } from "./polls";

// Define role enum
export const roleEnum = pgEnum("role", ["system_admin", "poll_owner", "poll_manager"]);

export const userRoles = pgTable("user_roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull(),
  pollId: uuid("poll_id").references(() => polls.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  // Unique constraint on user_id, role, poll_id combination
  userRolePollUnique: unique().on(table.userId, table.role, table.pollId),
}));

export type UserRole = typeof userRoles.$inferSelect;
export type NewUserRole = typeof userRoles.$inferInsert;