import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import { createListSchema } from "@/lib/validations/lists";
import MovieList from "@/models/MovieList";

export const runtime = "nodejs";

export async function GET() {
  try {
    const currentUser = await getCurrentUser();

    if (!currentUser) {
      return NextResponse.json(
        {
          success: false,
          message: "You are not authenticated.",
        },
        {
          status: 401,
        },
      );
    }

    await connectDB();

    const lists = await MovieList.find({
      $or: [
        {
          ownerId: currentUser.id,
        },
        {
          "collaborators.userId":
            currentUser.id,
        },
      ],
    })
      .sort({
        updatedAt: -1,
      })
      .lean();

    return NextResponse.json({
      success: true,

      lists: lists.map((list) => ({
        id: list._id.toString(),

        title: list.title,
        description: list.description,

        isPublic: list.isPublic,
        isRanked: list.isRanked,

        ownerId:
          list.ownerId.toString(),

        isOwner:
          list.ownerId.toString() ===
          currentUser.id,

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
      })),
    });
  } catch (error) {
    console.error(
      "Could not load lists:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not load your lists.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(
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
      createListSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid list data.",

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

    const normalizedMovies =
      parsed.data.movies.map(
        (movie, index) => ({
          ...movie,

          position:
            parsed.data.isRanked
              ? index + 1
              : null,
        }),
      );

    const list =
      await MovieList.create({
        ownerId: currentUser.id,

        title: parsed.data.title,

        description:
          parsed.data.description,

        isPublic:
          parsed.data.isPublic,

        isRanked:
          parsed.data.isRanked,

        movies:
          normalizedMovies,

        collaborators: [],
      });

    return NextResponse.json(
      {
        success: true,

        message:
          "List created successfully.",

        list: {
          id: list._id.toString(),

          title: list.title,
          description:
            list.description,

          isPublic:
            list.isPublic,

          isRanked:
            list.isRanked,

          ownerId:
            list.ownerId.toString(),

          isOwner: true,

          movies:
            list.movies,

          collaborators: [],

          createdAt:
            list.createdAt,

          updatedAt:
            list.updatedAt,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Could not create list:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not create this list.",
      },
      {
        status: 500,
      },
    );
  }
}