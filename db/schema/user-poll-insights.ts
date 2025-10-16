import { pgTable, text, timestamp, uuid, primaryKey, boolean } from "drizzle-orm/pg-core";
import { users } from "./users";
import { polls } from "./polls";

export const userPollInsights = pgTable("user_poll_insights", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  pollId: uuid("poll_id").references(() => polls.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),

  // Artifact Collection Fields
  artifactRarity: text("artifact_rarity", { enum: ["common", "rare", "legendary"] }).default("common"),
  isNewArtifact: boolean("is_new_artifact").default(true).notNull(),
  firstSeenAt: timestamp("first_seen_at", { withTimezone: true }),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.pollId] }),
}));

export type UserPollInsight = typeof userPollInsights.$inferSelect;
export type NewUserPollInsight = typeof userPollInsights.$inferInsert;