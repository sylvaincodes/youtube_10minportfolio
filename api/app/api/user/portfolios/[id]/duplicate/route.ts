// DUPLICATE A PORTFOLIO

import { authGuard } from "@/lib/auth/authGuard";
import connectDB from "@/lib/database";
import { Params } from "@/types/api";
import { NextResponse } from "next/server";
import { auth as Auth } from "@clerk/nextjs/server";
import { portfolioRepository } from "@/repositories/PortfolioRepository";
import { devLog } from "@/lib/utils";

export async function PATCH(request: NextResponse, { params }: Params) {
  try {
    // Run guard
    const auth = authGuard({ requireAdmin: false });
    if (auth instanceof NextResponse) return auth;

    // Conenct db
    await connectDB();

    // Get params
    const { id } = await params;

    // Get user
    const { userId } = await Auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          messag: "User not found",
        },
        {
          status: 400,
        }
      );
    }

    const portfolio = await portfolioRepository.duplicatePortfolio(userId, id);

    if (!portfolio) {
      return NextResponse.json(
        {
          success: false,
          message: "Error while duplicating the porfolio",
        },
        {
          status: 400,
        }
      );
    }

    // Else
    return NextResponse.json(
      {
        success: true,
        message: "Portfolio duplicated successfully",
        portfolio,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    devLog.error("Error while duplicating the portfoli: ", error);

    NextResponse.json(
      {
        success: false,
        error: "Internal server error " + error,
      },
      {
        status: 500,
      }
    );
  }
}
