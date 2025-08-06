import { clerkClient, clerkMiddleware } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { withCORSProtection } from "./lib/cors";
import { withCSRFProtection } from "./lib/csrf";

export default clerkMiddleware(async (auth, request: NextRequest) => {
  //create response
  const response = NextResponse.next();

  //Instance clerk
  const clerk = await clerkClient();

  //Get the pathname
  const pathname = request.nextUrl.pathname;

  //Get the userId
  const { userId } = await auth();

  //Apply CSRF to Api that do not require CSRF
  if (request.nextUrl.pathname === "/api/csrf" || pathname.startsWith("/")) {
    return NextResponse.next(); //Allowing without CSRF CHECK
  }

  // Apply CORS to all API routes
  if (pathname.startsWith("/api/")) {
    return withCORSProtection(request, async (request) => {
      //Apply CSRF Protection
      return withCSRFProtection(request, async () => {
        //Continue the API route
        return response;
      });
    });
  }

  //Api that do require authorization token only (user API) not admin
  if (
    !pathname.startsWith("/api/public") ||
    !pathname.startsWith("/api/webhooks") ||
    !pathname.startsWith("/") ||
    !pathname.startsWith("/api-docs")
  ) {
    if (!userId) {
      return NextResponse.json(
        {
          error: "You are not connected",
        },
        {
          status: 401,
        }
      );
    }
    return response;
  }

  // Api that require admin role
  if (userId && pathname.startsWith("/api/admin")) {
    if (!userId) {
      return NextResponse.json(
        {
          error: "You are not connected",
        },
        {
          status: 401,
        }
      );
      return response;
    }
    const user = await clerk.users.getUser(userId);

    if (user.privateMetadata.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return response;
  }

  //For all others api (non-API) just go ahead
  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
