// INCREMENT PORTFOLIO VIEW

import { devLog } from "@/lib/utils";
import Portfolio from "@/models/Portfolio";
import { portfolioRepository } from "@/repositories/PortfolioRepository";
import { Params } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest, { params }: Params) {
  try {
    const { slug } = await params;

    const portfolio = await Portfolio.findOne({
      slug,
      status: "published",
      "settings.isPublic": true,
    }).populate("templateId");

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

    await portfolioRepository.incrementViewCount(portfolio._id.toString());
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
    devLog.error("Error while counting portfolio view:", error);
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
