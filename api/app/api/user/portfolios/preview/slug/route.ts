// PREVIEW A PORTFOLIO

import { authGuard } from "@/lib/auth/authGuard";
import connectDB from "@/lib/database";
import { Params } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import Portfolio from "@/models/Portfolio";
import { devLog } from "@/lib/utils";

export async function GET(request: NextRequest, { params }: Params) {
  try {
    // Run guard
    const auth = authGuard({ requireAdmin: false });
    if (auth instanceof NextResponse) return auth;

    // Connect db
    await connectDB();

    // Get params
    const { slug } = await params;

    // Get portfolio
    const portfolio = await Portfolio.findOne({
      slug,
    }).populate("templateId");

    if (!portfolio) {
      return NextResponse.json(
        {
          error: "Portfolio not found",
          success: false,
        },
        {
          status: 404,
        }
      );
    }
    return NextResponse.json(
      {
        success: true,
        portfolio,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    devLog.error("Error while previewing the portfolio: ", error);
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}
