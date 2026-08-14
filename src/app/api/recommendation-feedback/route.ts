import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";

import RecommendationFeedback from "@/models/RecommendationFeedback";

export const runtime = "nodejs";

type FeedbackAction =
  | "seen"
  | "not_interested"
  | "opened";

type FeedbackBody = {
  movieId?: number;
  action?: FeedbackAction;

  matchScore?: number | null;
  watchedCount?: number | null;

  recommendationStyle?:
    | "familiar"
    | "balanced"
    | "adventurous"
    | null;

  international?: boolean;
  obscurityScore?: number;
  tmdbRating?: number;
};

const allowedActions: FeedbackAction[] = [
  "seen",
  "not_interested",
  "opened",
];

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

    const body =
      (await request.json()) as FeedbackBody;

    if (
      !Number.isFinite(body.movieId) ||
      !body.action ||
      !allowedActions.includes(
        body.action,
      )
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid recommendation feedback.",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    const feedback =
      await RecommendationFeedback.findOneAndUpdate(
        {
          userId: currentUser.id,
          movieId: body.movieId,
          action: body.action,
        },
        {
          $set: {
            matchScore:
              body.matchScore ?? null,

            watchedCount:
              body.watchedCount ?? null,

            recommendationStyle:
              body.recommendationStyle ??
              null,

            international:
              body.international ??
              false,

            obscurityScore:
              body.obscurityScore ??
              0,

            tmdbRating:
              body.tmdbRating ?? 0,
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      ).lean();

    return NextResponse.json({
      success: true,
      feedback: {
        id:
          feedback._id.toString(),

        movieId:
          feedback.movieId,

        action:
          feedback.action,

        createdAt:
          feedback.createdAt,

        updatedAt:
          feedback.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "Could not save recommendation feedback:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not save recommendation feedback.",
      },
      {
        status: 500,
      },
    );
  }
}

export async function DELETE(
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

    const body =
      (await request.json()) as {
        movieId?: number;
        action?:
          | "seen"
          | "not_interested"
          | "opened";
      };

    if (
      !Number.isFinite(body.movieId) ||
      !body.action
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid feedback removal request.",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    await RecommendationFeedback.deleteOne({
      userId: currentUser.id,
      movieId: body.movieId,
      action: body.action,
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.error(
      "Could not remove recommendation feedback:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not remove recommendation feedback.",
      },
      {
        status: 500,
      },
    );
  }
}