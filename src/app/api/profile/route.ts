import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import { updateProfileSchema } from "@/lib/validations/profile";
import User from "@/models/User";

export const runtime = "nodejs";

export async function GET() {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authenticated.",
        },
        {
          status: 401,
        },
      );
    }

    return NextResponse.json({
      success: true,

      profile: {
        id: currentUser.id,
        name: currentUser.name,
        username:
          currentUser.username,
        email: currentUser.email,
        bio: currentUser.bio ?? "",
        avatarUrl:
          currentUser.avatarUrl ?? "",
        joinedAt:
          currentUser.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Could not load profile:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not load your profile.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function PATCH(
  request: Request,
) {
  try {
    const currentUser =
      await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You are not authenticated.",
        },
        {
          status: 401,
        },
      );
    }

    const body: unknown =
      await request.json();

    const parsed =
      updateProfileSchema.safeParse(
        body,
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid profile data.",

          errors:
            parsed.error.flatten()
              .fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    const existingUsername =
      await User.findOne({
        username:
          parsed.data.username,

        _id: {
          $ne: currentUser.id,
        },
      }).select("_id");

    if (existingUsername) {
      return NextResponse.json(
        {
          success: false,
          message:
            "That username is already taken.",
        },
        {
          status: 409,
        },
      );
    }

    const user =
      await User.findByIdAndUpdate(
        currentUser.id,
        {
          $set: {
            name:
              parsed.data.name,

            username:
              parsed.data.username,

            bio:
              parsed.data.bio,
          },
        },
        {
          new: true,
          runValidators: true,
        },
      ).select(
        "name username email bio avatarUrl createdAt",
      );

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message:
            "User not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "Profile updated.",

      profile: {
        id:
          user._id.toString(),

        name:
          user.name,

        username:
          user.username,

        email:
          user.email,

        bio:
          user.bio ?? "",

        avatarUrl:
          user.avatarUrl ?? "",

        joinedAt:
          user.createdAt,
      },
    });
  } catch (error) {
    console.error(
      "Could not update profile:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not update your profile.",
      },
      {
        status: 500,
      },
    );
  }
}