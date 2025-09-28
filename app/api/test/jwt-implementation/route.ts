import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { UserService } from "@/lib/services/user-service";
import { UserProfileService } from "@/lib/services/user-profile-service";

export async function GET() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({
        success: false,
        message: "Not authenticated - sign in to test JWT implementation"
      });
    }

    console.log("=== Testing JWT-Only Implementation ===");
    console.log("Clerk User ID:", clerkUserId);

    // Test 1: JIT User Creation
    console.log("Test 1: JIT User Creation");
    const dbUser = await UserService.getOrCreateUserByClerkId(clerkUserId);
    console.log("Database user created/found:", dbUser.id);

    // Test 2: Profile Data Fetching
    console.log("Test 2: Profile Data Fetching");
    const profile = await UserProfileService.getUserProfile(clerkUserId);
    console.log("Profile data retrieved:", !!profile);

    // Test 3: Display Name
    console.log("Test 3: Display Name");
    const displayName = await UserProfileService.getUserDisplayName(clerkUserId);
    console.log("Display name:", displayName);

    // Test 4: Social Profiles
    console.log("Test 4: Social Profiles");
    const socialProfiles = await UserProfileService.getSocialProfiles(clerkUserId);
    console.log("Social profiles count:", socialProfiles.length);

    return NextResponse.json({
      success: true,
      message: "JWT-only implementation working correctly!",
      data: {
        clerkUserId,
        databaseUserId: dbUser.id,
        profileFetched: !!profile,
        displayName,
        socialProfilesCount: socialProfiles.length,
        createdAt: dbUser.createdAt,
        hasMetadata: !!dbUser.metadata,
      }
    });

  } catch (error) {
    console.error("JWT implementation test failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}