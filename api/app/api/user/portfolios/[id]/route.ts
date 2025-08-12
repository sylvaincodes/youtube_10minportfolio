import { authGuard } from "@/lib/auth/authGuard";
import { Params } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";
import { auth as Auth } from "@clerk/nextjs/server";
import { portfolioRepository } from "@/repositories/PortfolioRepository";
import { devLog } from "@/lib/utils";
import connectDB from "@/lib/database";
import {
  createPortfolioSchema,
  PortfolioUpdate,
} from "@/lib/validations/portfolio";

// GET A SINGLE USER PORTFOLIO
export async function GET(req: NextRequest, { params }: Params) {
  try {
    // Run guard
    authGuard({ requireAdmin: false });

    // Get params
    const { id } = await params;

    // Get user
    const { userId } = await Auth();

    if (!userId) {
      return NextResponse.json(
        {
          error: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // Get portfolio
    const portfolio = await portfolioRepository.getPortfolioById(id, userId);

    if (!portfolio) {
      return NextResponse.json(
        {
          error: "Portfolio not found",
        },
        {
          status: 404,
        }
      );
    }

    // Else
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
    devLog.error("Failed to fetch portfolio: ", error);
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

// UPDATE A SINGLE USER PORTFOLIO
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    // Run guard
    authGuard({ requireAdmin: false });

    // Get id
    const { id } = await params;

    // Connect DB
    await connectDB();

    // Get body
    const body = await req.json();

    // Check user conected
    const { userId } = await Auth();

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found",
        },
        {
          status: 404,
        }
      );
    }

    // Validate body
    const validateData = createPortfolioSchema.safeParse(body);
    if (!validateData.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Validation error",
          errors: validateData.error.flatten().fieldErrors,
        },
        {
          status: 400,
        }
      );
    }

    // Extract typed data
    const data: PortfolioUpdate = {
      id: id,
      ...validateData.data,
    };

    const portfolio = await portfolioRepository.updatePortfolio(userId, data);

    if (!portfolio) {
      return NextResponse.json(
        {
          success: false,
          message: "error while updating",
        },
        {
          status: 404,
        }
      );
    }

    // Else
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
    devLog.error("Failed to update portfolio: ", error);
    return NextResponse.json(
      {
        error: "Internal error server",
      },
      {
        status: 500,
      }
    );
  }
}
