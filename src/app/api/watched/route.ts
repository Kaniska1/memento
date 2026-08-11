import mongoose from "mongoose";
import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";
import { connectDB } from "@/lib/mongodb";
import DiaryEntry from "@/models/DiaryEntry";
import MovieInteraction from "@/models/MovieInteraction";

export const runtime = "nodejs";

export async function GET() {
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

    const movies =
      await MovieInteraction.find({
        userId: currentUser.id,
        watched: true,
      })
        .sort({
          lastWatchedAt: -1,
          updatedAt: -1,
        })
        .lean();

    if (movies.length === 0) {
      return NextResponse.json({
        success: true,
        movies: [],
      });
    }

    const movieIds = movies.map(
      (movie) => movie.movieId,
    );

    const logCounts =
      await DiaryEntry.aggregate<{
        _id: number;
        count: number;
      }>([
        {
          $match: {
            userId:
              new mongoose.Types.ObjectId(
                currentUser.id,
              ),

            movieId: {
              $in: movieIds,
            },
          },
        },

        {
          $group: {
            _id: "$movieId",

            count: {
              $sum: 1,
            },
          },
        },
      ]);

    const countMap = new Map(
      logCounts.map((item) => [
        item._id,
        item.count,
      ]),
    );

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

        liked: movie.liked,

        lastWatchedAt:
          movie.lastWatchedAt,

        logCount:
          countMap.get(movie.movieId) ??
          0,
      })),
    });
  } catch (error) {
    console.error(
      "Could not load watched movies:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not load watched movies.",
      },
      {
        status: 500,
      },
    );
  }
}