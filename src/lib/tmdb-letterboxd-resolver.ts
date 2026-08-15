const TMDB_API_URL =
  "https://api.themoviedb.org/3";

const TMDB_POSTER_URL =
  "https://image.tmdb.org/t/p/w500";

const TMDB_BACKDROP_URL =
  "https://image.tmdb.org/t/p/original";

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

export type LetterboxdResolveInput = {
  key: string;
  name: string;
  year: string;
  letterboxdUri: string;
};

type TmdbSearchMovie = {
  id: number;
  title: string;
  original_title: string;
  release_date?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  genre_ids: number[];
  original_language: string;
  vote_average: number;
  vote_count: number;
  popularity: number;
};

type TmdbSearchResponse = {
  results?: TmdbSearchMovie[];
};

export type ResolvedLetterboxdMovie = {
  key: string;

  letterboxd: {
    name: string;
    year: string;
    uri: string;
  };

  status:
    | "matched"
    | "review"
    | "unmatched";

  confidence:
    | "exact"
    | "high"
    | "medium"
    | "none";

  tmdb: {
    id: number;
    title: string;
    year: string;
    poster: string | null;
    backdrop: string | null;
    genre: string;
    originalLanguage: string;
    rating: number;
    voteCount: number;
  } | null;

  alternatives: Array<{
    id: number;
    title: string;
    year: string;
    poster: string | null;
    rating: number;
  }>;
};

function normalizeTitle(
  value: string,
) {
  return value
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      "",
    )
    .toLowerCase()
    .replace(
      /&/g,
      " and ",
    )
    .replace(
      /[^a-z0-9]+/g,
      " ",
    )
    .trim()
    .replace(
      /\s+/g,
      " ",
    );
}

function getYear(
  releaseDate?: string,
) {
  return (
    releaseDate?.slice(
      0,
      4,
    ) ?? ""
  );
}

function posterUrl(
  path: string | null,
) {
  return path
    ? `${TMDB_POSTER_URL}${path}`
    : null;
}

function backdropUrl(
  path: string | null,
) {
  return path
    ? `${TMDB_BACKDROP_URL}${path}`
    : null;
}

function toAlternative(
  movie: TmdbSearchMovie,
) {
  return {
    id: movie.id,
    title: movie.title,
    year: getYear(
      movie.release_date,
    ),
    poster:
      posterUrl(
        movie.poster_path,
      ),
    rating:
      movie.vote_average || 0,
  };
}

function toResolvedTmdb(
  movie: TmdbSearchMovie,
) {
  const firstGenre =
    movie.genre_ids?.[0];

  return {
    id: movie.id,
    title: movie.title,
    year: getYear(
      movie.release_date,
    ),
    poster:
      posterUrl(
        movie.poster_path,
      ),
    backdrop:
      backdropUrl(
        movie.backdrop_path,
      ),
    genre:
      genreMap[firstGenre] ??
      "Film",
    originalLanguage:
      movie.original_language ??
      "",
    rating:
      movie.vote_average || 0,
    voteCount:
      movie.vote_count || 0,
  };
}

function scoreCandidate(
  input: LetterboxdResolveInput,
  movie: TmdbSearchMovie,
) {
  const sourceTitle =
    normalizeTitle(
      input.name,
    );

  const title =
    normalizeTitle(
      movie.title,
    );

  const originalTitle =
    normalizeTitle(
      movie.original_title,
    );

  const requestedYear =
    Number(input.year);

  const candidateYear =
    Number(
      getYear(
        movie.release_date,
      ),
    );

  const exactTitle =
    sourceTitle === title ||
    sourceTitle ===
      originalTitle;

  const yearDistance =
    Number.isFinite(
      requestedYear,
    ) &&
    Number.isFinite(
      candidateYear,
    )
      ? Math.abs(
          requestedYear -
            candidateYear,
        )
      : null;

  let score = 0;

  if (exactTitle) {
    score += 100;
  } else if (
    title.includes(
      sourceTitle,
    ) ||
    sourceTitle.includes(
      title,
    ) ||
    originalTitle.includes(
      sourceTitle,
    ) ||
    sourceTitle.includes(
      originalTitle,
    )
  ) {
    score += 60;
  }

  if (
    yearDistance === 0
  ) {
    score += 45;
  } else if (
    yearDistance === 1
  ) {
    /*
     * Letterboxd/TMDB occasionally disagree
     * by one year because of festival vs.
     * theatrical release dates.
     */
    score += 20;
  } else if (
    yearDistance !== null &&
    yearDistance >= 3
  ) {
    score -= 30;
  }

  /*
   * Popularity is deliberately only a tiny
   * tie-breaker. A remake must not win simply
   * because it is more famous.
   */
  score += Math.min(
    Math.log10(
      Math.max(
        movie.vote_count,
        1,
      ),
    ),
    5,
  );

  return {
    score,
    exactTitle,
    yearDistance,
  };
}

