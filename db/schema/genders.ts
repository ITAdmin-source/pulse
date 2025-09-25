import { pgTable, text, serial } from "drizzle-orm/pg-core";

export const genders = pgTable("genders", {
  id: serial("id").primaryKey(),
  label: text("label").unique().notNull(),
});

export type Gender = typeof genders.$inferSelect;
export type NewGender = typeof genders.$inferInsert;