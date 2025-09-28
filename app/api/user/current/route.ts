import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserService } from "@/lib/services/user-service";
import { getOrCreateSessionId } from "@/lib/utils/session";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    if (clerkUserId) {
      // User is authenticated with Clerk - use JIT creation
      const dbUser = await UserService.getOrCreateUserByClerkId(clerkUserId);
      return NextResponse.json({ user: dbUser });
    } else {
      // Anonymous user - get session ID but don't create user yet
      const sessionId = await getOrCreateSessionId();
      const dbUser = await UserService.findBySessionId(sessionId);
      return NextResponse.json({
        user: dbUser,
        sessionId: sessionId // Include sessionId for anonymous users
      });
    }
  } catch (error) {
    console.error("Error fetching current user:", error);
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }
}