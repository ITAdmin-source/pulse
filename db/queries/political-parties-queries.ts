import { eq, asc } from "drizzle-orm";
import { db } from "../db";
import { politicalParties, type PoliticalParty, type NewPoliticalParty } from "../schema/political-parties";

export async function getPoliticalPartyById(id: number): Promise<PoliticalParty | undefined> {
  const result = await db
    .select()
    .from(politicalParties)
    .where(eq(politicalParties.id, id))
    .limit(1);

  return result[0];
}

export async function getAllPoliticalParties(): Promise<PoliticalParty[]> {
  return await db
    .select()
    .from(politicalParties)
    .orderBy(asc(politicalParties.id));
}

export async function createPoliticalParty(data: NewPoliticalParty): Promise<PoliticalParty> {
  const result = await db
    .insert(politicalParties)
    .values(data)
    .returning();

  return result[0];
}

export async function updatePoliticalParty(id: number, data: Partial<NewPoliticalParty>): Promise<PoliticalParty | undefined> {
  const result = await db
    .update(politicalParties)
    .set(data)
    .where(eq(politicalParties.id, id))
    .returning();

  return result[0];
}

export async function deletePoliticalParty(id: number): Promise<boolean> {
  const result = await db
    .delete(politicalParties)
    .where(eq(politicalParties.id, id))
    .returning({ id: politicalParties.id });

  return result.length > 0;
}