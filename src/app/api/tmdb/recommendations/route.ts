import { type NextRequest, NextResponse } from "next/server";

const TMDB_API_URL = "https://api.themoviedb.org/3";
const TMDB_POSTER_URL = "https://image.tmdb.org/t/p/w500";
const TMDB_BACKDROP_URL = "https://image.tmdb.org/t/p/original";

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
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  popularity: number;
  genre_ids: number[];
};

type TmdbMovieResponse = {
  results: TmdbMovie[];
};

type RecommendationCandidate = TmdbMovie & {
  sourceMovieId?: number;
};

export async function GET(request: NextRequest) {
  const accessToken = process.env.TMDB_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json(
      { message: "TMDB access token is missing." },
      { status: 500 },
    );
  }

  const favouriteIds = request.nextUrl.searchParams
    .get("favourites")
    ?.split(",")
    .map(Number)
    .filter(Number.isFinite) ?? [];

  const genreIds = request.nextUrl.searchParams
    .get("genres")
    ?.split(",")
    .map(Number)
    .filter(Number.isFinite) ?? [];

  if (favouriteIds.length === 0 && genreIds.length === 0) {
    return NextResponse.json(
      {
        message:
          "Favourite movies or preferred genres are required.",
      },
      { status: 400 },
    );
  }

  try {
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      accept: "application/json",
    };

    const recommendationRequests = favouriteIds
      .slice(0, 4)
      .map(async (movieId) => {
        const response = await fetch(
          `${TMDB_API_URL}/movie/${movieId}/recommendations?language=en-US&page=1`,
          {
            headers,
            cache: "no-store",
          },
        );

        if (!response.ok) {
          return [] as RecommendationCandidate[];
        }

        const data =
          (await response.json()) as TmdbMovieResponse;

        return data.results.map((movie) => ({
          ...movie,
          sourceMovieId: movieId,
        }));
      });

    const genreRequest =
      genreIds.length > 0
        ? fetch(
            `${TMDB_API_URL}/discover/movie?${new URLSearchParams({
              language: "en-US",
              include_adult: "false",
              include_video: "false",
              sort_by: "popularity.desc",
              "vote_count.gte": "300",
              with_genres: genreIds.join("|"),
              page: "1",
            })}`,
            {
              headers,
              cache: "no-store",
            },
          ).then(async (response) => {
            if (!response.ok) {
              return [] as RecommendationCandidate[];
            }

            const data =
              (await response.json()) as TmdbMovieResponse;

            return data.results;
          })
        : Promise.resolve([] as RecommendationCandidate[]);

    const [genreMovies, ...favouriteRecommendations] =
      await Promise.all([
        genreRequest,
        ...recommendationRequests,
      ]);

    const allCandidates = [
      ...favouriteRecommendations.flat(),
      ...genreMovies,
    ];

    const excludedIds = new Set(favouriteIds);
    const uniqueMovies = new Map<
      number,
      RecommendationCandidate
    >();

    for (const movie of allCandidates) {
      if (
        excludedIds.has(movie.id) ||
        !movie.poster_path ||
        !movie.title
      ) {
        continue;
      }

      const existing = uniqueMovies.get(movie.id);

      if (!existing || movie.popularity > existing.popularity) {
        uniqueMovies.set(movie.id, movie);
      }
    }

    const results = Array.from(uniqueMovies.values())
      .map((movie) => {
        const matchingGenres = movie.genre_ids.filter((genreId) =>
          genreIds.includes(genreId),
        );

        const qualityScore = Math.min(
          (movie.vote_average / 10) * 30,
          30,
        );

        const popularityScore = Math.min(
          movie.popularity / 20,
          15,
        );

        const genreScore = Math.min(
          matchingGenres.length * 12,
          30,
        );

        const favouriteSourceScore = movie.sourceMovieId
          ? 25
          : 0;

        const matchScore = Math.min(
          Math.round(
            qualityScore +
              popularityScore +
              genreScore +
              favouriteSourceScore,
          ),
          99,
        );

        let reason = "Popular within your preferred genres.";

        if (movie.sourceMovieId) {
          reason =
            "Recommended because it is similar to one of your favourite films.";
        } else if (matchingGenres.length > 1) {
          reason = `Matches ${matchingGenres.length} of your preferred genres.`;
        } else if (matchingGenres.length === 1) {
          reason = `Fits your interest in ${
            genreMap[matchingGenres[0]] || "this genre"
          }.`;
        }

        return {
          id: movie.id,
          title: movie.title,
          overview: movie.overview,
          year:
            movie.release_date?.slice(0, 4) || "Upcoming",
          poster: `${TMDB_POSTER_URL}${movie.poster_path}`,
          backdrop: movie.backdrop_path
            ? `${TMDB_BACKDROP_URL}${movie.backdrop_path}`
            : null,
          rating: movie.vote_average || 0,
          voteCount: movie.vote_count || 0,
          genre:
            genreMap[movie.genre_ids[0]] || "Film",
          matchScore,
          reason,
        };
      })
      .sort(
        (a, b) =>
          b.matchScore - a.matchScore ||
          b.rating - a.rating,
      )
      .slice(0, 24);

    return NextResponse.json({ results });
  } catch (error) {
    console.error("Could not create recommendations:", error);

    return NextResponse.json(
      {
        message: "Could not generate recommendations.",
      },
      { status: 500 },
    );
  }
}