"use server";

import { revalidatePath } from "next/cache";
import {
  createEthnicity,
  deleteEthnicity,
  getEthnicityById,
  getAllEthnicities,
  updateEthnicity,
} from "@/db/queries/ethnicities-queries";
import { type NewEthnicity } from "@/db/schema/ethnicities";

export async function createEthnicityAction(data: NewEthnicity) {
  try {
    const ethnicity = await createEthnicity(data);
    revalidatePath("/ethnicities");
    return { success: true, data: ethnicity };
  } catch (error) {
    console.error("Error creating ethnicity:", error);
    return { success: false, error: "Failed to create ethnicity" };
  }
}

export async function updateEthnicityAction(id: number, data: Partial<NewEthnicity>) {
  try {
    const updatedEthnicity = await updateEthnicity(id, data);
    if (!updatedEthnicity) {
      return { success: false, error: "Ethnicity not found" };
    }
    revalidatePath("/ethnicities");
    return { success: true, data: updatedEthnicity };
  } catch (error) {
    console.error("Error updating ethnicity:", error);
    return { success: false, error: "Failed to update ethnicity" };
  }
}

export async function deleteEthnicityAction(id: number) {
  try {
    const success = await deleteEthnicity(id);
    if (!success) {
      return { success: false, error: "Ethnicity not found" };
    }
    revalidatePath("/ethnicities");
    return { success: true };
  } catch (error) {
    console.error("Error deleting ethnicity:", error);
    return { success: false, error: "Failed to delete ethnicity" };
  }
}

export async function getEthnicitiesAction() {
  try {
    const ethnicities = await getAllEthnicities();
    return { success: true, data: ethnicities };
  } catch (error) {
    console.error("Error fetching ethnicities:", error);
    return { success: false, error: "Failed to fetch ethnicities" };
  }
}

export async function getEthnicityByIdAction(id: number) {
  try {
    const ethnicity = await getEthnicityById(id);
    if (!ethnicity) {
      return { success: false, error: "Ethnicity not found" };
    }
    return { success: true, data: ethnicity };
  } catch (error) {
    console.error("Error fetching ethnicity:", error);
    return { success: false, error: "Failed to fetch ethnicity" };
  }
}