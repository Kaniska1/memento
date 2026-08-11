import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import { createDiaryEntrySchema } from "@/lib/validations/diary";
import DiaryEntry from "@/models/DiaryEntry";
import MovieInteraction from "@/models/MovieInteraction";

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

    const entries = await DiaryEntry.find({
      userId: currentUser.id,
    })
      .sort({
        watchedDate: -1,
        createdAt: -1,
      })
      .lean();

    return NextResponse.json({
      success: true,

      entries: entries.map((entry) => ({
        id: entry._id.toString(),

        movieId: entry.movieId,
        movieTitle: entry.movieTitle,
        movieYear: entry.movieYear,
        poster: entry.poster,

        watchedDate: entry.watchedDate,

        rating: entry.rating,
        review: entry.review,

        containsSpoilers:
          entry.containsSpoilers,

        liked: entry.liked,
        isRewatch: entry.isRewatch,

        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      })),
    });
  } catch (error) {
    console.error(
      "Could not load diary:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Could not load your diary.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function POST(request: Request) {
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

    const body: unknown = await request.json();

    const parsed =
      createDiaryEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid diary entry.",
          errors:
            parsed.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    const entry = await DiaryEntry.create({
      userId: currentUser.id,
      ...parsed.data,
    });

    await MovieInteraction.findOneAndUpdate(
  {
    userId: currentUser.id,
    movieId: entry.movieId,
  },
  {
    $set: {
      movieTitle:
        entry.movieTitle,

      movieYear:
        entry.movieYear,

      poster:
        entry.poster,

      watched: true,

      lastWatchedAt: new Date(
        `${entry.watchedDate}T00:00:00`,
      ),

      ...(entry.rating !== null
        ? {
            rating:
              entry.rating,
          }
        : {}),

      liked:
        entry.liked,
    },
  },
  {
    upsert: true,
    new: true,
    runValidators: true,
    setDefaultsOnInsert: true,
  },
);

    return NextResponse.json(
      {
        success: true,
        message: "Film logged successfully.",

        entry: {
          id: entry._id.toString(),

          movieId: entry.movieId,
          movieTitle: entry.movieTitle,
          movieYear: entry.movieYear,
          poster: entry.poster,

          watchedDate: entry.watchedDate,

          rating: entry.rating,
          review: entry.review,

          containsSpoilers:
            entry.containsSpoilers,

          liked: entry.liked,
          isRewatch: entry.isRewatch,

          createdAt: entry.createdAt,
          updatedAt: entry.updatedAt,
        },
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(
      "Could not create diary entry:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message: "Could not log this film.",
      },
      {
        status: 500,
      },
    );
  }
}