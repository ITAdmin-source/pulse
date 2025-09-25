import { pgTable, text, serial } from "drizzle-orm/pg-core";

export const ageGroups = pgTable("age_groups", {
  id: serial("id").primaryKey(),
  label: text("label").unique().notNull(),
});

export type AgeGroup = typeof ageGroups.$inferSelect;
export type NewAgeGroup = typeof ageGroups.$inferInsert;