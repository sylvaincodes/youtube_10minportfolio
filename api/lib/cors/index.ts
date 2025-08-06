import { CORSConfig } from "@/types/cors";
import { NextRequest, NextResponse } from "next/server";
import { devLog } from "../utils";

// Default CORS Configuration
const DEFAULT_CORS_CONFIG: CORSConfig = {
  allowedOrigins: [],
  allowedMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-CSRF-Token",
    "X-Requested-With",
    "Origin",
    "Accept",
    "Cache-Control",
  ],
  allowCredentials: true,
  maxAge: 86400, //24 HOURS
  optionsSuccessStatus: 200,
};

//Set CORS Headers on response
function setCORSHeaders(
  response: NextResponse,
  origin: string | null,
  config: CORSConfig
): NextResponse {
  //Determine which origin to allow
  let allowedOrigin = "*"; //all origins by default with *

  if (
    config.allowCredentials &&
    origin &&
    isOriginAllowed(origin, config.allowedOrigins)
  ) {
    allowedOrigin = origin;
  } else if (!config.allowCredentials) {
    allowedOrigin = "*";
  } else {
    // do not set CORS Headers just return the response quickly
    return response;
  }

  //if not
  response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
  response.headers.set(
    "Access-Control-Allow-Methods",
    config.allowedMethods.join(",")
  );
  response.headers.set(
    "Access-Control-Allow-Headers",
    config.allowedHeaders.join(",")
  );
  response.headers.set("Access-Control-Max-Age", config.maxAge.toString());
  if (config.allowCredentials) {
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }

  //Add Vary header for proper caching
  response.headers.set("Vary", "Origin");

  return response;
}

// Handle CORS Preflight requests (OPTIONS)
function handlePreflightRequest(
  request: NextRequest,
  config: CORSConfig
): NextResponse {
  //Get method ,origin and headers from frontend request
  const origin = request.headers.get("origin");
  const requestMethod = request.headers.get("access-control-request-method");
  const requestHeaders = request.headers.get("access-control-request-headers");

  //dev log
  devLog.warn("CORS Preflight request: ", {
    origin,
    requestMethod,
    requestHeaders,
    allowedOrigins: config.allowedOrigins,
  });

  //check if Origin is allowed
  if (!isOriginAllowed(origin, config.allowedOrigins)) {
    devLog.error("CORS: Origin not allowed", origin);
    return new NextResponse("CORS Policy violation ", {
      status: 403,
    });
  }

  //check if method is allowed
  if (requestMethod && !config.allowedMethods.includes(requestMethod)) {
    devLog.error("CORS: Method not allowed: ", requestMethod);
    return new NextResponse("CORS: Method not allowed:", { status: 405 });
  }

  //When everything is OK create preflight response
  const response = new NextResponse(null, {
    status: config.optionsSuccessStatus,
  });

  //Set CORS Headers
  setCORSHeaders(response, origin, config);

  devLog.warn("CORS Preflight: Request approved");

  return response;
}

// Check if Origin is allowed
function isOriginAllowed(
  origin: string | null,
  allowedOrigins: string[]
): boolean {
  // if same origin/ no origin provided, allow it
  if (!origin) {
    return true;
  }

  //check if origin is in allowed list
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  //In dev mode, allow always
  if (process.env.NODE_ENV === "development") {
    const isLocalhost =
      origin.includes("localhost") || origin.includes("127.0.0.1");
    if (isLocalhost) {
      return true;
    }
  }

  // otherwise denied
  return false;
}

// CORS middleware wrapper for API Routes
export function withCORSProtection(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse> | NextResponse
): Promise<NextResponse> | NextResponse {
  //get cors config
  const config = getCORSConfig();

  //get origin and method from request frontend
  const origin = request.headers.get("origin");
  const method = request.method;

  //dev log
  devLog.error("CORS Check: ", {
    method,
    origin,
    url: request.url,
    allowedOrigins: config.allowedOrigins,
  });

  //handle preflight requests
  if (method === "OPTIONS") {
    return handlePreflightRequest(request, config);
  }

  //check origin for actual requests
  if (origin && !isOriginAllowed(origin, config.allowedOrigins)) {
    devLog.error("CORS: Request blocked - Origin not allowed: ", origin);
    return NextResponse.json(
      { error: "CORS policy violation", origin },
      { status: 403 }
    );
  }

  //execute the handler and add CORS headers to response
  const handlerResult = handler(request);

  //handle both sync and async response
  if (handlerResult instanceof Promise) {
    return handlerResult.then((response) => {
      return setCORSHeaders(response, origin, config);
    });
  } else {
    return setCORSHeaders(handlerResult, origin, config);
  }
}

//Get CORS Config based on environment
function getCORSConfig(): CORSConfig {
  const config = { ...DEFAULT_CORS_CONFIG };

  //Environment based on origin config
  if (process.env.NODE_ENV === "production") {
    const allowedOrigins =
      process.env.ALLOWED_ORIGINS?.split(",").map((origin) => origin.trim()) ||
      [];

    config.allowedOrigins = allowedOrigins;
  } else {
    //Development: Allow localhost and common development
    config.allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001",
    ];
  }

  return config;
}
