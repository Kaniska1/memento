import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import MovieList from "@/models/MovieList";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(
  _request: Request,
  context: RouteContext,
) {
  try {
    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
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

    await connectDB();

    const currentUser = await getCurrentUser();

    const list = await MovieList.findById(id).lean();

    if (!list) {
      return NextResponse.json(
        {
          success: false,
          message: "List not found.",
        },
        {
          status: 404,
        },
      );
    }

    const currentUserId =
      currentUser?.id ?? null;

    const isOwner =
      currentUserId !== null &&
      list.ownerId.toString() === currentUserId;

    const isCollaborator =
      currentUserId !== null &&
      list.collaborators.some(
        (collaborator) =>
          collaborator.userId.toString() ===
          currentUserId,
      );

    if (
      !list.isPublic &&
      !isOwner &&
      !isCollaborator
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "This list is private.",
        },
        {
          status: 403,
        },
      );
    }

    return NextResponse.json({
      success: true,

      list: {
        id: list._id.toString(),

        title: list.title,
        description: list.description,

        isPublic: list.isPublic,
        isRanked: list.isRanked,

        ownerId:
          list.ownerId.toString(),

        isOwner,
        isCollaborator,

        movies: list.movies,

        collaborators:
          list.collaborators.map(
            (collaborator) => ({
              userId:
                collaborator.userId.toString(),

              username:
                collaborator.username,
            }),
          ),

        createdAt: list.createdAt,
        updatedAt: list.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Could not load public list:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not load this list.",
      },
      {
        status: 500,
      },
    );
  }
}