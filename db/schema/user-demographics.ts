import { pgTable, uuid, integer, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";
import { ageGroups } from "./age-groups";
import { genders } from "./genders";
import { ethnicities } from "./ethnicities";
import { politicalParties } from "./political-parties";

export const userDemographics = pgTable("user_demographics", {
  userId: uuid("user_id").primaryKey().references(() => users.id, { onDelete: "cascade" }),
  ageGroupId: integer("age_group_id").references(() => ageGroups.id),
  genderId: integer("gender_id").references(() => genders.id),
  ethnicityId: integer("ethnicity_id").references(() => ethnicities.id),
  politicalPartyId: integer("political_party_id").references(() => politicalParties.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type UserDemographics = typeof userDemographics.$inferSelect;
export type NewUserDemographics = typeof userDemographics.$inferInsert;