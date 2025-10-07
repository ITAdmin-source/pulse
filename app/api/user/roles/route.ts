import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserService } from "@/lib/services/user-service";

export async function GET(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    // Support both authenticated users and query parameter for admin purposes
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get('userId');

    // If requesting another user's roles (admin feature)
    if (requestedUserId) {
      const roles = await UserService.getUserRoles(requestedUserId);
      return NextResponse.json({ roles });
    }

    // Get current user's roles
    if (!clerkUserId) {
      return NextResponse.json({ roles: [] });
    }

    const user = await UserService.findByClerkId(clerkUserId);
    if (!user) {
      return NextResponse.json({ roles: [] });
    }

    const roles = await UserService.getUserRoles(user.id);
    return NextResponse.json({
      roles,
      userId: user.id
    });
  } catch (error) {
    console.error("Error fetching user roles:", error);
    return NextResponse.json(
      { error: "Failed to fetch user roles", roles: [] },
      { status: 500 }
    );
  }
}