async function searchTmdb(
  input: LetterboxdResolveInput,
  accessToken: string,
) {
  const params =
    new URLSearchParams({
      query:
        input.name,

      include_adult:
        "false",

      language:
        "en-US",

      page:
        "1",
    });

  if (input.year) {
    params.set(
      "year",
      input.year,
    );
  }

  const response =
    await fetch(
      `${TMDB_API_URL}/search/movie?${params.toString()}`,
      {
        headers: {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${accessToken}`,
        },

        cache:
          "no-store",
      },
    );

  if (!response.ok) {
    throw new Error(
      `TMDB search failed with ${response.status}.`,
    );
  }

  const data =
    (await response.json()) as TmdbSearchResponse;

  let results =
    data.results ?? [];

  /*
   * A strict year-filtered search can be empty
   * when Letterboxd and TMDB disagree by one
   * release year. Retry without the filter,
   * then let our scorer decide.
   */
  if (
    results.length === 0 &&
    input.year
  ) {
    params.delete(
      "year",
    );

    const fallbackResponse =
      await fetch(
        `${TMDB_API_URL}/search/movie?${params.toString()}`,
        {
          headers: {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${accessToken}`,
          },

          cache:
            "no-store",
        },
      );

    if (
      fallbackResponse.ok
    ) {
      const fallbackData =
        (await fallbackResponse.json()) as TmdbSearchResponse;

      results =
        fallbackData.results ??
        [];
    }
  }

  return results;
}

export async function resolveLetterboxdMovie(
  input: LetterboxdResolveInput,
  accessToken: string,
): Promise<ResolvedLetterboxdMovie> {
  const results =
    await searchTmdb(
      input,
      accessToken,
    );

  if (
    results.length === 0
  ) {
    return {
      key: input.key,

      letterboxd: {
        name:
          input.name,

        year:
          input.year,

        uri:
          input.letterboxdUri,
      },

      status:
        "unmatched",

      confidence:
        "none",

      tmdb: null,

      alternatives: [],
    };
  }

  const scored =
    results
      .map(
        (movie) => ({
          movie,
          ...scoreCandidate(
            input,
            movie,
          ),
        }),
      )
      .sort(
        (a, b) =>
          b.score -
          a.score,
      );

  const best =
    scored[0];

  const alternatives =
    scored
      .slice(0, 5)
      .map(
        ({ movie }) =>
          toAlternative(
            movie,
          ),
      );

  if (!best) {
    return {
      key:
        input.key,

      letterboxd: {
        name:
          input.name,

        year:
          input.year,

        uri:
          input.letterboxdUri,
      },

      status:
        "unmatched",

      confidence:
        "none",

      tmdb:
        null,

      alternatives,
    };
  }

  let status:
    ResolvedLetterboxdMovie["status"] =
      "review";

  let confidence:
    ResolvedLetterboxdMovie["confidence"] =
      "medium";

  if (
    best.exactTitle &&
    best.yearDistance === 0
  ) {
    status =
      "matched";

    confidence =
      "exact";
  } else if (
    best.exactTitle &&
    (
      best.yearDistance ===
        1 ||
      best.yearDistance ===
        null
    )
  ) {
    status =
      "matched";

    confidence =
      "high";
  } else if (
    best.score >= 120
  ) {
    status =
      "matched";

    confidence =
      "high";
  }

  /*
   * Anything weaker remains in "review".
   * We return the best candidate but will not
   * silently commit it during Phase 3 until
   * the user approves ambiguous matches.
   */
  return {
    key:
      input.key,

    letterboxd: {
      name:
        input.name,

      year:
        input.year,

      uri:
        input.letterboxdUri,
    },

    status,

    confidence,

    tmdb:
      toResolvedTmdb(
        best.movie,
      ),

    alternatives,
  };
}