import { authGuard } from "@/lib/auth/authGuard";
import { devLog } from "@/lib/utils";
import {
  idSchema,
  TemplateUpdateInput,
  templateUpdateSchema,
} from "@/lib/validations/template";
import { templateRepository } from "@/repositories/TemplateRepository";
import { Params } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

//GET A TEMPALTE
export async function GET(req: NextRequest, { params }: Params) {
  try {
    //guard auth
    await authGuard();

    //Get template id from route parameter
    const { id } = await params;

    //fetch from repository
    const template = await templateRepository.findById(id);

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Template not found " },
        { status: 400 }
      );
    }

    // return on success
    return NextResponse.json(
      {
        success: true,
        data: template,
      },
      { status: 200 }
    );
  } catch (error) {
    devLog.error("Error while fetching ", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch template",
      },
      { status: 500 }
    );
  }
}

//UPDATE A TEMPLATE
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    // auth guard
    await authGuard();

    //Extract the id
    const { id } = await params;

    // Parse the JSON body
    const body = await req.json();

    // Validate body
    const validateData = templateUpdateSchema.safeParse(body);

    // If validation fails, return errors
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

    // Extract validated data
    const data: TemplateUpdateInput = validateData.data;

    // Update the template
    const template = await templateRepository.update(id, data);

    // Return 404 if not updated and return the data
    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: "Template not found",
        },
        {
          status: 404,
        }
      );
    }

    //else return success
    return NextResponse.json(
      {
        success: true,
        template,
        message: "Template updated successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    devLog.error("Error while updating template: ", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to update the template",
      },
      {
        status: 500,
      }
    );
  }
}

//DELETE A TEMPLATE
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    // run guard
    await authGuard();

    // Extract template ID from route
    const { id } = await params;

    // Validate ID

    const validated = idSchema.safeParse(id);
    if (!validated.success) {
      return NextResponse.json(
        {
          success: false,
          error: validated.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Perform deletion
    const template = await templateRepository.delete(validated.data); // pass the id validated

    if (!template) {
      return NextResponse.json(
        {
          success: false,
          error: "Template not found",
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
        message: "Template deleted successfully",
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    devLog.error("Failed to delete the template: ", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete template",
      },
      {
        status: 500,
      }
    );
  }
}
