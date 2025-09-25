"use server";

import { revalidatePath } from "next/cache";
import {
  createAgeGroup,
  deleteAgeGroup,
  getAgeGroupById,
  getAllAgeGroups,
  updateAgeGroup,
} from "@/db/queries/age-groups-queries";
import { type NewAgeGroup } from "@/db/schema/age-groups";

export async function createAgeGroupAction(data: NewAgeGroup) {
  try {
    const ageGroup = await createAgeGroup(data);
    revalidatePath("/age-groups");
    return { success: true, data: ageGroup };
  } catch (error) {
    console.error("Error creating age group:", error);
    return { success: false, error: "Failed to create age group" };
  }
}

export async function updateAgeGroupAction(id: number, data: Partial<NewAgeGroup>) {
  try {
    const updatedAgeGroup = await updateAgeGroup(id, data);
    if (!updatedAgeGroup) {
      return { success: false, error: "AgeGroup not found" };
    }
    revalidatePath("/age-groups");
    return { success: true, data: updatedAgeGroup };
  } catch (error) {
    console.error("Error updating age group:", error);
    return { success: false, error: "Failed to update age group" };
  }
}

export async function deleteAgeGroupAction(id: number) {
  try {
    const success = await deleteAgeGroup(id);
    if (!success) {
      return { success: false, error: "AgeGroup not found" };
    }
    revalidatePath("/age-groups");
    return { success: true };
  } catch (error) {
    console.error("Error deleting age group:", error);
    return { success: false, error: "Failed to delete age group" };
  }
}

export async function getAgeGroupsAction() {
  try {
    const ageGroups = await getAllAgeGroups();
    return { success: true, data: ageGroups };
  } catch (error) {
    console.error("Error fetching age groups:", error);
    return { success: false, error: "Failed to fetch age groups" };
  }
}

export async function getAgeGroupByIdAction(id: number) {
  try {
    const ageGroup = await getAgeGroupById(id);
    if (!ageGroup) {
      return { success: false, error: "AgeGroup not found" };
    }
    return { success: true, data: ageGroup };
  } catch (error) {
    console.error("Error fetching age group:", error);
    return { success: false, error: "Failed to fetch age group" };
  }
}