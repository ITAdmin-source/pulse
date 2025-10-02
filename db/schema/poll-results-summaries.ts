import { pgTable, text, uuid, timestamp, integer } from "drizzle-orm/pg-core";
import { polls } from "./polls";

export const pollResultsSummaries = pgTable("poll_results_summaries", {
  pollId: uuid("poll_id").primaryKey().references(() => polls.id, { onDelete: "cascade" }),
  summaryText: text("summary_text").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  participantCount: integer("participant_count").notNull(),
  voteCount: integer("vote_count").notNull(),
});

export type PollResultsSummary = typeof pollResultsSummaries.$inferSelect;
export type NewPollResultsSummary = typeof pollResultsSummaries.$inferInsert;
