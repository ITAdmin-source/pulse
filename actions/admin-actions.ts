"use server";

import { revalidatePath } from "next/cache";
import { clerkClient } from "@clerk/nextjs/server";
import { AdminService } from "@/lib/services/admin-service";
import { UserService } from "@/lib/services/user-service";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { isNotNull } from "drizzle-orm";

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

/**
 * Sync all user profiles from Clerk to cache their email addresses
 * This is useful for the admin user management page
 */
export async function syncAllUserProfilesAction() {
  try {
    // Get all authenticated users (those with clerk_user_id)
    const authenticatedUsers = await db
      .select()
      .from(users)
      .where(isNotNull(users.clerkUserId));

    let successCount = 0;
    let errorCount = 0;

    for (const user of authenticatedUsers) {
      if (!user.clerkUserId) continue;

      try {
        // Fetch profile from Clerk
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(user.clerkUserId);

        // Update metadata with profile data
        await UserService.updateCachedMetadata(user.id, {
          profileData: {
            id: clerkUser.id,
            firstName: clerkUser.firstName,
            lastName: clerkUser.lastName,
            fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
            imageUrl: clerkUser.imageUrl,
            primaryEmailAddress: clerkUser.primaryEmailAddress
              ? { emailAddress: clerkUser.primaryEmailAddress.emailAddress }
              : undefined,
          },
          lastSyncedAt: new Date().toISOString(),
        });

        successCount++;
      } catch (error) {
        console.error(`Failed to sync profile for user ${user.id}:`, error);
        errorCount++;
      }
    }

    revalidatePath("/admin/users");

    return {
      success: true,
      message: `Synced ${successCount} profiles successfully${errorCount > 0 ? `, ${errorCount} failed` : ''}`,
      successCount,
      errorCount,
    };
  } catch (error) {
    console.error("Error syncing user profiles:", error);
    return {
      success: false,
      error: "Failed to sync user profiles",
    };
  }
}

/**
 * Sync a single user's profile from Clerk
 */
export async function syncUserProfileAction(userId: string) {
  try {
    const user = await UserService.findById(userId);

    if (!user || !user.clerkUserId) {
      return {
        success: false,
        error: "User not found or not authenticated",
      };
    }

    // Fetch profile from Clerk
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(user.clerkUserId);

    // Update metadata with profile data
    await UserService.updateCachedMetadata(user.id, {
      profileData: {
        id: clerkUser.id,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        fullName: `${clerkUser.firstName || ''} ${clerkUser.lastName || ''}`.trim(),
        imageUrl: clerkUser.imageUrl,
        primaryEmailAddress: clerkUser.primaryEmailAddress
          ? { emailAddress: clerkUser.primaryEmailAddress.emailAddress }
          : undefined,
      },
      lastSyncedAt: new Date().toISOString(),
    });

    revalidatePath("/admin/users");

    return {
      success: true,
      message: "Profile synced successfully",
      email: clerkUser.primaryEmailAddress?.emailAddress,
    };
  } catch (error) {
    console.error("Error syncing user profile:", error);
    return {
      success: false,
      error: "Failed to sync user profile",
    };
  }
}
