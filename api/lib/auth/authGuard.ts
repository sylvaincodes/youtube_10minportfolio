import { auth, clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { devLog } from "../utils";

type ClerkUserWithPrivateMetadata = {
  privateMetadata: Record<string, unknown>;
};

type AuthGuardResult =
  | NextResponse
  | { userId: string; sessionId: string; user: ClerkUserWithPrivateMetadata };

// Middleware helper to protect routes
export async function authGuard({
  requireAdmin = true,
} = {}): Promise<AuthGuardResult> {
  try {
    // retreive the authenticated user and session
    const { userId, sessionId } = await auth();

    //redirect to sign in if not authenticated
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    //fetch full user details from clerk
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(userId);

    // if admin role is true, check private metadata
    if (requireAdmin && user.privateMetadata.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    //Authorized response
    return { userId, sessionId, user };
  } catch (error) {
    devLog.error("AuthGuard Error: ", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
