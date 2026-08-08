import { type NextRequest, NextResponse } from "next/server";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_POSTER_URL = "https://image.tmdb.org/t/p/w500";

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

type TmdbSearchMovie = {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  overview?: string;
  genre_ids: number[];
  vote_average: number;
};

type TmdbSearchResponse = {
  results: TmdbSearchMovie[];
};

export async function GET(request: NextRequest) {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;
  const query =
    request.nextUrl.searchParams.get("query")?.trim() ?? "";

  if (!query || query.length < 2) {
    return NextResponse.json({
      results: [],
    });
  }

  if (!accessToken) {
    console.error("TMDB_ACCESS_TOKEN is missing.");

    return NextResponse.json(
      {
        message: "TMDB access token is missing.",
      },
      {
        status: 500,
      },
    );
  }

  try {
    const params = new URLSearchParams({
      query,
      language: "en-US",
      include_adult: "false",
      page: "1",
    });

    const response = await fetch(
      `${TMDB_API_URL}/search/movie?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      const responseText = await response.text();

      console.error(
        "TMDB search failed:",
        response.status,
        responseText,
      );

      return NextResponse.json(
        {
          message: `TMDB search failed with status ${response.status}.`,
        },
        {
          status: response.status,
        },
      );
    }

    const data =
      (await response.json()) as TmdbSearchResponse;

    const results = data.results
      .filter((movie) => movie.title)
      .slice(0, 12)
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        year:
          movie.release_date?.slice(0, 4) || "Unknown",
        poster: movie.poster_path
          ? `${TMDB_POSTER_URL}${movie.poster_path}`
          : null,
        overview: movie.overview || "",
        genreIds: movie.genre_ids,
        rating: movie.vote_average || 0,
        genre:
          genreMap[movie.genre_ids[0]] || "Film",
      }));

    return NextResponse.json({
      results,
    });
  } catch (error) {
    console.error("Could not search TMDB movies:", error);

    return NextResponse.json(
      {
        message: "Could not search for movies.",
      },
      {
        status: 500,
      },
    );
  }
}