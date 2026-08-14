import type {
  RecommendedMovie,
} from "@/types/recommendation";

export type RecommendationMeta = {
  watchedCount: number;
  experienceScore: number;

  recommendationStyle:
    | "familiar"
    | "balanced"
    | "adventurous";
};

export type RecommendationImpressionInput = {
  movie: RecommendedMovie;
  position: number;
};

type RecordImpressionsResponse = {
  success: boolean;
  recorded?: number;
  message?: string;
};

export async function recordRecommendationImpressions(
  items: RecommendationImpressionInput[],
  meta: RecommendationMeta,
) {
  if (items.length === 0) {
    return;
  }

  const response = await fetch(
    "/api/recommendation-impressions",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        /*
         * User context at the moment
         * these recommendations were shown.
         */
        watchedCount:
          meta.watchedCount,

        experienceScore:
          meta.experienceScore,

        recommendationStyle:
          meta.recommendationStyle,

        /*
         * Freeze all ranking features at
         * impression time.
         *
         * Later user actions are deliberately
         * NOT included here. Those become
         * training outcomes/labels instead.
         */
        impressions:
          items.map(
            ({
              movie,
              position,
            }) => ({
              movieId:
                movie.id,

              /*
               * Stored for exposure-bias
               * analysis, but not used as
               * an ML ranking feature.
               */
              position,

              /*
               * Existing ranking features.
               */
              matchScore:
                movie.matchScore,

              tmdbRating:
                movie.rating,

              mementoRating:
                movie.mementoRating,

              mementoRatingCount:
                movie.mementoRatingCount,

              international:
                movie.international,

              obscurityScore:
                movie.obscurityScore,

              /*
               * Richer ML features.
               */
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

              /*
               * Candidate-generation source
               * signals.
               */
              sourceFavourite:
                movie.sourceFavourite,

              sourceGenre:
                movie.sourceGenre,

              sourceInternational:
                movie.sourceInternational,

              sourceObscure:
                movie.sourceObscure,
            }),
          ),
      }),
    },
  );

  const data =
    (await response.json()) as
      RecordImpressionsResponse;

  if (
    !response.ok ||
    !data.success
  ) {
    throw new Error(
      data.message ||
        "Could not record recommendation impressions.",
    );
  }

  return data;
}