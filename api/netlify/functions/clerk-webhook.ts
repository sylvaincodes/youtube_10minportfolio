// CLERK WEBHOOK FOR CRUD USER
import connectDB from "@/lib/database";
import { devLog } from "@/lib/utils";
import { userRepository } from "@/repositories/UserRepository";
import { clerkClient, WebhookEvent } from "@clerk/nextjs/server";
import type { Handler } from "@netlify/functions";
import { Webhook } from "svix";
import IsEqual from "lodash.isequal";

type ClerkWebhookUser = {
  id: string;
  email_addresses: {
    id: string;
    email_address: string;
  }[];
  first_name: string | null;
  last_name: string | null;
  username: string | null;
  image_url: string;
  updated_at: number; // Unix timestamp
  primary_email_address_id: string | null;
};

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;
if (!webhookSecret) {
  throw new Error("Missing webhook secret in .env ");
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" }),
    };
  }

  const headers = event.headers;
  const payload = event.body;

  if (!payload) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "No payload provided" }),
    };
  }

  // eXTRACT sVIX SIGNATURE HEADERS
  const svix_id = headers["Svix-id"] || headers["Svix-Id"];
  const svix_timestamp = headers["Svix-Timestamp"] || headers["Svix-timestamp"];
  const svix_signature = headers["Svix-Signature"] || headers["Svix-signature"];

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Missing Svix headers" }),
    };
  }

  const wh = new Webhook(webhookSecret);
  let evt: WebhookEvent;

  try {
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as WebhookEvent;
  } catch (error) {
    devLog.error("Svix verification failed", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Invalid webhook signature" }),
    };
  }

  try {
    await connectDB();
    devLog.warn("Connect to MOngoDB");
    devLog.warn("Incomming Clerk event", evt.type);

    // Route the event type
    switch (evt.type) {
      case "user.created":
        await handleUserCreated(evt.data);
        break;

      case "user.updated":
        await handleUserUpdated(evt.data);
        break;

      case "user.deleted":
        await handleUserDeleted(evt.data);
        break;

      default:
        devLog.warn("Unhandled Clerk Event: ", evt.type);
        break;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Webhook processed successfully" }),
    };
  } catch (error) {
    devLog.error("Webhook processing failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Internal server error",
        details: error,
      }),
    };
  }
};

async function handleUserCreated(userData: ClerkWebhookUser) {
  try {
    const { id: clerkId, email_addresses, first_name, last_name } = userData;

    const primaryEmail = email_addresses.find(
      (email: { id: string }) => email.id === userData.primary_email_address_id
    );

    if (!primaryEmail) {
      throw new Error("No primary email found");
    }

    // Check if user already exists by clerkId
    const existingUser = await userRepository.findByClerkId(clerkId);

    if (existingUser) {
      if (existingUser.status == "suspended") {
        devLog.warn("Reactivating user ", clerkId);
        await userRepository.updateByClerkId(clerkId, {
          status: "active",
          updatedAt: new Date(),
        });
      } else {
        devLog.warn("User already exist and active", clerkId);
      }
      return;
    }

    // Check by email in case user recreated his clerk account
    const existingByEmail = await userRepository.findByEmail(
      primaryEmail.email_address
    );

    if (existingByEmail) {
      devLog.warn(
        `User with email ${primaryEmail.email_address} exists but has a different Clerk ID Relinking...`
      );
      await userRepository.updateById(existingByEmail._id.toString(), {
        clerkId,
        status: "active",
        updatedAt: new Date(),
      });
      return;
    }

    // Create new user
    devLog.warn("Creatin gnew user with email:", primaryEmail.email_address);
    const newUser = await userRepository.create({
      clerkId,
      email: primaryEmail.email_address,
      name: first_name + " " + last_name,
      plan: "free",
      role: "user",
      status: "active",
    });
    devLog.warn("User created successfully:", newUser.email);

    // Handle clerk user private metadata update
    let clerk = null;
    try {
      const clerkAwait = await clerkClient();
      clerk = await clerkAwait.users.getUser(clerkId);

      const newPrivateMetadata = {
        role: "user",
        plan: "free",
      };

      const shouldUpdate = clerk
        ? !IsEqual(clerk.privateMetadata, newPrivateMetadata)
        : false;

      if (shouldUpdate) {
        try {
          await clerkAwait.users.updateUser(clerkId, {
            privateMetadata: newPrivateMetadata,
          });
        } catch (error) {
          devLog.error("Failed to update Clerk user privateMetadata", error);
        }
      } else {
        devLog.warn("no need to update privateMetadata");
      }
    } catch (error) {
      devLog.error("failed to update privateMetadata", error);
      clerk = null;
    }
  } catch (error) {
    devLog.error("error creating user: ", error);
    throw error;
  }
}

async function handleUserUpdated(userData: ClerkWebhookUser) {
  try {
    const { id: clerkId, email_addresses, last_name, updated_at } = userData;

    const primaryEmail = email_addresses.find(
      (email: { id: string }) => email.id === userData.primary_email_address_id
    );

    if (!primaryEmail) {
      throw new Error("No primary email found");
    }

    const existingUser = await userRepository.findByClerkId(clerkId);

    if (!existingUser) {
      await handleUserCreated(userData);
    }

    // update user
    await userRepository.updateByClerkId(clerkId, {
      email: primaryEmail.email_address,
      name: last_name || existingUser?.name,
      updatedAt: new Date(updated_at),
    });
  } catch (error) {
    devLog.error("Error updating user:", error);
    throw error;
  }
}

async function handleUserDeleted(userData: Partial<ClerkWebhookUser>) {
  try {
    const { id: clerkId } = userData;
    const existingUser = await userRepository.findByClerkId(clerkId ?? "");
    if (!existingUser) {
      return;
    }
    // Soft delete
    await userRepository.updateByClerkId(clerkId ?? "", {
      status: "suspended",
      updatedAt: new Date(),
    });
  } catch (error) {
    devLog.error("Error while deleting:", error);
    throw Error;
  }
}
