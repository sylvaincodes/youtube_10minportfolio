import { authGuard } from "@/lib/auth/authGuard";
import connectDB from "@/lib/database";
import { devLog } from "@/lib/utils";
import {
  TemplateCreateInput,
  templateSchema,
} from "@/lib/validations/template";
import { TemplateDocument } from "@/models/Template";
import { templateRepository } from "@/repositories/TemplateRepository";
import { FilterQuery } from "mongoose";
import { NextRequest, NextResponse } from "next/server";

// Returns all templates from the database
export async function GET(request: NextRequest) {
  try {
    //run the auth guard
    await authGuard();
    
    //CONNECT  TO mongoDB
    await connectDB();

    //Get query params from request
    const searchParams = request.nextUrl.searchParams;

    //parse filters from query params
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "10", 10);
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const premiumParam = searchParams.get("premium");
    const premium = premiumParam === null ? undefined : premiumParam === "true";
    const tags = searchParams.getAll("tags");

    //Build filers object
    const filters: FilterQuery<TemplateDocument> = { page, limit };
    if (status && status !== "all") filters.status = status;
    if (search) filters.search = search;
    if (tags.length > 0) filters.tags = tags;
    if (premium !== undefined) filters.premium = premium;

    // Fetch all templates
    const templates = await templateRepository.findAllWithFilters(filters);

    // Return the templates in a JSON success response
    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    devLog.error("Error fetching templates:", error);

    //return error
    return NextResponse.json(
      {
        success: false,
        error: "Error while fetching templates",
      },
      {
        status: 500,
      }
    );
  }
}

//POST
export async function POST(req: NextRequest) {
  try {
    // run guard
    await authGuard();

    // connect db
    await connectDB();

    //extract JSON body from the request
    const body = await req.json();

    //validate input with zod
    const validateData = templateSchema.safeParse(body);

    //If failed return  400 with errors
    if (!validateData.success) {
      return NextResponse.json(
        {
          message: "validation error",
          errors: validateData.error.flatten().fieldErrors,
        },
        {
          status: 400,
        }
      );
    }

    // Extract typed, validated data
    const data: TemplateCreateInput = validateData.data;

    // Create the new template in the database
    const template = await templateRepository.create(data);

    // Return 201 success response with the template created
    return NextResponse.json(
      {
        success: true,
        template,
        message: "Template created successfully",
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    devLog.error("Error creating template", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create template",
      },
      {
        status: 500,
      }
    );
  }
}
