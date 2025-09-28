import { NextRequest, NextResponse } from "next/server";
import { UserService } from "@/lib/services/user-service";

export async function POST(request: NextRequest) {
  try {
    console.log("=== DEBUG WEBHOOK TEST ===");

    // Test 1: Check environment variables
    const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
    console.log("CLERK_WEBHOOK_SECRET exists:", !!webhookSecret);
    console.log("CLERK_WEBHOOK_SECRET length:", webhookSecret?.length || 0);

    // Test 2: Check database connection
    console.log("Testing database connection...");
    const testUser = await UserService.findByClerkId("test-non-existent-id");
    console.log("Database query successful:", testUser === null);

    // Test 3: Test user creation with sample data
    console.log("Testing user creation...");
    const testUserData = {
      clerkUserId: "user_test_debug_" + Date.now(),
      metadata: {
        firstName: null,
        lastName: null,
        emailAddress: "test@example.com",
        imageUrl: null,
        createdAt: new Date(),
      },
    };

    const createdUser = await UserService.createUser(testUserData);
    console.log("User creation successful:", !!createdUser.id);

    // Clean up test user
    await UserService.deleteUser(createdUser.id);
    console.log("Test user cleaned up");

    return NextResponse.json({
      success: true,
      tests: {
        webhookSecret: !!webhookSecret,
        databaseConnection: true,
        userCreation: true,
      }
    });

  } catch (error) {
    console.error("Debug test failed:", error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}