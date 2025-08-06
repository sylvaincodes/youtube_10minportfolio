import { generateAndSetCSRFToken } from "@/lib/csrf";
import { devLog } from "@/lib/utils";
import { NextResponse } from "next/server";

//Api route to generate token
export async function GET() {
  try {
    //generate token
    const { token, response } = generateAndSetCSRFToken();
    //Return the token in the response body for client side use
    return NextResponse.json(
      {
        success: true,
        token,
        message: "CSRF token generated successfully",
      },
      {
        status: 200,
        headers: response.headers,
      }
    );
  } catch (error) {
    devLog.error("Error generating CSRF token:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate CSRF token",
      },
      {
        status: 500,
      }
    );
  }
}
