import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users, ageGroups, genders, ethnicities, politicalParties, userDemographics, userProfiles, userRoles, roleEnum, polls, pollStatusEnum, statements, votes, userPollInsights } from "./schema";

config({ path: ".env.local" });

const schema = {
  users: users,
  ageGroups: ageGroups,
  genders: genders,
  ethnicities: ethnicities,
  politicalParties: politicalParties,
  userDemographics: userDemographics,
  userProfiles: userProfiles,
  userRoles: userRoles,
  roleEnum: roleEnum,
  polls: polls,
  pollStatusEnum: pollStatusEnum,
  statements: statements,
  votes: votes,
  userPollInsights: userPollInsights,
};

const client = postgres(process.env.DATABASE_URL!, {
  max: 1, // Limit connections for serverless
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });