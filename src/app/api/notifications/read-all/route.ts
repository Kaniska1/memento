import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";

export const runtime = "nodejs";

export async function PATCH() {
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

    await connectDB();

    const result =
      await User.updateOne(
        {
          _id: currentUser.id,
        },
        {
          $set: {
            "notifications.$[].read":
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
      "Could not mark all notifications read:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not update notifications.",
      },
      {
        status: 500,
      },
    );
  }
}