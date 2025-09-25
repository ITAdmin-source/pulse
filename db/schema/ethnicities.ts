import { pgTable, text, serial } from "drizzle-orm/pg-core";

export const ethnicities = pgTable("ethnicities", {
  id: serial("id").primaryKey(),
  label: text("label").unique().notNull(),
});

export type Ethnicity = typeof ethnicities.$inferSelect;
export type NewEthnicity = typeof ethnicities.$inferInsert;