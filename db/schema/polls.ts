import { pgTable, pgEnum, text, uuid, timestamp, boolean, integer, varchar } from "drizzle-orm/pg-core";
import { users } from "./users";

// Define poll_status enum
export const pollStatusEnum = pgEnum("poll_status", ["draft", "published", "closed"]);

export const polls = pgTable("polls", {
  id: uuid("id").defaultRandom().primaryKey(),
  question: text("question").notNull(),
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),

  // Control attributes
  allowUserStatements: boolean("allow_user_statements").notNull().default(false),
  autoApproveStatements: boolean("auto_approve_statements").notNull().default(false),
  slug: text("slug").unique().notNull(),
  startTime: timestamp("start_time", { withTimezone: true }),
  endTime: timestamp("end_time", { withTimezone: true }),
  status: pollStatusEnum("status").notNull().default("draft"),
  votingGoal: integer("voting_goal"),

  // Button label overrides (null = use app defaults)
  supportButtonLabel: varchar("support_button_label", { length: 10 }),
  opposeButtonLabel: varchar("oppose_button_label", { length: 10 }),
  unsureButtonLabel: varchar("unsure_button_label", { length: 10 }),

  // Voting requirements
  minStatementsVotedToEnd: integer("min_statements_voted_to_end").notNull().default(5),
});

export type Poll = typeof polls.$inferSelect;
export type NewPoll = typeof polls.$inferInsert;