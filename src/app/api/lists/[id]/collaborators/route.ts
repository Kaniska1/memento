import mongoose from "mongoose";
import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import MovieList from "@/models/MovieList";
import User from "@/models/User";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

const addCollaboratorSchema = z.object({
  username: z
    .string()
    .trim()
    .min(1, "Username is required.")
    .max(50),
});

export async function POST(
  request: Request,
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

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid list ID.",
        },
        {
          status: 400,
        },
      );
    }

    const body: unknown =
      await request.json();

    const parsed =
      addCollaboratorSchema.safeParse(
        body,
      );

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            parsed.error.issues[0]
              ?.message ||
            "Invalid collaborator.",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    // Only the owner can manage collaborators.
    const list =
      await MovieList.findOne({
        _id: id,
        ownerId: currentUser.id,
      });

    if (!list) {
      return NextResponse.json(
        {
          success: false,
          message:
            "List not found or you do not have permission.",
        },
        {
          status: 404,
        },
      );
    }

    // Collaborators only make sense for private lists.
    if (list.isPublic) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Collaborators can only be added to private lists.",
        },
        {
          status: 400,
        },
      );
    }

    const normalizedUsername =
      parsed.data.username
        .replace(/^@/, "")
        .trim()
        .toLowerCase();

    const collaborator =
      await User.findOne({
        username: normalizedUsername,
      }).select(
        "_id username",
      );

    if (!collaborator) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No Memento user exists with that username.",
        },
        {
          status: 404,
        },
      );
    }

    if (
      collaborator._id.toString() ===
      currentUser.id
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "You cannot add yourself as a collaborator.",
        },
        {
          status: 400,
        },
      );
    }

    const alreadyCollaborating =
      list.collaborators.some(
        (existing) =>
          existing.userId.toString() ===
          collaborator._id.toString(),
      );

    if (alreadyCollaborating) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This user is already a collaborator.",
        },
        {
          status: 409,
        },
      );
    }

    list.collaborators.push({
      userId: collaborator._id,
      username:
        collaborator.username,
    });

    await list.save();

    return NextResponse.json({
      success: true,

      message:
        "Collaborator added.",

      collaborator: {
        userId:
          collaborator._id.toString(),

        username:
          collaborator.username,
      },
    });
  } catch (error) {
    console.error(
      "Could not add collaborator:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not add collaborator.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
  request: Request,
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

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid list ID.",
        },
        {
          status: 400,
        },
      );
    }

    const body: unknown =
      await request.json();

    const userId =
      typeof body === "object" &&
      body !== null &&
      "userId" in body &&
      typeof body.userId ===
        "string"
        ? body.userId
        : null;

    if (
      !userId ||
      !mongoose.Types.ObjectId.isValid(
        userId,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid collaborator ID.",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    const list =
      await MovieList.findOne({
        _id: id,
        ownerId: currentUser.id,
      });

    if (!list) {
      return NextResponse.json(
        {
          success: false,
          message:
            "List not found or you do not have permission.",
        },
        {
          status: 404,
        },
      );
    }

    const exists =
      list.collaborators.some(
        (collaborator) =>
          collaborator.userId.toString() ===
          userId,
      );

    if (!exists) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This user is not a collaborator.",
        },
        {
          status: 404,
        },
      );
    }

    list.collaborators =
      list.collaborators.filter(
        (collaborator) =>
          collaborator.userId.toString() !==
          userId,
      ) as typeof list.collaborators;

    await list.save();

    return NextResponse.json({
      success: true,
      message:
        "Collaborator removed.",
    });
  } catch (error) {
    console.error(
      "Could not remove collaborator:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not remove collaborator.",
      },
      {
        status: 500,
      },
    );
  }
}