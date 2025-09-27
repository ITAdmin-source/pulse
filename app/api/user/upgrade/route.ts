import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserService } from "@/lib/services/user-service";
import { getSessionId } from "@/lib/utils/session";

export async function POST(request: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 }
      );
    }

    // Get session ID from cookies (should exist for users who had anonymous session)
    const sessionId = await getSessionId();

    if (!sessionId) {
      // No anonymous session to upgrade, user signed up fresh
      console.log("No anonymous session found for sign-up, user is new");
      return NextResponse.json({ message: "No upgrade needed" });
    }

    // Check if there's an anonymous user to upgrade
    const anonymousUser = await UserService.findBySessionId(sessionId);
    if (!anonymousUser) {
      console.log("No anonymous user found for session:", sessionId);
      return NextResponse.json({ message: "No upgrade needed" });
    }

    console.log("Upgrading anonymous user to authenticated:", anonymousUser.id, "->", clerkUserId);

    const upgradedUser = await UserService.upgradeAnonymousUser({
      sessionId,
      clerkUserId,
    });

    return NextResponse.json({ user: upgradedUser, upgraded: true });
  } catch (error) {
    console.error("Error upgrading user:", error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes("Anonymous user not found")) {
        return NextResponse.json(
          { error: "Anonymous user session not found" },
          { status: 404 }
        );
      }
      if (error.message.includes("User with this Clerk ID already exists")) {
        return NextResponse.json(
          { error: "User already has an authenticated account" },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to upgrade user" },
      { status: 500 }
    );
  }
}