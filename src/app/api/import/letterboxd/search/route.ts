import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/current-user";

export const runtime = "nodejs";

const TMDB_API_URL =
  "https://api.themoviedb.org/3";

type TmdbMovie = {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  original_language: string;
  vote_average: number;
  vote_count: number;
};

const genreMap: Record<number, string> = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

function toMovie(
  movie: TmdbMovie,
) {
  return {
    id: movie.id,
    title: movie.title,
    year:
      movie.release_date?.slice(
        0,
        4,
      ) ?? "",
    poster:
      movie.poster_path
        ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        : null,
    backdrop:
      movie.backdrop_path
        ? `https://image.tmdb.org/t/p/original${movie.backdrop_path}`
        : null,
    genre:
      genreMap[
        movie.genre_ids?.[0]
      ] ?? "Film",
    originalLanguage:
      movie.original_language ?? "",
    rating:
      movie.vote_average || 0,
    voteCount:
      movie.vote_count || 0,
  };
}

export async function GET(
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

    const token =
      process.env.TMDB_ACCESS_TOKEN;

    if (!token) {
      return NextResponse.json(
        {
          success: false,
          message:
            "TMDB access token is missing.",
        },
        {
          status: 500,
        },
      );
    }

    const { searchParams } =
      new URL(request.url);

    const query =
      searchParams
        .get("q")
        ?.trim() ?? "";

    const year =
      searchParams
        .get("year")
        ?.trim() ?? "";

    if (
      query.length < 2
    ) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Search for at least 2 characters.",
        },
        {
          status: 400,
        },
      );
    }

    const params =
      new URLSearchParams({
        query,
        include_adult:
          "false",
        language:
          "en-US",
        page:
          "1",
      });

    if (
      /^\d{4}$/.test(year)
    ) {
      params.set(
        "year",
        year,
      );
    }

    let response =
      await fetch(
        `${TMDB_API_URL}/search/movie?${params.toString()}`,
        {
          headers: {
            Accept:
              "application/json",
            Authorization:
              `Bearer ${token}`,
          },
          cache:
            "no-store",
        },
      );

    let data =
      (await response.json()) as {
        results?: TmdbMovie[];
      };

    /*
     * If an exact-year search returns nothing,
     * retry without the year. This mirrors the
     * automatic resolver's festival/theatrical
     * release-date tolerance.
     */
    if (
      response.ok &&
      (data.results?.length ??
        0) === 0 &&
      params.has("year")
    ) {
      params.delete(
        "year",
      );

      response =
        await fetch(
          `${TMDB_API_URL}/search/movie?${params.toString()}`,
          {
            headers: {
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
            cache:
              "no-store",
          },
        );

      data =
        (await response.json()) as {
          results?: TmdbMovie[];
        };
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          message:
            "TMDB search failed.",
        },
        {
          status:
            response.status,
        },
      );
    }

    return NextResponse.json({
      success: true,
      results:
        (data.results ?? [])
          .slice(0, 10)
          .map(toMovie),
    });
  } catch (error) {
    console.error(
      "Could not search TMDB:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not search TMDB.",
      },
      {
        status: 500,
      },
    );
  }
}