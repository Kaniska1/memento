import { NextRequest, NextResponse } from "next/server";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_POSTER_URL = "https://image.tmdb.org/t/p/w500";

type TmdbMovie = {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  overview: string;
  genre_ids: number[];
  vote_average: number;
  vote_count: number;
  popularity: number;
};

type TmdbDiscoverResponse = {
  results: TmdbMovie[];
};

export async function GET(request: NextRequest) {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;

  const genres = request.nextUrl.searchParams
    .get("genres")
    ?.split(",")
    .map(Number)
    .filter(Number.isFinite);

  if (!accessToken) {
    return NextResponse.json(
      { message: "TMDB access token is missing." },
      { status: 500 },
    );
  }

  if (!genres || genres.length === 0) {
    return NextResponse.json(
      { message: "At least one genre is required." },
      { status: 400 },
    );
  }

  try {
    const response = await fetch(
      `${TMDB_API_URL}/discover/movie?` +
        new URLSearchParams({
          language: "en-US",
          include_adult: "false",
          include_video: "false",
          sort_by: "popularity.desc",
          "vote_count.gte": "500",
          with_genres: genres.join("|"),
          page: "1",
        }),
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`TMDB request failed with status ${response.status}`);
    }

    const data = (await response.json()) as TmdbDiscoverResponse;

    const results = data.results
      .filter((movie) => movie.poster_path && movie.title)
      .sort(
        (a, b) =>
          b.popularity - a.popularity ||
          b.vote_count - a.vote_count,
      )
      .slice(0, 12)
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        year: movie.release_date?.slice(0, 4) || "Unknown",
        poster: movie.poster_path
          ? `${TMDB_POSTER_URL}${movie.poster_path}`
          : null,
        overview: movie.overview,
        genreIds: movie.genre_ids,
      }));

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Could not load onboarding movies:", error);

    return NextResponse.json(
      { message: "Could not load movies for your selected genres." },
      { status: 500 },
    );
  }
}