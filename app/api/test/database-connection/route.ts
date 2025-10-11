import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db/db";
import { users } from "@/db/schema";
import { UserService } from "@/lib/services/user-service";
import { sql } from "drizzle-orm";

export async function POST(_request: NextRequest) {
  try {
    console.log("=== DATABASE CONNECTION TEST ===");

    // Test 1: Basic table query to test connection
    console.log("Test 1: Testing basic database connection...");
    try {
      const result = await db.select().from(users).limit(1);
      console.log("✅ Basic connection successful. Table accessible:", result.length >= 0);
    } catch (error) {
      console.error("❌ Basic connection failed:", error);
      return NextResponse.json({
        success: false,
        error: "Database connection failed",
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

    // Test 2: Count existing users
    console.log("Test 2: Counting existing users...");
    try {
      const userCount = await db.select({ count: sql<number>`count(*)` }).from(users);
      console.log("✅ Current user count:", userCount[0]?.count || 0);
    } catch (error) {
      console.error("❌ Count query failed:", error);
      return NextResponse.json({
        success: false,
        error: "User count query failed",
        details: error instanceof Error ? error.message : String(error)
      }, { status: 500 });
    }

    // Test 3: Try UserService create user
    console.log("Test 3: Testing UserService.createUser...");
    const mockClerkId = `test_clerk_${Date.now()}`;

    try {
      const serviceUser = await UserService.createUser({
        clerkUserId: mockClerkId,
      });

      console.log("✅ UserService insert successful:", serviceUser);

      // Test 4: Try to find the created user
      const foundUser = await UserService.findByClerkId(mockClerkId);
      console.log("✅ User found after creation:", !!foundUser);

      return NextResponse.json({
        success: true,
        message: "Database connection and UserService working!",
        tests: {
          basicConnection: true,
          tableQuery: true,
          userServiceCreate: true,
          userServiceFind: !!foundUser
        },
        createdUser: serviceUser,
        foundUser: foundUser
      });

    } catch (serviceError) {
      console.error("❌ UserService failed:", serviceError);

      return NextResponse.json({
        success: false,
        error: "UserService failed",
        details: {
          serviceError: serviceError instanceof Error ? serviceError.message : String(serviceError),
          stack: serviceError instanceof Error ? serviceError.stack : undefined
        }
      }, { status: 500 });
    }

  } catch (error) {
    console.error("❌ Test failed completely:", error);
    return NextResponse.json({
      success: false,
      error: "Database test failed",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Use POST to run database connection test",
    instructions: "Send a POST request to this endpoint to test database connectivity and insert mock data"
  });
}