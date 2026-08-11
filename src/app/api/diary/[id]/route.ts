import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import { updateDiaryEntrySchema } from "@/lib/validations/diary";
import DiaryEntry from "@/models/DiaryEntry";

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

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid diary entry.",
        },
        {
          status: 400,
        },
      );
    }

    const body: unknown = await request.json();

    const parsed =
      updateDiaryEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid diary update.",
          errors:
            parsed.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    const entry =
      await DiaryEntry.findOneAndUpdate(
        {
          _id: id,

          // Critical:
          // a user can only modify THEIR entry.
          userId: currentUser.id,
        },
        {
          $set: parsed.data,
        },
        {
          new: true,
          runValidators: true,
        },
      );

    if (!entry) {
      return NextResponse.json(
        {
          success: false,
          message: "Diary entry not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Diary entry updated.",

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
    });
  } catch (error) {
    console.error(
      "Could not update diary entry:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not update this diary entry.",
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

    const { id } = await context.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid diary entry.",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    const deletedEntry =
      await DiaryEntry.findOneAndDelete({
        _id: id,
        userId: currentUser.id,
      });

    if (!deletedEntry) {
      return NextResponse.json(
        {
          success: false,
          message: "Diary entry not found.",
        },
        {
          status: 404,
        },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Diary entry deleted.",
    });
  } catch (error) {
    console.error(
      "Could not delete diary entry:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not delete this diary entry.",
      },
      {
        status: 500,
      },
    );
  }
}