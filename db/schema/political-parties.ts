import { pgTable, text, serial } from "drizzle-orm/pg-core";

export const politicalParties = pgTable("political_parties", {
  id: serial("id").primaryKey(),
  label: text("label").unique().notNull(),
});

export type PoliticalParty = typeof politicalParties.$inferSelect;
export type NewPoliticalParty = typeof politicalParties.$inferInsert;