import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db } from "@/db/db";
import { userRoles, users } from "@/db/schema";
import { eq, and, isNull } from "drizzle-orm";

/**
 * Bootstrap endpoint to create the first system admin
 * DELETE THIS FILE after initial setup for security
 */
export async function POST() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "Must be signed in with Clerk" },
        { status: 401 }
      );
    }

    // Find user in database by Clerk ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.clerkUserId, clerkUserId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: "User not found in database. Try visiting /polls first to create your user record." },
        { status: 404 }
      );
    }

    // Check if already has system_admin role
    const existingRole = await db
      .select()
      .from(userRoles)
      .where(
        and(
          eq(userRoles.userId, user.id),
          eq(userRoles.role, 'system_admin'),
          isNull(userRoles.pollId)
        )
      )
      .limit(1);

    if (existingRole.length > 0) {
      return NextResponse.json({
        message: "You already have system_admin role",
        userId: user.id,
        clerkUserId: user.clerkUserId,
      });
    }

    // Assign system_admin role
    const [newRole] = await db
      .insert(userRoles)
      .values({
        userId: user.id,
        role: 'system_admin',
        pollId: null,
      })
      .returning();

    return NextResponse.json({
      success: true,
      message: "System admin role assigned successfully! You can now access /admin/users",
      userId: user.id,
      clerkUserId: user.clerkUserId,
      roleId: newRole.id,
    });

  } catch (error) {
    console.error("Error bootstrapping first admin:", error);
    return NextResponse.json(
      { error: "Failed to assign system admin role", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
