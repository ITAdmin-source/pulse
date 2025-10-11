import { eq, asc } from "drizzle-orm";
import { db } from "../db";
import { genders, type Gender, type NewGender } from "../schema/genders";

export async function getGenderById(id: number): Promise<Gender | undefined> {
  const result = await db
    .select()
    .from(genders)
    .where(eq(genders.id, id))
    .limit(1);

  return result[0];
}

export async function getAllGenders(): Promise<Gender[]> {
  return await db
    .select()
    .from(genders)
    .orderBy(asc(genders.id));
}

export async function createGender(data: NewGender): Promise<Gender> {
  const result = await db
    .insert(genders)
    .values(data)
    .returning();

  return result[0];
}

export async function updateGender(id: number, data: Partial<NewGender>): Promise<Gender | undefined> {
  const result = await db
    .update(genders)
    .set(data)
    .where(eq(genders.id, id))
    .returning();

  return result[0];
}

export async function deleteGender(id: number): Promise<boolean> {
  const result = await db
    .delete(genders)
    .where(eq(genders.id, id))
    .returning({ id: genders.id });

  return result.length > 0;
}