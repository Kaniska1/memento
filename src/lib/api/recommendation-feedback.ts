import type {
  RecommendedMovie,
} from "@/types/recommendation";

export type RecommendationFeedbackAction =
  | "seen"
  | "not_interested"
  | "opened";

type SaveFeedbackOptions = {
  watchedCount?: number | null;

  recommendationStyle?:
    | "familiar"
    | "balanced"
    | "adventurous"
    | null;
};

export async function saveRecommendationFeedback(
  movie: RecommendedMovie,
  action: RecommendationFeedbackAction,
  options?: SaveFeedbackOptions,
) {
  const response = await fetch(
    "/api/recommendation-feedback",
    {
      method: "POST",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        movieId: movie.id,
        action,

        matchScore:
          movie.matchScore,

        watchedCount:
          options?.watchedCount ??
          null,

        recommendationStyle:
          options?.recommendationStyle ??
          null,

        international:
          movie.international,

        obscurityScore:
          movie.obscurityScore,

        tmdbRating:
          movie.rating,
      }),
    },
  );

  const data =
    (await response.json()) as {
      success: boolean;
      message?: string;
    };

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Could not save recommendation feedback.",
    );
  }
}

export async function removeRecommendationFeedback(
  movieId: number,
  action: RecommendationFeedbackAction,
) {
  const response = await fetch(
    "/api/recommendation-feedback",
    {
      method: "DELETE",

      headers: {
        "Content-Type":
          "application/json",
      },

      credentials: "include",

      body: JSON.stringify({
        movieId,
        action,
      }),
    },
  );

  const data =
    (await response.json()) as {
      success: boolean;
      message?: string;
    };

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Could not remove recommendation feedback.",
    );
  }
}