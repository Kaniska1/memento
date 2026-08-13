import type {
  StoredOnboardingPreferences,
} from "@/types/recommendation";

type OnboardingResponse = {
  success: boolean;
  message?: string;

  onboarding?: {
    favouriteMovies?: {
      movieId: number;
      title: string;
      year: string;
      poster: string | null;
      genre: string;
    }[];

    preferredGenreIds?: number[];

    initialRatings?: {
      movieId: number;
      rating: number;
    }[];

    onboardingCompleted?: boolean;
  };
};

export async function fetchOnboardingPreferences(): Promise<StoredOnboardingPreferences | null> {
  const response = await fetch(
    "/api/onboarding",
    {
      credentials: "include",
      cache: "no-store",
    },
  );

  const data =
    (await response.json()) as OnboardingResponse;

  if (!response.ok) {
    throw new Error(
      data.message ||
        "Could not load onboarding preferences.",
    );
  }

  if (!data.onboarding) {
    return null;
  }

  return {
    favouriteMovies:
      data.onboarding.favouriteMovies ??
      [],

    preferredGenreIds:
      data.onboarding.preferredGenreIds ??
      [],

    initialRatings:
      data.onboarding.initialRatings ??
      [],
  };
}