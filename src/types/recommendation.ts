import type {
  InitialRating,
} from "./onboarding";

export type RecommendedMovie = {
  id: number;

  title: string;
  overview: string;

  year: string;

  poster: string;
  backdrop: string | null;

  rating: number;
  voteCount: number;

  mementoRating:
    | number
    | null;

  mementoRatingCount: number;

  genre: string;

  originalLanguage: string;

  international: boolean;

  obscurityScore: number;

  /*
   * ML-ready features.
   */
  genreAffinity: number;
  seededSimilarity: number;

  qualityScore: number;
  popularityScore: number;
  voteStrength: number;

  sourceFavourite: boolean;
  sourceGenre: boolean;
  sourceInternational: boolean;
  sourceObscure: boolean;

  matchScore: number;

  reason: string;
};

export type StoredOnboardingPreferences = {
  favouriteMovies: {
    movieId: number;
    title: string;
    year: string;
    poster: string | null;
    genre: string;
  }[];

  preferredGenreIds: number[];

  initialRatings: InitialRating[];
};