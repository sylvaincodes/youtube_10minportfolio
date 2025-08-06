import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  //CSP and security headers
  async headers() {
    return [
      {
        //Enhance security for API routes
        source: "/api/(.*)",
        headers: [
          //CORS
          {
            key: "Access-Control-Allow-Origin",
            value:
              process.env.NODE_ENV === "production"
                ? process.env.ALLOWED_ORIGINS || ""
                : "http://localhost:3000",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, PATCH,OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Content-Type, Authorization, X-CSRF-Token, X-Requested-With, Origin",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
          {
            key: "Vary",
            value: "Origin",
          },

          //More security
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },

  //Add more env variables
  env: {
    CORS_ENABLED: process.env.CORS_ENABLED || "true",
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
