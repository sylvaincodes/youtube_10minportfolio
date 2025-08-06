// PUBLIC PORTFOLIO

import connectDB from "@/lib/database";
import { devLog } from "@/lib/utils";
import { PortfolioDocument } from "@/models/Portfolio";
import { portfolioRepository } from "@/repositories/PortfolioRepository";
import { FilterQuery } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Connect db
    await connectDB();

    // Get params
    const { searchParams } = new URL(request.url);

    // Parse filters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const plan = searchParams.get("plan");

    // Build query
    const filters: FilterQuery<PortfolioDocument> = { page, limit, plan };

    const portfolios = await portfolioRepository.getPublicPortfolios(filters);

    return NextResponse.json({
      success: true,
      portfolios,
    });
  } catch (error) {
    devLog.error("Error fetching public portfolios: ", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal error server" + error,
      },
      {
        status: 500,
      }
    );
  }
}
