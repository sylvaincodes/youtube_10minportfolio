// PUBLISH PORTFOLIO

import { authGuard } from "@/lib/auth/authGuard";
import { userRepository } from "@/repositories/UserRepository";
import { Params } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { auth as Auth } from "@clerk/nextjs/server";
import { portfolioRepository } from "@/repositories/PortfolioRepository";
import { devLog } from "@/lib/utils";

export async function PATCH(request: NextRequest, { params }: Params) {
  try {
    // Run guard
    const auth = authGuard({ requireAdmin: false });
    if (auth instanceof NextResponse) return auth;

    // Get params
    const { id } = await params;

    // Get user Id
    const { userId } = await Auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 400,
        }
      );
    }
    // Get body
    const { status } = await request.json();
    if (!status || !["published", "draft", "archived"].includes(status)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid or missing status value",
        },
        {
          status: 400,
        }
      );
    }

    const user = await userRepository.findByClerkId(userId);

    // Count published portfolios
    const number = await portfolioRepository.countPublished(userId);
    if (number > 0 && user?.plan === "free") {
      return NextResponse.json(
        {
          success: false,
          message: "Upgrade your plan to publish unlimited portfolio",
        },
        {
          status: 200,
        }
      );
    }

    // If plan is pro or first time user publish his portfolio
    const portfolio = await portfolioRepository.updatePortfolio(userId, {
      id: id,
      status: status,
    });

    return NextResponse.json({ success: true, portfolio }, { status: 200 });
  } catch (error) {
    devLog.error("Error while updating portfolio in PATCH api: ", error);
    return NextResponse.json(
      {
        error: "Internal server error" + error,
      },
      {
        status: 500,
      }
    );
  }
}
