import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
  _request: Request,
  context: RouteContext,
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

    const { id } =
      await context.params;

    await connectDB();

    const result =
      await User.updateOne(
        {
          _id: currentUser.id,
          "notifications.id": id,
        },
        {
          $set: {
            "notifications.$.read":
              true,
          },
        },
      );

    if (
      result.matchedCount === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Notification not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Could not mark notification read:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not update notification.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: RouteContext,
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

    const { id } =
      await context.params;

    await connectDB();

    const result =
      await User.updateOne(
        {
          _id: currentUser.id,
        },
        {
          $pull: {
            notifications: {
              id,
            },
          },
        },
      );

    if (
      result.matchedCount === 0
    ) {
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
    });
  } catch (error) {
    console.error(
      "Could not delete notification:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not delete notification.",
      },
      {
        status: 500,
      },
    );
  }
}