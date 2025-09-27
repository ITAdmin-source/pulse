import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { Webhook } from "svix";
import { UserService } from "@/lib/services/user-service";

export async function POST(request: NextRequest) {
  // Get the headers
  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  // If there are no headers, error out
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new NextResponse("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  // Get the body
  const payload = await request.text();

  // Get the Clerk webhook secret from environment variables
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    return new NextResponse("Error occurred -- no webhook secret", {
      status: 500,
    });
  }

  // Create a new Svix instance with your secret
  const wh = new Webhook(WEBHOOK_SECRET);

  let evt: { type: string; data: Record<string, unknown> };

  // Verify the payload with the headers
  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as { type: string; data: Record<string, unknown> };
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new NextResponse("Error occurred", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;
  console.log(`Clerk webhook event: ${eventType}`);

  try {
    switch (eventType) {
      case "user.created":
        await handleUserCreated(evt.data as Parameters<typeof handleUserCreated>[0]);
        break;
      case "user.updated":
        await handleUserUpdated(evt.data as Parameters<typeof handleUserUpdated>[0]);
        break;
      case "user.deleted":
        await handleUserDeleted(evt.data as Parameters<typeof handleUserDeleted>[0]);
        break;
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return new NextResponse("Success", { status: 200 });
  } catch (error) {
    console.error(`Error handling webhook event ${eventType}:`, error);
    console.error('Webhook payload:', JSON.stringify(evt.data, null, 2));
    return new NextResponse(`Error occurred while processing webhook: ${error}`, {
      status: 500,
    });
  }
}

async function handleUserCreated(data: {
  id: string;
  first_name?: string;
  last_name?: string;
  email_addresses?: Array<{ email_address: string }>;
  image_url?: string;
  created_at?: number;
}) {
  console.log("Handling user creation from webhook:", data.id);

  try {
    // Check if user already exists to prevent duplicates
    const existingUser = await UserService.findByClerkId(data.id);
    if (existingUser) {
      console.log("User already exists, skipping creation");
      return;
    }

    // For sign-ups: Check if there's an anonymous user session to upgrade
    // This requires client-side to call upgrade endpoint with session info
    // For now, just create the authenticated user
    await UserService.createUser({
      clerkUserId: data.id,
      metadata: {
        firstName: data.first_name || null,
        lastName: data.last_name || null,
        emailAddress: data.email_addresses?.[0]?.email_address || null,
        imageUrl: data.image_url || null,
        createdAt: data.created_at ? new Date(data.created_at) : null,
      },
    });

    console.log("Successfully created authenticated user:", data.id);
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

async function handleUserUpdated(data: {
  id: string;
  first_name?: string;
  last_name?: string;
  email_addresses?: Array<{ email_address: string }>;
  image_url?: string;
  updated_at?: number;
}) {
  console.log("Updating user from webhook:", data.id);

  try {
    const user = await UserService.findByClerkId(data.id);
    if (!user) {
      console.log("User not found, creating new user");
      await handleUserCreated(data);
      return;
    }

    // Update user metadata
    await UserService.updateUser(user.id, {
      metadata: {
        ...(user.metadata as Record<string, unknown> || {}),
        firstName: data.first_name || null,
        lastName: data.last_name || null,
        emailAddress: data.email_addresses?.[0]?.email_address || null,
        imageUrl: data.image_url || null,
        updatedAt: data.updated_at ? new Date(data.updated_at) : null,
      },
    });

    console.log("Successfully updated user:", data.id);
  } catch (error) {
    console.error("Error updating user:", error);
    throw error;
  }
}

async function handleUserDeleted(data: { id: string }) {
  console.log("Deleting user from webhook:", data.id);

  try {
    const user = await UserService.findByClerkId(data.id);
    if (!user) {
      console.log("User not found, nothing to delete");
      return;
    }

    // Delete user and all related data (cascaded by foreign key constraints)
    await UserService.deleteUser(user.id);

    console.log("Successfully deleted user:", data.id);
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}