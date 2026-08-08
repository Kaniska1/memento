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

type TmdbMovie = {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  poster_path: string | null;
  vote_average: number;
  vote_count: number;
  genre_ids: number[];
};

type TmdbMovieResponse = {
  page: number;
  total_pages: number;
  total_results: number;
  results: TmdbMovie[];
};

function getSafeNumber(
  value: string | null,
  fallback: number,
  minimum: number,
  maximum: number,
) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, minimum), maximum);
}

export async function GET(request: NextRequest) {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      {
        message: "TMDB access token is missing.",
      },
      {
        status: 500,
      },
    );
  }

  const searchParams = request.nextUrl.searchParams;

  const query = searchParams.get("query")?.trim() || "";
  const genre = searchParams.get("genre")?.trim() || "";
  const sort = searchParams.get("sort") || "popularity.desc";
  const year = searchParams.get("year")?.trim() || "";
  const minimumRating = getSafeNumber(
    searchParams.get("rating"),
    0,
    0,
    10,
  );
  const page = getSafeNumber(
    searchParams.get("page"),
    1,
    1,
    500,
  );

  try {
    const tmdbParams = new URLSearchParams({
      language: "en-US",
      include_adult: "false",
      page: String(page),
    });

    let endpoint = `${TMDB_API_URL}/discover/movie`;

    if (query.length >= 2) {
      endpoint = `${TMDB_API_URL}/search/movie`;

      tmdbParams.set("query", query);
    } else {
      tmdbParams.set("include_video", "false");
      tmdbParams.set("sort_by", sort);
      tmdbParams.set("vote_average.gte", String(minimumRating));
      tmdbParams.set("vote_count.gte", "50");

      if (genre) {
        tmdbParams.set("with_genres", genre);
      }

      if (year) {
        tmdbParams.set("primary_release_year", year);
      }
    }

    const response = await fetch(
      `${endpoint}?${tmdbParams.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          accept: "application/json",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(
        `TMDB request failed with status ${response.status}`,
      );
    }

    const data = (await response.json()) as TmdbMovieResponse;

    let filteredResults = data.results;

    // Search results do not support all discover filters,
    // so apply the relevant ones locally.
    if (query.length >= 2) {
      filteredResults = filteredResults.filter((movie) => {
        const matchesGenre =
          !genre || movie.genre_ids.includes(Number(genre));

        const matchesYear =
          !year || movie.release_date?.startsWith(year);

        const matchesRating =
          movie.vote_average >= minimumRating;

        return matchesGenre && matchesYear && matchesRating;
      });
    }

    const results = filteredResults
      .filter((movie) => movie.title)
      .map((movie) => ({
        id: movie.id,
        title: movie.title,
        overview: movie.overview,
        year: movie.release_date?.slice(0, 4) || "Upcoming",
        poster: movie.poster_path
          ? `${TMDB_POSTER_URL}${movie.poster_path}`
          : null,
        rating: movie.vote_average || 0,
        voteCount: movie.vote_count || 0,
        genre:
          genreMap[movie.genre_ids[0]] || "Film",
      }));

    return NextResponse.json({
      page: data.page,
      totalPages: Math.min(data.total_pages, 500),
      totalResults: data.total_results,
      results,
    });
  } catch (error) {
    console.error("Could not discover movies:", error);

    return NextResponse.json(
      {
        message: "Could not load movies.",
      },
      {
        status: 500,
      },
    );
  }
}