// USER INFO APIS

import { authGuard } from "@/lib/auth/authGuard";
import connectDB from "@/lib/database";
import { devLog } from "@/lib/utils";
import { userSchema, UserUpdateInput } from "@/lib/validations/user";
import { userRepository } from "@/repositories/UserRepository";
import { Params } from "@/types/api";
import { NextRequest, NextResponse } from "next/server";

// GET USER INFO
export async function GET(req: NextRequest, { params }: Params) {
  try {
    // Run guard
    authGuard({ requireAdmin: false });

    // Connect DB
    await connectDB();

    // Get id
    const { id } = await params;

    // Get info
    const user = await userRepository.findByClerkId(id);

    if (!user) {
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

    // Else
    return NextResponse.json(
      {
        success: true,
        message: "Use info found",
        user,
      },
      { status: 200 }
    );
  } catch (error) {
    devLog.error("Error while fetching user: ", error);
    return NextResponse.json(
      {
        error: "Error while fetching user: ",
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}

// UPDATE USER INFO
export async function PUT(req: NextRequest, { params }: Params) {
  try {
    // Run guard
    authGuard({ requireAdmin: false });

    // Connect to db
    await connectDB();

    // Get id
    const { id } = await params;

    // Get body
    const body = await req.json();

    // Validate body
    const validatedFields = userSchema.safeParse(body);
    if (!validatedFields.success) {
      return NextResponse.json(
        {
          message: "Validation error",
          errors: validatedFields.error.flatten().fieldErrors,
        },
        {
          status: 400,
        }
      );
    }

    // static typing
    const data: UserUpdateInput = validatedFields.data;

    // Update user
    const user = await userRepository.updateByClerkId(id, data);

    if (!user) {
      return NextResponse.json(
        {
          error: "User not found",
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
        message: "User updated succefully",
        user,
      },
      {
        status: 200,
      }
    );
  } catch (error) {
    devLog.error("Failed to update user", error);
    return NextResponse.json(
      {
        error: "Failed to update user",
        success: false,
      },
      {
        status: 500,
      }
    );
  }
}
