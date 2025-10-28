import { pgTable, text, timestamp, uuid, primaryKey, index } from "drizzle-orm/pg-core";
import { users } from "./users";
import { polls } from "./polls";

export const userMusicRecommendations = pgTable("user_music_recommendations", {
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  pollId: uuid("poll_id").references(() => polls.id, { onDelete: "cascade" }).notNull(),

  // Music data
  songTitle: text("song_title").notNull(),
  artistName: text("artist_name").notNull(),
  spotifyLink: text("spotify_link").notNull(),
  appleMusicLink: text("apple_music_link").notNull(),
  thumbnailUrl: text("thumbnail_url").notNull(),
  reasoning: text("reasoning").notNull(), // Why this song matches (Hebrew)

  // Cache metadata
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow().notNull(),
  insightFingerprint: text("insight_fingerprint").notNull(), // MD5 hash of insight title+body or voting data
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.pollId] }),
  fingerprintIdx: index("user_music_recommendations_fingerprint_idx").on(table.insightFingerprint)
}));

export type UserMusicRecommendation = typeof userMusicRecommendations.$inferSelect;
export type NewUserMusicRecommendation = typeof userMusicRecommendations.$inferInsert;
