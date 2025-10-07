"use server";

import { AdminService } from "@/lib/services/admin-service";

export async function getSystemStatsAction() {
  try {
    const stats = await AdminService.getSystemStats();
    return { success: true, data: stats };
  } catch (error) {
    console.error("Error fetching system stats:", error);
    return { success: false, error: "Failed to fetch system stats" };
  }
}

export async function getRecentActivityAction(limit: number = 10) {
  try {
    const activity = await AdminService.getRecentActivity(limit);
    return { success: true, data: activity };
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    return { success: false, error: "Failed to fetch recent activity" };
  }
}

export async function getAllPollsForAdminAction() {
  try {
    const polls = await AdminService.getAllPollsForAdmin();
    return { success: true, data: polls };
  } catch (error) {
    console.error("Error fetching polls for admin:", error);
    return { success: false, error: "Failed to fetch polls" };
  }
}
