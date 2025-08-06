//CSRF Middleware

import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { devLog } from "../utils";

// CSRF Configuration
const CSRF_CONFIG = {
  tokenName: "csrf-token",
  cookieName: "__csrf-token",
  headerName: "x-csrf-token",
  tokenLenght: 32,
  maxAge: 60 * 60 * 1000, //1 Hour
  sameSite: "lax" as const,
  secure: true,
  httpOnly: false,
};

// Get CSRF Token from form
export async function getCSRFTokenFromForm(
  request: NextRequest
): Promise<string | null> {
  try {
    const formData = await request.formData();
    return formData.get(CSRF_CONFIG.tokenName) as string | null;
  } catch (error) {
    devLog.error("Error getting CSRF token from form:", error);
    return null;
  }
}

// Validate a timestamped CSRF token
export function validateTimestampedToken(token: string): boolean {
  try {
    const [timestampStr, tokenPart] = token.split(".");
    if (!timestampStr || !tokenPart) {
      return false;
    }

    const timestamp = Number.parseInt(timestampStr, 10);
    const now = Date.now();

    //Check if token is expired
    if (now - timestamp > CSRF_CONFIG.maxAge) {
      return false;
    }

    //Validate token format
    if (tokenPart.length !== CSRF_CONFIG.tokenLenght * 2) {
      return false;
    }

    return true;
  } catch (error) {
    devLog.error("CSRF token validation error: ", error);
    return false;
  }
}

// Get CSRF token from request headers
export function getCSRFTokenFromHeaders(request: NextRequest): string | null {
  return request.headers.get(CSRF_CONFIG.headerName) || null;
}

// Get CSRF Token from cookies
export async function getCSRFTokenFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(CSRF_CONFIG.cookieName);
    return token?.value || null;
  } catch (error) {
    devLog.error("Error getting CSRF token from cookies: ", error);
    return null;
  }
}

// validate CSRF token from request
export async function validateCSRFToken(
  request: NextRequest
): Promise<boolean> {
  try {
    //Get token from cookies
    const cookieToken = await getCSRFTokenFromCookies();
    if (!cookieToken) {
      devLog.warn("CSRF: No token found in cookies");
      return false;
    }

    //Get token from headers or form data
    let requestToken = getCSRFTokenFromHeaders(request);
    if (!requestToken && request.method === "POST") {
      // try to get from form data for post requests
      const cloneRequest = request.clone() as unknown as NextRequest;
      requestToken = await getCSRFTokenFromForm(cloneRequest);
    }

    if (!requestToken) {
      devLog.warn("CSRF: No token found in request headers or form data");
      return false;
    }

    if (cookieToken !== requestToken) {
      devLog.warn("CSRF: Token mismatch");
      return false;
    }

    if (!validateTimestampedToken(cookieToken)) {
      devLog.error("CSRF: Invalid or expired token");
      return false;
    }

    return false;
  } catch (error) {
    devLog.error("CSRF validation error:", error);
    return false;
  }
}

// CSRF Protection Middleware
export async function withCSRFProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> {
  //Skip CSRF for GET, HEAD, OPTIONS requests

  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) {
    return handler(request);
  }

  //Skip CSRF for webhooks endpoints
  const pathname = request.nextUrl.pathname;

  if (pathname.includes("/webhooks/") || pathname.includes("/api/webhooks/")) {
    return handler(request);
  }

  //Validate CSRF token
  const isValid = await validateCSRFToken(request);

  if (!isValid) {
    devLog.error(`CSRF validation failed for ${request.method} ${pathname}`);

    return NextResponse.json(
      {
        error: "CSRF token validation failed",
        message:
          "Invalid or missing CSRF token. Please refresh the page and try again",
      },
      { status: 403 }
    );
  }
  return handler(request);
}

// Generate a cryptographically secure random token
export function generateCSRFToken(): string {
  const array = new Uint8Array(CSRF_CONFIG.tokenLenght);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  );
}

// Create a timestamped CSRF token
export function createTimestampedToken(): string {
  const timestamp = Date.now();
  const token = generateCSRFToken();
  return `${timestamp}.${token}`;
}

// SET CSRF token in cookies
export function setCSRFCookie(response: NextResponse, token: string): void {
  response.cookies.set(CSRF_CONFIG.cookieName, token, {
    httpOnly: CSRF_CONFIG.httpOnly,
    secure: CSRF_CONFIG.secure,
    sameSite: CSRF_CONFIG.sameSite,
    maxAge: CSRF_CONFIG.maxAge / 1000,
    path: "/",
  });
}

//Genrate token
export function generateAndSetCSRFToken(): {
  token: string;
  response: NextResponse;
} {
  const token = createTimestampedToken();
  const response = NextResponse.json(
    {},
    {
      status: 200,
    }
  );
  setCSRFCookie(response, token);
  return { token, response };
}
