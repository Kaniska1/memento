import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import { movieInteractionSchema } from "@/lib/validations/movie-interaction";
import MovieInteraction from "@/models/MovieInteraction";
import DiaryEntry from "@/models/DiaryEntry";

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

    const movieId = Number(id);

    if (!Number.isInteger(movieId) || movieId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid movie ID.",
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    const [interaction, logCount] = await Promise.all([
      MovieInteraction.findOne({
        userId: currentUser.id,
        movieId,
      }).lean(),

      DiaryEntry.countDocuments({
        userId: currentUser.id,
        movieId,
      }),
    ]);

    return NextResponse.json({
      success: true,

      interaction: {
        watched: interaction?.watched ?? logCount > 0,

        liked: interaction?.liked ?? false,

        watchlisted:
          interaction?.watchlisted ?? false,

        rating: interaction?.rating ?? null,

        lastWatchedAt:
          interaction?.lastWatchedAt ?? null,

        logCount,
      },
    });
  } catch (error) {
    console.error(
      "Could not load movie interaction:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not load your interaction with this film.",
      },
      {
        status: 500,
      },
    );
  }
}

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

    const movieId = Number(id);

    if (!Number.isInteger(movieId) || movieId <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid movie ID.",
        },
        {
          status: 400,
        },
      );
    }

    const body: unknown = await request.json();

    const parsed =
      movieInteractionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Invalid movie interaction.",
          errors:
            parsed.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    await connectDB();

    /*
     * --------------------------------
     * WATCHED INVARIANTS
     * --------------------------------
     *
     * Liking or rating a film is evidence
     * that the user has watched it.
     *
     * Therefore:
     * - liked: true      => watched: true
     * - rating != null   => watched: true
     * - watched: true    => watchlisted: false
     * - newly watched    => lastWatchedAt = now
     *
     * Removing a like or clearing a rating
     * does NOT automatically unwatch a film.
     */
    const shouldMarkWatched =
      parsed.data.watched === true ||
      parsed.data.liked === true ||
      (
        parsed.data.rating !==
          undefined &&
        parsed.data.rating !== null
      );

    const updateData = {
      ...parsed.data,

      watched:
        shouldMarkWatched
          ? true
          : parsed.data.watched,

      watchlisted:
        shouldMarkWatched
          ? false
          : parsed.data.watchlisted,

      lastWatchedAt:
        parsed.data.lastWatchedAt !== undefined
          ? parsed.data.lastWatchedAt
            ? new Date(parsed.data.lastWatchedAt)
            : null
          : shouldMarkWatched
            ? new Date()
            : undefined,
    };

    const interaction =
      await MovieInteraction.findOneAndUpdate(
        {
          userId: currentUser.id,
          movieId,
        },
        {
          $set: {
            movieTitle:
              parsed.data.movieTitle,

            movieYear:
              parsed.data.movieYear ?? "",

            poster:
              parsed.data.poster ?? null,

            genre:
              parsed.data.genre ?? "Film",

            ...(updateData.watched !== undefined
              ? {
                  watched:
                    updateData.watched,
                }
              : {}),

            ...(updateData.liked !== undefined
              ? {
                  liked:
                    updateData.liked,
                }
              : {}),

            ...(updateData.watchlisted !== undefined
              ? {
                  watchlisted:
                    updateData.watchlisted,
                }
              : {}),

            ...(updateData.rating !== undefined
              ? {
                  rating:
                    updateData.rating,
                }
              : {}),

            ...(updateData.lastWatchedAt !== undefined
              ? {
                  lastWatchedAt:
                    updateData.lastWatchedAt,
                }
              : {}),
          },
        },
        {
          upsert: true,
          new: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        },
      );

    const logCount =
      await DiaryEntry.countDocuments({
        userId: currentUser.id,
        movieId,
      });

    return NextResponse.json({
      success: true,

      interaction: {
        watched:
          interaction.watched ||
          logCount > 0,

        liked: interaction.liked,

        watchlisted:
          interaction.watchlisted,

        rating: interaction.rating,

        lastWatchedAt:
          interaction.lastWatchedAt,

        logCount,
      },
    });
  } catch (error) {
    console.error(
      "Could not update movie interaction:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not update this movie.",
      },
      {
        status: 500,
      },
    );
  }
}