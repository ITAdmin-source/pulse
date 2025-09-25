import { eq, desc } from "drizzle-orm";
import { db } from "../db";
import { ageGroups, type AgeGroup, type NewAgeGroup } from "../schema/age-groups";

export async function getAgeGroupById(id: number): Promise<AgeGroup | undefined> {
  const result = await db
    .select()
    .from(ageGroups)
    .where(eq(ageGroups.id, id))
    .limit(1);

  return result[0];
}

export async function getAllAgeGroups(): Promise<AgeGroup[]> {
  return await db
    .select()
    .from(ageGroups)
    .orderBy(desc(ageGroups.id));
}

export async function createAgeGroup(data: NewAgeGroup): Promise<AgeGroup> {
  const result = await db
    .insert(ageGroups)
    .values(data)
    .returning();

  return result[0];
}

export async function updateAgeGroup(id: number, data: Partial<NewAgeGroup>): Promise<AgeGroup | undefined> {
  const result = await db
    .update(ageGroups)
    .set(data)
    .where(eq(ageGroups.id, id))
    .returning();

  return result[0];
}

export async function deleteAgeGroup(id: number): Promise<boolean> {
  const result = await db
    .delete(ageGroups)
    .where(eq(ageGroups.id, id))
    .returning({ id: ageGroups.id });

  return result.length > 0;
}