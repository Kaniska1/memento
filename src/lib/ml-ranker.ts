import type {
  RecommendedMovie,
} from "@/types/recommendation";

type RecommendationStyle =
  | "familiar"
  | "balanced"
  | "adventurous";

type MlRankContext = {
  watchedCount: number;
  experienceScore: number;
  recommendationStyle: RecommendationStyle;
};

type MlRankedCandidate = {
  movieId: number;
  mlScore: number;
};

type MlResponse = {
  success: boolean;
  results?: MlRankedCandidate[];
  message?: string;
};

type MlRankedMovie =
  RecommendedMovie & {
    mlScore: number;
  };

export async function rankWithMl(
  movies: RecommendedMovie[],
  context: MlRankContext,
): Promise<MlRankedMovie[] | null> {
  const serviceUrl =
    process.env.ML_SERVICE_URL;

  if (
    !serviceUrl ||
    movies.length === 0
  ) {
    return null;
  }

  try {
    const response = await fetch(
      `${serviceUrl}/rank`,
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          candidates:
            movies.map(
              (
                movie,
              ) => ({
                /*
                 * Identifier used to rejoin
                 * the Python result with the
                 * original movie object.
                 */
                movieId:
                  movie.id,

                /*
                 * Features available BEFORE
                 * the recommendation is shown.
                 *
                 * These are safe for inference
                 * and don't leak future user
                 * actions into the model.
                 */

                matchScore:
                  movie.matchScore,

                tmdbRating:
                  movie.rating,

                mementoRating:
                  movie.mementoRating ??
                  0,

                mementoRatingCount:
                  movie.mementoRatingCount,

                international:
                  movie.international
                    ? 1
                    : 0,

                obscurityScore:
                  movie.obscurityScore,

                watchedCount:
                  context.watchedCount,

                experienceScore:
                  context.experienceScore,

                recommendationStyle:
                  context.recommendationStyle,
                
                genreAffinity:
  movie.genreAffinity,

seededSimilarity:
  movie.seededSimilarity,

qualityScore:
  movie.qualityScore,

popularityScore:
  movie.popularityScore,

voteStrength:
  movie.voteStrength,

sourceFavourite:
  movie.sourceFavourite
    ? 1
    : 0,

sourceGenre:
  movie.sourceGenre
    ? 1
    : 0,

sourceInternational:
  movie.sourceInternational
    ? 1
    : 0,

sourceObscure:
  movie.sourceObscure
    ? 1
    : 0,
              }),
            ),
        }),

        /*
         * ML should never block the
         * recommendation page for long.
         *
         * If Flask is unavailable or slow,
         * the caller falls back to the
         * deterministic ranking.
         */
        signal:
          AbortSignal.timeout(
            2500,
          ),

        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error(
        "ML ranker returned:",
        response.status,
      );

      return null;
    }

    const data =
      (await response.json()) as MlResponse;

    if (
      !data.success ||
      !data.results
    ) {
      return null;
    }

    /*
     * Rejoin Python scores with the
     * original recommendation objects.
     */
    const scoreMap =
      new Map<number, number>();

    for (const result of
      data.results) {
      if (
        Number.isFinite(
          result.movieId,
        ) &&
        typeof result.mlScore ===
          "number" &&
        Number.isFinite(
          result.mlScore,
        )
      ) {
        scoreMap.set(
          result.movieId,
          result.mlScore,
        );
      }
    }

    if (
      scoreMap.size === 0
    ) {
      return null;
    }

    return movies
      .map((movie) => ({
        ...movie,

        mlScore:
          scoreMap.get(
            movie.id,
          ) ?? 0,
      }))
      .sort(
        (a, b) =>
          b.mlScore -
          a.mlScore,
      );
  } catch (error) {
    /*
     * ML is an enhancement, not a
     * hard dependency.
     */
    console.error(
      "ML ranking unavailable:",
      error,
    );

    return null;
  }
}