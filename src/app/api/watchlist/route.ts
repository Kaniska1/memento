import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
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

    const movies = await MovieInteraction.find({
      userId: currentUser.id,
      watchlisted: true,
    })
      .sort({
        updatedAt: -1,
      })
      .lean();

    return NextResponse.json({
      success: true,

      movies: movies.map((movie) => ({
        id: movie._id.toString(),

        movieId: movie.movieId,
        title: movie.movieTitle,
        year: movie.movieYear,
        poster: movie.poster,
        genre: movie.genre,

        rating: movie.rating,

        watched: movie.watched,
        liked: movie.liked,

        addedAt: movie.updatedAt,
      })),
    });
  } catch (error) {
    console.error(
      "Could not load watchlist:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not load your watchlist.",
      },
      {
        status: 500,
      },
    );
  }
}