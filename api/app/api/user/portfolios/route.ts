// PORTFOLIOS APIS

import { authGuard } from "@/lib/auth/authGuard";
import connectDB from "@/lib/database";
import { devLog, generateSlug } from "@/lib/utils";
import {
  createPortfolioSchema,
  PortfolioInput,
} from "@/lib/validations/portfolio";
import { PortfolioDocument } from "@/models/Portfolio";
import { portfolioRepository } from "@/repositories/PortfolioRepository";
import { userRepository } from "@/repositories/UserRepository";
import { Params } from "@/types/api";
import { FilterQuery } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// GET PORTFOLIOS
export async function GET(request: NextRequest, { params }: Params) {
  try {
    // Run guard
    authGuard({ requireAdmin: false });

    // Get params
    const { searchParams } = new URL(request.url);

    // Get Id
    const { id } = await params;

    // Parse filters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const templateId = searchParams.get("templateId");

    // Build query object
    const filters: FilterQuery<PortfolioDocument> = { page, limit };
    if (status && status !== "all") filters.status = status;
    if (templateId) filters.templateId = search;

    const user = await userRepository.findByClerkId(id);

    if (!user) {
      throw new Error("User not found");
    }

    const portfolios = await portfolioRepository.findByUserId(
      id.toString(),
      filters
    );

    return NextResponse.json(
      {
        success: true,
        portfolios,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    devLog.error("Error fetching portfolios: ", error);

    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      {
        status: 500,
      }
    );
  }
}

// CREATE A PORTFOLIO
export async function POST(request: NextRequest, { params }: Params) {
  try {
    // Run authguard
    authGuard({ requireAdmin: false });

    // Connect to db
    await connectDB();

    // Get body
    const body = await request.json();

    // Check user id
    const { id } = await params;

    const user = await userRepository.findByClerkId(id);

    if (!user) {
      throw new Error("User not found");
    }

    // Validate body
    const slug = generateSlug(body.name);
    const validateData = createPortfolioSchema.safeParse({
      ...body,
      slug: slug,
      userId: user._id.toString(),
    });

    if (!validateData.success) {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: validateData.error.flatten().fieldErrors,
        },
        {
          status: 400,
        }
      );
    }

    //Extract typed validated data
    const data: PortfolioInput = validateData.data;

    // Save
    const portfolio = await portfolioRepository.createPortfolio(data);

    if (!portfolio) {
      return NextResponse.json(
        {
          error: "Failed to create portfolio",
          success: false,
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
        status: 201,
      }
    );
  } catch (error) {
    devLog.error("Failed to create portfolio: ", error);
    return NextResponse.json(
      {
        error: "Internal server error ",
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}
