import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import { updateListSchema } from "@/lib/validations/lists";
import MovieList from "@/models/MovieList";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(
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
          message:
            "Invalid list ID.",
        },
        {
          status: 400,
        },
      );
    }

    const body: unknown =
      await request.json();

    const parsed =
      updateListSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid list update.",

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

    /*
     * Both owner and collaborators can
     * access the list for editing.
     */
    const existing =
      await MovieList.findOne({
        _id: id,

        $or: [
          {
            ownerId:
              currentUser.id,
          },

          {
            "collaborators.userId":
              currentUser.id,
          },
        ],
      });

    if (!existing) {
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

    const isOwner =
      existing.ownerId.toString() ===
      currentUser.id;

    /*
     * Owner-only properties.
     */
    if (isOwner) {
      if (
        parsed.data.title !==
        undefined
      ) {
        existing.title =
          parsed.data.title;
      }

      if (
        parsed.data.description !==
        undefined
      ) {
        existing.description =
          parsed.data.description;
      }

      if (
        parsed.data.isPublic !==
        undefined
      ) {
        existing.isPublic =
          parsed.data.isPublic;

        /*
         * Public lists are owner-edited.
         * Remove private collaborators
         * when the owner makes it public.
         */
        if (
          parsed.data.isPublic
        ) {
          existing.set(
            "collaborators",
            [],
          );
        }
      }

      if (
        parsed.data.isRanked !==
        undefined
      ) {
        existing.isRanked =
          parsed.data.isRanked;

        existing.movies.forEach(
          (movie, index) => {
            movie.position =
              parsed.data.isRanked
                ? index + 1
                : null;
          },
        );
      }
    }

    /*
     * Owner and collaborators may edit
     * the films in the list.
     */
    if (
      parsed.data.movies !==
      undefined
    ) {
      const normalizedMovies =
        parsed.data.movies.map(
          (movie, index) => ({
            movieId:
              movie.movieId,

            title:
              movie.title,

            year:
              movie.year ?? "",

            poster:
              movie.poster ?? null,

            genre:
              movie.genre ?? "Film",

            position:
              existing.isRanked
                ? index + 1
                : null,
          }),
        );

      existing.set(
        "movies",
        normalizedMovies,
      );
    }

    await existing.save();

    return NextResponse.json({
      success: true,

      message:
        "List updated successfully.",

      list: {
        id:
          existing._id.toString(),

        title:
          existing.title,

        description:
          existing.description,

        isPublic:
          existing.isPublic,

        isRanked:
          existing.isRanked,

        ownerId:
          existing.ownerId.toString(),

        isOwner,

        movies:
          existing.movies,

        collaborators:
          existing.collaborators.map(
            (collaborator) => ({
              userId:
                collaborator.userId.toString(),

              username:
                collaborator.username,
            }),
          ),

        createdAt:
          existing.createdAt,

        updatedAt:
          existing.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Could not update list:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not update this list.",
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

    if (
      !mongoose.Types.ObjectId.isValid(id)
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid list ID.",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    /*
     * Only the owner can delete.
     */
    const deleted =
      await MovieList.findOneAndDelete({
        _id: id,
        ownerId: currentUser.id,
      });

    if (!deleted) {
      return NextResponse.json(
        {
          success: false,
          message:
            "List not found or only the owner can delete it.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,

      message:
        "List deleted successfully.",
    });
  } catch (error) {
    console.error(
      "Could not delete list:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not delete this list.",
      },
      {
        status: 500,
      },
    );
  }
}