import { devLog } from "@/lib/utils";
import { portfolioRepository } from "@/repositories/PortfolioRepository";
import { NextRequest, NextResponse } from "next/server";

// VALIDATE PORTFOLIO SLUG
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const excludeId = searchParams.get("excludeId");

    if (!slug) {
      return NextResponse.json(
        {
          error: "Slug parameter is required",
        },
        {
          status: 400,
        }
      );
    }

    const validation = await portfolioRepository.validateSlugAvailability(
      slug,
      excludeId || undefined
    );

    return NextResponse.json(validation);
  } catch (error) {
    devLog.error("Error while validating slug :", error);
    return NextResponse.json(
      {
        error: "Internal erro server" + error,
      },
      {
        status: 500,
      }
    );
  }
}
