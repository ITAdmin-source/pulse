"use server";

import { revalidatePath } from "next/cache";
import {
  createPoliticalParty,
  deletePoliticalParty,
  getPoliticalPartyById,
  getAllPoliticalParties,
  updatePoliticalParty,
} from "@/db/queries/political-parties-queries";
import { type NewPoliticalParty } from "@/db/schema/political-parties";

export async function createPoliticalPartyAction(data: NewPoliticalParty) {
  try {
    const politicalParty = await createPoliticalParty(data);
    revalidatePath("/political-parties");
    return { success: true, data: politicalParty };
  } catch (error) {
    console.error("Error creating political party:", error);
    return { success: false, error: "Failed to create political party" };
  }
}

export async function updatePoliticalPartyAction(id: number, data: Partial<NewPoliticalParty>) {
  try {
    const updatedPoliticalParty = await updatePoliticalParty(id, data);
    if (!updatedPoliticalParty) {
      return { success: false, error: "PoliticalParty not found" };
    }
    revalidatePath("/political-parties");
    return { success: true, data: updatedPoliticalParty };
  } catch (error) {
    console.error("Error updating political party:", error);
    return { success: false, error: "Failed to update political party" };
  }
}

export async function deletePoliticalPartyAction(id: number) {
  try {
    const success = await deletePoliticalParty(id);
    if (!success) {
      return { success: false, error: "PoliticalParty not found" };
    }
    revalidatePath("/political-parties");
    return { success: true };
  } catch (error) {
    console.error("Error deleting political party:", error);
    return { success: false, error: "Failed to delete political party" };
  }
}

export async function getPoliticalPartiesAction() {
  try {
    const politicalParties = await getAllPoliticalParties();
    return { success: true, data: politicalParties };
  } catch (error) {
    console.error("Error fetching political parties:", error);
    return { success: false, error: "Failed to fetch political parties" };
  }
}

export async function getPoliticalPartyByIdAction(id: number) {
  try {
    const politicalParty = await getPoliticalPartyById(id);
    if (!politicalParty) {
      return { success: false, error: "PoliticalParty not found" };
    }
    return { success: true, data: politicalParty };
  } catch (error) {
    console.error("Error fetching political party:", error);
    return { success: false, error: "Failed to fetch political party" };
  }
}