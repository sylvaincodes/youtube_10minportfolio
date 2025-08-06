// GET TEMPLATES DATA

import connectDB from "@/lib/database";
import { devLog } from "@/lib/utils";
import { TemplateDocument } from "@/models/Template";
import { templateRepository } from "@/repositories/TemplateRepository";
import { FilterQuery } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Connect db
    await connectDB();

    // Get query params
    const searchParams = request.nextUrl.searchParams;

    // Parse filters
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const premiumParam = searchParams.get("premium");
    const premium = premiumParam === null ? undefined : premiumParam === "true";
    const tags = searchParams.getAll("tags");

    // BUild query
    const filters: FilterQuery<TemplateDocument> = { page, limit };
    if (status && status !== "all") filters.status = status;
    if (search) filters.search = search;
    if (tags.length > 0) filters.tags = tags;
    if (premium !== undefined) filters.premium = premium;

    // Fetch all templates
    const templates = await templateRepository.findAllWithFilters(filters);

    // Return template
    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    devLog.error("Error while getting templates:", error);
    return NextResponse.json(
      {
        error: "Internal error server" + error,
      },
      {
        status: 500,
      }
    );
  }
}
