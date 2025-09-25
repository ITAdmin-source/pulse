"use server";

import { revalidatePath } from "next/cache";
import {
  createGender,
  deleteGender,
  getGenderById,
  getAllGenders,
  updateGender,
} from "@/db/queries/genders-queries";
import { type NewGender } from "@/db/schema/genders";

export async function createGenderAction(data: NewGender) {
  try {
    const gender = await createGender(data);
    revalidatePath("/genders");
    return { success: true, data: gender };
  } catch (error) {
    console.error("Error creating gender:", error);
    return { success: false, error: "Failed to create gender" };
  }
}

export async function updateGenderAction(id: number, data: Partial<NewGender>) {
  try {
    const updatedGender = await updateGender(id, data);
    if (!updatedGender) {
      return { success: false, error: "Gender not found" };
    }
    revalidatePath("/genders");
    return { success: true, data: updatedGender };
  } catch (error) {
    console.error("Error updating gender:", error);
    return { success: false, error: "Failed to update gender" };
  }
}

export async function deleteGenderAction(id: number) {
  try {
    const success = await deleteGender(id);
    if (!success) {
      return { success: false, error: "Gender not found" };
    }
    revalidatePath("/genders");
    return { success: true };
  } catch (error) {
    console.error("Error deleting gender:", error);
    return { success: false, error: "Failed to delete gender" };
  }
}

export async function getGendersAction() {
  try {
    const genders = await getAllGenders();
    return { success: true, data: genders };
  } catch (error) {
    console.error("Error fetching genders:", error);
    return { success: false, error: "Failed to fetch genders" };
  }
}

export async function getGenderByIdAction(id: number) {
  try {
    const gender = await getGenderById(id);
    if (!gender) {
      return { success: false, error: "Gender not found" };
    }
    return { success: true, data: gender };
  } catch (error) {
    console.error("Error fetching gender:", error);
    return { success: false, error: "Failed to fetch gender" };
  }
}