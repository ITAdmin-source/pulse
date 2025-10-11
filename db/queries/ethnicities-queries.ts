import { eq, asc } from "drizzle-orm";
import { db } from "../db";
import { ethnicities, type Ethnicity, type NewEthnicity } from "../schema/ethnicities";

export async function getEthnicityById(id: number): Promise<Ethnicity | undefined> {
  const result = await db
    .select()
    .from(ethnicities)
    .where(eq(ethnicities.id, id))
    .limit(1);

  return result[0];
}

export async function getAllEthnicities(): Promise<Ethnicity[]> {
  return await db
    .select()
    .from(ethnicities)
    .orderBy(asc(ethnicities.id));
}

export async function createEthnicity(data: NewEthnicity): Promise<Ethnicity> {
  const result = await db
    .insert(ethnicities)
    .values(data)
    .returning();

  return result[0];
}

export async function updateEthnicity(id: number, data: Partial<NewEthnicity>): Promise<Ethnicity | undefined> {
  const result = await db
    .update(ethnicities)
    .set(data)
    .where(eq(ethnicities.id, id))
    .returning();

  return result[0];
}

export async function deleteEthnicity(id: number): Promise<boolean> {
  const result = await db
    .delete(ethnicities)
    .where(eq(ethnicities.id, id))
    .returning({ id: ethnicities.id });

  return result.length > 0;
}