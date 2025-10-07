"use server";

import { revalidatePath } from "next/cache";
import { UserManagementService } from "@/lib/services/user-management-service";

interface ListUsersOptions {
  page: number;
  limit: number;
  search?: string;
  userType?: 'all' | 'authenticated' | 'anonymous';
  roleFilter?: 'all' | 'admin' | 'owner' | 'manager' | 'none';
}

export async function listUsersAction(options: ListUsersOptions) {
  try {
    const result = await UserManagementService.listUsers(options);
    return { success: true, data: result };
  } catch (error) {
    console.error("Error listing users:", error);
    return { success: false, error: "Failed to list users" };
  }
}

export async function getUserStatsAction(userId: string) {
  try {
    const stats = await UserManagementService.getUserStats(userId);
    return { success: true, data: stats };
  } catch (error) {
    console.error("Error fetching user stats:", error);
    return { success: false, error: "Failed to fetch user stats" };
  }
}

export async function assignSystemAdminAction(userId: string) {
  try {
    await UserManagementService.assignSystemAdmin(userId);
    revalidatePath("/admin/users");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error assigning system admin:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to assign system admin";
    return { success: false, error: errorMessage };
  }
}

export async function revokeSystemAdminAction(userId: string) {
  try {
    await UserManagementService.revokeSystemAdmin(userId);
    revalidatePath("/admin/users");
    revalidatePath("/admin/dashboard");
    return { success: true };
  } catch (error) {
    console.error("Error revoking system admin:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to revoke system admin";
    return { success: false, error: errorMessage };
  }
}
