import { NextRequest, NextResponse } from "next/server";

const TMDB_API_URL =
  "https://api.themoviedb.org/3";

const TMDB_POSTER_URL =
  "https://image.tmdb.org/t/p/w500";

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
  53: "Thriller",
  10752: "War",
  37: "Western",
};

type TmdbMovie = {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
};

type TmdbResponse = {
  results: TmdbMovie[];
};

export async function GET(
  request: NextRequest,
) {
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

  const genres =
    request.nextUrl.searchParams.get(
      "genres",
    );

  if (!genres) {
    return NextResponse.json({
      success: true,
      movies: [],
    });
  }

  try {
    const params =
      new URLSearchParams({
        language: "en-US",
        include_adult: "false",
        include_video: "false",

        // OR logic between selected genres
        with_genres: genres,

        sort_by:
          "popularity.desc",

        "vote_count.gte":
          "1000",

        page: "1",
      });

    const response = await fetch(
      `${TMDB_API_URL}/discover/movie?${params.toString()}`,
      {
        headers: {
          Authorization:
            `Bearer ${token}`,

          accept:
            "application/json",
        },

        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(
        `TMDB returned ${response.status}`,
      );
    }

    const data =
      (await response.json()) as TmdbResponse;

    const movies =
      data.results
        .filter(
          (movie) =>
            movie.poster_path &&
            movie.vote_count >=
              1000,
        )
        .slice(0, 20)
        .map((movie) => ({
          id: movie.id,

          title: movie.title,

          year:
            movie.release_date?.slice(
              0,
              4,
            ) ?? "Unknown",

          poster: movie.poster_path
            ? `${TMDB_POSTER_URL}${movie.poster_path}`
            : null,

          rating:
            movie.vote_average,

          voteCount:
            movie.vote_count,

          popularity:
            movie.popularity,

          genre:
            genreMap[
              movie.genre_ids[0]
            ] ?? "Film",
        }));

    return NextResponse.json({
      success: true,
      movies,
    });
  } catch (error) {
    console.error(
      "Could not load onboarding movies:",
      error,
    );

    return NextResponse.json(
      {
        success: false,
        message:
          "Could not load movie suggestions.",
      },
      {
        status: 500,
      },
    );
  }
}